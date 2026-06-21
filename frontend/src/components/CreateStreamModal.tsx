"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/store";
import { createStream } from "@/lib/actions";
import { parseAmount } from "@/lib/format";

const DURATIONS = [
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86400 },
  { label: "30 days", seconds: 30 * 86400 },
  { label: "5 minutes (demo)", seconds: 300 },
];

export function CreateStreamModal({ onClose }: { onClose: () => void }) {
  const { getSigner, notify, notifyError } = useWallet();
  const qc = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("100");
  const [duration, setDuration] = useState(DURATIONS[3].seconds);
  const [orgName, setOrgName] = useState("Acme DAO");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = ethers.isAddress(recipient) && Number(amount) > 0;

  async function submit() {
    setErr(null);
    if (!valid) {
      setErr("Enter a valid recipient address and amount.");
      return;
    }
    setBusy(true);
    try {
      await createStream(await getSigner(), {
        recipient,
        amount: parseAmount(amount),
        durationSeconds: duration,
        orgName,
      });
      await qc.invalidateQueries();
      notify("Confidential stream created.", "success");
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
        <h2 className="text-lg font-semibold">New confidential stream</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          The amount is encrypted in your browser — only you, the recipient, and an optional auditor can read it.
        </p>

        <label className="mt-5 block text-sm">
          <span className="text-[var(--color-muted)]">Recipient address</span>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x…"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">Amount (svUSD)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--color-muted)]">Duration</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            >
              {DURATIONS.map((d) => (
                <option key={d.seconds} value={d.seconds}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm">
          <span className="text-[var(--color-muted)]">Organization / DAO</span>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !valid}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Encrypting & sending…" : "Create stream"}
          </button>
        </div>
      </div>
    </div>
  );
}
