/**
 * Turns raw wallet / ethers / fhEVM errors into short, friendly messages a
 * non-technical user can understand. Used everywhere we surface a failure so the
 * UI never shows a wall of JSON-RPC text.
 */

// Solidity custom errors (from StreamVeil + ConfidentialToken) → plain language.
const CONTRACT_ERRORS: Record<string, string> = {
  FaucetCooldownActive: "The faucet is cooling down — please wait about a minute before minting again.",
  InvalidRecipient: "That recipient address isn't valid.",
  InvalidTimeRange: "The stream's start and end times aren't valid.",
  InvalidToken: "That token isn't supported by StreamVeil.",
  NotStreamRecipient: "Only the stream's recipient can claim from it.",
  NotStreamSender: "Only the stream's sender can do that.",
  OrganizationNotFound: "We couldn't find that organization. Try creating the stream again.",
  StreamAlreadyCanceled: "This stream has already been canceled.",
  StreamNotActive: "This stream isn't active right now.",
  StreamNotFound: "We couldn't find that stream.",
  StreamNotPaused: "This stream isn't paused.",
};

type LooseError = {
  code?: number | string;
  reason?: string;
  shortMessage?: string;
  message?: string;
  info?: { error?: { message?: string } };
  data?: unknown;
};

/** Extract the most useful raw string from the many shapes ethers/wallets throw. */
function rawText(e: unknown): string {
  const err = e as LooseError;
  return (
    err?.shortMessage ||
    err?.reason ||
    err?.info?.error?.message ||
    err?.message ||
    (typeof e === "string" ? e : "") ||
    ""
  ).toString();
}

export function humanizeError(e: unknown): string {
  const err = e as LooseError;
  const raw = rawText(e);
  const lower = raw.toLowerCase();

  // 1. User dismissed the wallet prompt — the single most common "error".
  if (
    err?.code === 4001 ||
    err?.code === "ACTION_REJECTED" ||
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("request rejected")
  ) {
    return "Request cancelled in your wallet.";
  }

  // 2. No gas money.
  if (lower.includes("insufficient funds")) {
    return "Not enough Sepolia ETH to cover gas. Grab some test ETH from a faucet and try again.";
  }

  // 3. Known contract custom errors (match the error name anywhere in the payload).
  for (const [name, msg] of Object.entries(CONTRACT_ERRORS)) {
    if (raw.includes(name)) return msg;
  }
  // Some nodes only surface the cooldown as a generic "cooldown" string.
  if (lower.includes("cooldown")) return CONTRACT_ERRORS.FaucetCooldownActive;

  // 4. Signature / decryption flow (Reveal).
  if (lower.includes("eip712") || lower.includes("signature") || lower.includes("decrypt")) {
    return "Couldn't finish the reveal. Please try decrypting again.";
  }

  // 5. Network / RPC trouble.
  if (
    lower.includes("timeout") ||
    lower.includes("could not coalesce") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    err?.code === "NETWORK_ERROR" ||
    err?.code === "TIMEOUT" ||
    err?.code === -32603
  ) {
    return "Network hiccup talking to Sepolia. Please try again in a moment.";
  }

  // 6. Generic on-chain revert with no friendlier match.
  if (lower.includes("execution reverted") || err?.code === "CALL_EXCEPTION") {
    return "The transaction was rejected on-chain. Please double-check the details and try again.";
  }

  // 7. Fallback: a short, clean sentence — never a giant JSON blob.
  if (raw && raw.length <= 140 && !raw.includes("{") && !raw.includes("0x")) {
    return raw;
  }
  return "Something went wrong. Please try again.";
}
