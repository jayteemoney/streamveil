export enum StreamStatus {
  Active = 0,
  Paused = 1,
  Canceled = 2,
}

export const STATUS_LABEL: Record<StreamStatus, string> = {
  [StreamStatus.Active]: "Active",
  [StreamStatus.Paused]: "Paused",
  [StreamStatus.Canceled]: "Canceled",
};

/** On-chain view of a stream — encrypted fields are bytes32 handles. */
export type Stream = {
  id: number;
  orgId: number;
  sender: string;
  recipient: string;
  token: string;
  auditor: string;
  startTime: number;
  stopTime: number;
  activeSeconds: number; // active seconds at fetch time
  status: StreamStatus;
  depositHandle: string;
  rateHandle: string;
  claimedHandle: string;
  fetchedAtMs: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseStream(r: any, fetchedAtMs: number): Stream {
  return {
    id: Number(r.id),
    orgId: Number(r.orgId),
    sender: r.sender,
    recipient: r.recipient,
    token: r.token,
    auditor: r.auditor,
    startTime: Number(r.startTime),
    stopTime: Number(r.stopTime),
    activeSeconds: Number(r.activeSeconds),
    status: Number(r.status) as StreamStatus,
    depositHandle: r.deposit,
    rateHandle: r.rate,
    claimedHandle: r.claimed,
    fetchedAtMs,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const isZeroHandle = (h: string) => !h || h === ZERO_HANDLE;

/**
 * Extrapolate the live accrued amount client-side from the decrypted rate/deposit.
 * Mirrors the contract: accrued = min(rate * activeSeconds, deposit), never exceeding deposit.
 */
export function liveAccrued(
  stream: Stream,
  rateClear: bigint,
  depositClear: bigint,
  nowMs: number,
): bigint {
  let seconds = BigInt(stream.activeSeconds);
  if (stream.status === StreamStatus.Active) {
    const elapsed = Math.max(0, Math.floor((nowMs - stream.fetchedAtMs) / 1000));
    seconds += BigInt(elapsed);
  }
  const raw = rateClear * seconds;
  return raw < depositClear ? raw : depositClear;
}

export function claimable(accrued: bigint, claimedClear: bigint): bigint {
  return accrued > claimedClear ? accrued - claimedClear : 0n;
}

export function progressPct(accrued: bigint, depositClear: bigint): number {
  if (depositClear === 0n) return 0;
  return Math.min(100, Number((accrued * 10000n) / depositClear) / 100);
}
