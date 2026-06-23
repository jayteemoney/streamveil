"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/store";
import { setAuditor } from "@/lib/actions";
import { shortAddr } from "@/lib/format";

const ZERO = "0x0000000000000000000000000000000000000000";

export function AuditorModal({
  streamId,
  currentAuditor,
  onClose,
}: {
  streamId: number;
  currentAuditor: string;
  onClose: () => void;
}) {
  const { getSigner, notify, notifyError } = useWallet();
  const qc = useQueryClient();
  const [auditor, setAuditorAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasAuditor = currentAuditor && currentAuditor !== ZERO;
  const valid = ethers.isAddress(auditor);

  async function submit() {
    setErr(null);
    if (!valid) {
      setErr("Enter a valid wallet address (0x…).");
      return;
    }
    setBusy(true);
    try {
      await setAuditor(await getSigner(), streamId, auditor);
      await qc.invalidateQueries();
      notify("Auditor added — they can now reveal this stream.", "success");
      onClose();
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Add an auditor to stream #{streamId}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Grant one address permission to decrypt this stream&apos;s amounts (deposit, rate, and
          claimed). Compliance on your terms — only this stream, and only the address you choose.
        </p>

        {hasAuditor && (
          <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
            <span className="text-[var(--color-muted)]">Current auditor: </span>
            <span className="font-mono">{shortAddr(currentAuditor)}</span>
          </div>
        )}

        <label className="mt-4 block text-sm">
          <span className="text-[var(--color-muted)]">{hasAuditor ? "Replace with address" : "Auditor address"}</span>
          <input
            value={auditor}
            onChange={(e) => setAuditorAddr(e.target.value)}
            placeholder="0x…"
            autoFocus
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        {err && <p className="mt-3 break-words text-sm text-red-400">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !valid}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Grant access"}
          </button>
        </div>
      </div>
    </div>
  );
}
