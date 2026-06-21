import { TOKEN_DECIMALS } from "./contracts";

const UNIT = 10 ** TOKEN_DECIMALS;

/** Format a base-unit bigint as a human token amount, e.g. 1_500_000n -> "1.50". */
export function formatAmount(v: bigint | null | undefined, dp = 2): string {
  if (v === null || v === undefined) return "—";
  return (Number(v) / UNIT).toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** Parse a human token amount (string) into a base-unit bigint. */
export function parseAmount(input: string): bigint {
  const [whole, frac = ""] = input.trim().split(".");
  const fracPadded = (frac + "0".repeat(TOKEN_DECIMALS)).slice(0, TOKEN_DECIMALS);
  return BigInt(whole || "0") * BigInt(UNIT) + BigInt(fracPadded || "0");
}

export function shortAddr(a?: string): string {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m && !d) parts.push(`${m}m`);
  return parts.join(" ") || `${seconds}s`;
}
