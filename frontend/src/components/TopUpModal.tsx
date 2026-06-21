"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/store";
import { topUp } from "@/lib/actions";
import { parseAmount } from "@/lib/format";

const EXTENSIONS = [
  { label: "No extension", seconds: 0 },
  { label: "+5 minutes (demo)", seconds: 300 },
  { label: "+1 hour", seconds: 3600 },
  { label: "+1 day", seconds: 86400 },
  { label: "+30 days", seconds: 30 * 86400 },
];

export function TopUpModal({ streamId, onClose }: { streamId: number; onClose: () => void }) {
  const { getSigner, notify, notifyError } = useWallet();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("50");
  const [extend, setExtend] = useState(EXTENSIONS[1].seconds);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = Number(amount) > 0;

  async function submit() {
    setErr(null);
    if (!valid) {
      setErr("Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    try {
      await topUp(await getSigner(), streamId, parseAmount(amount), extend);
      await qc.invalidateQueries();
      notify("Stream topped up.", "success");
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
        <h2 className="text-lg font-semibold">Top up stream #{streamId}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Add encrypted funds to this stream. The per-second rate stays the same, so extend the
          end time to let the extra amount stream out.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">Add amount (svUSD)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">Extend by</span>
            <select
              value={extend}
              onChange={(e) => setExtend(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            >
              {EXTENSIONS.map((d) => (
                <option key={d.seconds} value={d.seconds}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>

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
            {busy ? "Encrypting & sending…" : "Top up"}
          </button>
        </div>
      </div>
    </div>
  );
}
