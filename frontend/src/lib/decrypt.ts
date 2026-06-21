import { ethers } from "ethers";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { STREAMVEIL_ADDRESS, TOKEN_ADDRESS } from "./contracts";

export type HandlePair = { handle: string; contractAddress: string };

// Authorize both protocol contracts with a single signature so users sign once per session.
const AUTH_CONTRACTS = [TOKEN_ADDRESS, STREAMVEIL_ADDRESS];

type DecryptAuth = {
  user: string;
  contracts: string[];
  keypair: { publicKey: string; privateKey: string };
  signature: string;
  startTimestamp: number;
  durationDays: number;
};

// One EIP-712 signature authorizes decryption for a set of contracts for `durationDays`.
// We cache it so the user signs once per session instead of on every reveal.
let cachedAuth: DecryptAuth | null = null;

function authCovers(auth: DecryptAuth, user: string, contracts: string[]): boolean {
  if (auth.user.toLowerCase() !== user.toLowerCase()) return false;
  const set = new Set(auth.contracts.map((c) => c.toLowerCase()));
  if (!contracts.every((c) => set.has(c.toLowerCase()))) return false;
  const ageDays = (Date.now() / 1000 - auth.startTimestamp) / 86400;
  return ageDays < auth.durationDays - 1; // refresh a day before expiry
}

async function ensureAuth(
  instance: FhevmInstance,
  signer: ethers.Signer,
  user: string,
  contracts: string[],
): Promise<DecryptAuth> {
  if (cachedAuth && authCovers(cachedAuth, user, contracts)) return cachedAuth;

  const keypair = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 10;

  const eip712 = instance.createEIP712(keypair.publicKey, contracts, startTimestamp, durationDays);
  const signature = await signer.signTypedData(
    eip712.domain as ethers.TypedDataDomain,
    {
      UserDecryptRequestVerification: [
        ...eip712.types.UserDecryptRequestVerification,
      ] as ethers.TypedDataField[],
    },
    eip712.message as Record<string, unknown>,
  );

  cachedAuth = {
    user,
    contracts,
    keypair,
    signature: signature.replace(/^0x/, ""),
    startTimestamp,
    durationDays,
  };
  return cachedAuth;
}

/**
 * Decrypt a batch of ciphertext handles the connected user is authorized for.
 * Returns a map of handle -> bigint. Prompts for a single EIP-712 signature the
 * first time (then reuses it for the session).
 */
export async function userDecrypt(
  instance: FhevmInstance,
  signer: ethers.Signer,
  pairs: HandlePair[],
): Promise<Record<string, bigint>> {
  const user = await signer.getAddress();
  const auth = await ensureAuth(instance, signer, user, AUTH_CONTRACTS);

  const result = await instance.userDecrypt(
    pairs,
    auth.keypair.privateKey,
    auth.keypair.publicKey,
    auth.signature,
    auth.contracts,
    user,
    auth.startTimestamp,
    auth.durationDays,
  );

  const out: Record<string, bigint> = {};
  for (const { handle } of pairs) {
    const v = result[handle as `0x${string}`];
    out[handle] = typeof v === "bigint" ? v : BigInt(v as unknown as number);
  }
  return out;
}

export function resetDecryptAuth() {
  cachedAuth = null;
}
