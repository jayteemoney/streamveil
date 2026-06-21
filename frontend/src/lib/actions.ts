import { ethers } from "ethers";
import { STREAMVEIL_ADDRESS, TOKEN_ADDRESS, streamVeilContract, tokenContract } from "./contracts";
import { getFhevmInstance } from "./fhevm";

const FAR_FUTURE = 2n ** 47n; // operator approval expiry (well beyond any demo)

async function ensureOperator(signer: ethers.Signer) {
  const user = await signer.getAddress();
  const token = tokenContract(signer);
  const already: boolean = await token.isOperator(user, STREAMVEIL_ADDRESS);
  if (!already) {
    const tx = await token.setOperator(STREAMVEIL_ADDRESS, FAR_FUTURE);
    await tx.wait();
  }
}

/** Reuse a DAO org per user (cached in localStorage), creating one on first use. */
async function getOrCreateOrg(signer: ethers.Signer, name: string): Promise<bigint> {
  const user = (await signer.getAddress()).toLowerCase();
  const key = `streamveil:org:${user}`;
  const sv = streamVeilContract(signer);

  const cached = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  if (cached) {
    try {
      const org = await sv.getOrganization(BigInt(cached));
      if (org.admin.toLowerCase() === user) return BigInt(cached);
    } catch {
      /* fall through and create a fresh org */
    }
  }

  const tx = await sv.registerOrganization(name || "My DAO");
  await tx.wait();
  const orgId: bigint = await sv.orgCount();
  if (typeof window !== "undefined") window.localStorage.setItem(key, orgId.toString());
  return orgId;
}

export async function faucet(signer: ethers.Signer) {
  const tx = await tokenContract(signer).faucet();
  return tx.wait();
}

export async function createStream(
  signer: ethers.Signer,
  params: { recipient: string; amount: bigint; durationSeconds: number; orgName: string },
) {
  const user = await signer.getAddress();
  await ensureOperator(signer);
  const orgId = await getOrCreateOrg(signer, params.orgName);

  const instance = await getFhevmInstance();
  const enc = await instance
    .createEncryptedInput(STREAMVEIL_ADDRESS, user)
    .add64(params.amount)
    .encrypt();

  const start = Math.floor(Date.now() / 1000);
  const stop = start + params.durationSeconds;

  const sv = streamVeilContract(signer);
  const tx = await sv.createStream(
    orgId,
    params.recipient,
    TOKEN_ADDRESS,
    start,
    stop,
    enc.handles[0],
    enc.inputProof,
  );
  return tx.wait();
}

export async function topUp(
  signer: ethers.Signer,
  streamId: number,
  amount: bigint,
  extendSeconds: number,
) {
  const user = await signer.getAddress();
  await ensureOperator(signer);
  const instance = await getFhevmInstance();
  const enc = await instance.createEncryptedInput(STREAMVEIL_ADDRESS, user).add64(amount).encrypt();
  const tx = await streamVeilContract(signer).topUp(streamId, enc.handles[0], enc.inputProof, extendSeconds);
  return tx.wait();
}

export async function pause(signer: ethers.Signer, streamId: number) {
  return (await streamVeilContract(signer).pause(streamId)).wait();
}
export async function resume(signer: ethers.Signer, streamId: number) {
  return (await streamVeilContract(signer).resume(streamId)).wait();
}
export async function cancel(signer: ethers.Signer, streamId: number) {
  return (await streamVeilContract(signer).cancel(streamId)).wait();
}
export async function claim(signer: ethers.Signer, streamId: number) {
  return (await streamVeilContract(signer).claim(streamId)).wait();
}
export async function setAuditor(signer: ethers.Signer, streamId: number, auditor: string) {
  return (await streamVeilContract(signer).setAuditor(streamId, auditor)).wait();
}
