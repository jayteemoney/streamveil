"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/store";
import { useTokenBalanceHandle } from "@/lib/hooks";
import { TOKEN_ADDRESS } from "@/lib/contracts";
import { getFhevmInstance } from "@/lib/fhevm";
import { userDecrypt } from "@/lib/decrypt";
import { faucet } from "@/lib/actions";
import { formatAmount } from "@/lib/format";
import { isZeroHandle } from "@/lib/stream";

export function FaucetCard() {
  const { address, getSigner, decrypted, setDecrypted, notify, notifyError } = useWallet();
  const { data: handle } = useTokenBalanceHandle(address);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"" | "faucet" | "reveal">("");

  const clear = handle && !isZeroHandle(handle) ? decrypted[handle] : 0n;
  const revealed = handle ? handle in decrypted || isZeroHandle(handle) : false;

  async function onFaucet() {
    setBusy("faucet");
    try {
      await faucet(await getSigner());
      await qc.invalidateQueries({ queryKey: ["balance"] });
      notify("Minted 1,000 svUSD to your wallet.", "success");
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy("");
    }
  }

  async function onReveal() {
    if (!handle || isZeroHandle(handle)) return;
    setBusy("reveal");
    try {
      const instance = await getFhevmInstance();
      const signer = await getSigner();
      const res = await userDecrypt(instance, signer, [{ handle, contractAddress: TOKEN_ADDRESS }]);
      setDecrypted(res);
      notify("Balance decrypted.", "success");
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[var(--color-muted)]">Your confidential balance</div>
          <div className="mt-1 font-mono text-2xl font-semibold">
            {revealed ? (
              <>
                {formatAmount(clear)} <span className="text-base text-[var(--color-muted)]">svUSD</span>
              </>
            ) : (
              <span className="text-[var(--color-muted)]">•••••• svUSD</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReveal}
            disabled={!handle || isZeroHandle(handle) || busy !== ""}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-accent2)] disabled:opacity-40"
          >
            {busy === "reveal" ? "Decrypting…" : "Reveal"}
          </button>
          <button
            onClick={onFaucet}
            disabled={busy !== ""}
            className="rounded-lg bg-[var(--color-accent2)]/90 px-3 py-2 text-sm font-semibold text-[#04201c] hover:bg-[var(--color-accent2)] disabled:opacity-50"
          >
            {busy === "faucet" ? "Minting…" : "Faucet +1,000"}
          </button>
        </div>
      </div>
    </div>
  );
}
