"use client";

import { useWallet } from "@/lib/store";
import { shortAddr } from "@/lib/format";
import { CHAIN_ID } from "@/lib/contracts";

export function WalletButton({ size = "md", label = "Connect Wallet" }: { size?: "md" | "lg"; label?: string }) {
  const { address, connect, disconnect, connecting, wrongNetwork, switchToTargetChain } = useWallet();

  const pad = size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";

  if (address) {
    return (
      <div className="flex items-center gap-2">
        {wrongNetwork() && (
          <button
            onClick={switchToTargetChain}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
          >
            Switch to Sepolia
          </button>
        )}
        <button
          onClick={disconnect}
          title="Click to disconnect"
          className={`group flex items-center gap-2 rounded-xl glass ${pad} font-medium hover:border-[var(--color-accent)]`}
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent2)] shadow-[0_0_8px_var(--color-accent2)]" />
          <span className="font-mono">{shortAddr(address)}</span>
        </button>
      </div>
    );
  }

  return (
    <button onClick={connect} disabled={connecting} className={`rounded-xl btn-primary ${pad} font-semibold`}>
      {connecting ? "Connecting…" : label}
    </button>
  );
}

export function NetworkBadge() {
  return (
    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
      {CHAIN_ID === 11155111 ? "Sepolia testnet" : `chain ${CHAIN_ID}`}
    </span>
  );
}
