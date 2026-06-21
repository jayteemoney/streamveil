"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/store";
import { STREAMVEIL_ADDRESS } from "@/lib/contracts";
import { getFhevmInstance } from "@/lib/fhevm";
import { userDecrypt, HandlePair } from "@/lib/decrypt";
import { formatAmount, formatDuration, shortAddr } from "@/lib/format";
import {
  Stream,
  StreamStatus,
  STATUS_LABEL,
  isZeroHandle,
  liveAccrued,
  claimable,
  progressPct,
} from "@/lib/stream";
import * as actions from "@/lib/actions";
import { TopUpModal } from "./TopUpModal";

const statusColor: Record<StreamStatus, string> = {
  [StreamStatus.Active]: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  [StreamStatus.Paused]: "text-amber-300 bg-amber-300/10 border-amber-300/30",
  [StreamStatus.Canceled]: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

export function StreamCard({ stream }: { stream: Stream }) {
  const { address, getSigner, decrypted, setDecrypted, notify, notifyError } = useWallet();
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState<string>("");
  const [showTopUp, setShowTopUp] = useState(false);

  const isSender = address?.toLowerCase() === stream.sender.toLowerCase();
  const isRecipient = address?.toLowerCase() === stream.recipient.toLowerCase();

  const depositClear = isZeroHandle(stream.depositHandle) ? 0n : decrypted[stream.depositHandle];
  const rateClear = isZeroHandle(stream.rateHandle) ? 0n : decrypted[stream.rateHandle];
  const claimedClear = isZeroHandle(stream.claimedHandle) ? 0n : decrypted[stream.claimedHandle];
  const revealed = depositClear !== undefined && rateClear !== undefined && claimedClear !== undefined;

  // tick for the live accrual animation
  useEffect(() => {
    if (!revealed || stream.status !== StreamStatus.Active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [revealed, stream.status]);

  const accrued = useMemo(
    () => (revealed ? liveAccrued(stream, rateClear!, depositClear!, now) : 0n),
    [revealed, stream, rateClear, depositClear, now],
  );
  const withdrawable = revealed ? claimable(accrued, claimedClear!) : 0n;
  const pct = revealed ? progressPct(accrued, depositClear!) : 0;

  async function reveal() {
    setBusy("reveal");
    try {
      const pairs: HandlePair[] = [stream.depositHandle, stream.rateHandle, stream.claimedHandle]
        .filter((h) => !isZeroHandle(h))
        .map((handle) => ({ handle, contractAddress: STREAMVEIL_ADDRESS }));
      const res = await userDecrypt(await getFhevmInstance(), await getSigner(), pairs);
      setDecrypted(res);
      notify("Stream amounts decrypted.", "success");
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy("");
    }
  }

  async function run(name: string, fn: () => Promise<unknown>, successMsg?: string) {
    setBusy(name);
    try {
      await fn();
      await qc.invalidateQueries();
      if (successMsg) notify(successMsg, "success");
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy("");
    }
  }

  const counterparty = isSender ? stream.recipient : stream.sender;
  const roleLabel = isSender ? "Outgoing → " : "Incoming ← ";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Stream #{stream.id}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor[stream.status]}`}>
              {STATUS_LABEL[stream.status]}
            </span>
          </div>
          <div className="mt-1 font-mono text-sm">
            {roleLabel}
            <span className="text-[var(--color-accent2)]">{shortAddr(counterparty)}</span>
          </div>
        </div>
        {!revealed ? (
          <button
            onClick={reveal}
            disabled={busy !== ""}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent2)] disabled:opacity-40"
          >
            {busy === "reveal" ? "Decrypting…" : "Reveal amounts"}
          </button>
        ) : null}
      </div>

      {/* streamed amount */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--color-muted)]">Streamed</span>
          <span className="font-mono">
            {revealed ? (
              <span className={stream.status === StreamStatus.Active ? "animate-pulse-soft" : ""}>
                {formatAmount(accrued, 4)}
              </span>
            ) : (
              "••••"
            )}
            <span className="text-[var(--color-muted)]"> / {revealed ? formatAmount(depositClear) : "••••"} svUSD</span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent2)] transition-all"
            style={{ width: `${revealed ? pct : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Claimable now" value={revealed ? `${formatAmount(withdrawable, 4)} svUSD` : "••••"} />
        <Stat label="Already claimed" value={revealed ? `${formatAmount(claimedClear)} svUSD` : "••••"} />
        <Stat label="Ends in" value={endsIn(stream)} />
        <Stat label="Auditor" value={stream.auditor === ZERO ? "None" : shortAddr(stream.auditor)} />
      </div>

      {/* actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        {isRecipient && stream.status !== StreamStatus.Canceled && (
          <Action label="Claim" busyLabel="Claiming…" active={busy} name="claim" onClick={() => run("claim", async () => actions.claim(await getSigner(), stream.id), "Claimed your available funds.")} primary />
        )}
        {isRecipient && stream.status === StreamStatus.Canceled && (
          <Action label="Claim remainder" busyLabel="Claiming…" active={busy} name="claim" onClick={() => run("claim", async () => actions.claim(await getSigner(), stream.id), "Claimed your remaining funds.")} primary />
        )}
        {isSender && stream.status === StreamStatus.Active && (
          <Action label="Pause" busyLabel="Pausing…" active={busy} name="pause" onClick={() => run("pause", async () => actions.pause(await getSigner(), stream.id), "Stream paused.")} />
        )}
        {isSender && stream.status === StreamStatus.Paused && (
          <Action label="Resume" busyLabel="Resuming…" active={busy} name="resume" onClick={() => run("resume", async () => actions.resume(await getSigner(), stream.id), "Stream resumed.")} />
        )}
        {isSender && stream.status !== StreamStatus.Canceled && (
          <>
            <Action label="Top up" busyLabel="Top up" active={busy} name="topup" onClick={() => setShowTopUp(true)} />
            <Action label="Cancel" busyLabel="Canceling…" active={busy} name="cancel" onClick={() => run("cancel", async () => actions.cancel(await getSigner(), stream.id), "Stream canceled and unspent funds refunded.")} />
            <Action
              label="Add auditor"
              busyLabel="Saving…"
              active={busy}
              name="auditor"
              onClick={() =>
                run(
                  "auditor",
                  async () => {
                    const a = window.prompt("Auditor address (can decrypt this stream's amounts):");
                    if (!a) return;
                    if (!ethers.isAddress(a)) throw new Error("That auditor address isn't valid.");
                    return actions.setAuditor(await getSigner(), stream.id, a);
                  },
                  "Auditor added — they can now reveal this stream.",
                )
              }
            />
          </>
        )}
      </div>

      {showTopUp && <TopUpModal streamId={stream.id} onClose={() => setShowTopUp(false)} />}
    </div>
  );
}

const ZERO = "0x0000000000000000000000000000000000000000";

function endsIn(s: Stream): string {
  if (s.status === StreamStatus.Canceled) return "—";
  const remaining = s.stopTime - Math.floor(Date.now() / 1000);
  return remaining <= 0 ? "Completed" : formatDuration(remaining);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-bg)] px-3 py-2">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-0.5 font-mono">{value}</div>
    </div>
  );
}

function Action({
  label,
  busyLabel,
  active,
  name,
  onClick,
  primary,
}: {
  label: string;
  busyLabel: string;
  active: string;
  name: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={active !== ""}
      className={
        primary
          ? "rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          : "rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)] disabled:opacity-40"
      }
    >
      {active === name ? busyLabel : label}
    </button>
  );
}
