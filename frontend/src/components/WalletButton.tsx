"use client";

import { useState } from "react";
import { useWallet } from "@/lib/store";
import { shortAddr } from "@/lib/format";
import { CHAIN_ID } from "@/lib/contracts";

const EXPLORER = CHAIN_ID === 11155111 ? "https://sepolia.etherscan.io" : "https://etherscan.io";

export function WalletButton({ size = "md", label = "Connect Wallet" }: { size?: "md" | "lg"; label?: string }) {
  const { address, connect, disconnect, connecting, wrongNetwork, switchToTargetChain, notify } = useWallet();
  const [open, setOpen] = useState(false);

  const pad = size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      notify("Address copied to clipboard.", "success");
    } catch {
      notify("Couldn't copy the address.", "error");
    }
    setOpen(false);
  }

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

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className={`group flex items-center gap-2 rounded-xl glass ${pad} font-medium hover:border-[var(--color-accent)]`}
          >
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent2)] shadow-[0_0_8px_var(--color-accent2)]" />
            <span className="font-mono">{shortAddr(address)}</span>
            <span className={`text-[var(--color-muted)] transition ${open ? "rotate-180" : ""}`}>▾</span>
          </button>

          {open && (
            <>
              {/* click-away backdrop */}
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-xl"
              >
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <div className="text-xs text-[var(--color-muted)]">Connected wallet</div>
                  <div className="mt-1 break-all font-mono text-xs">{address}</div>
                </div>
                <MenuItem onClick={copy}>Copy address</MenuItem>
                <a
                  href={`${EXPLORER}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm transition hover:bg-white/5"
                  role="menuitem"
                >
                  View on Etherscan ↗
                </a>
                <MenuItem
                  danger
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                    notify("Wallet disconnected.", "info");
                  }}
                >
                  Disconnect
                </MenuItem>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <button onClick={connect} disabled={connecting} className={`rounded-xl btn-primary ${pad} font-semibold`}>
      {connecting ? "Connecting…" : label}
    </button>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
        danger ? "text-rose-300 hover:bg-rose-500/10" : ""
      }`}
    >
      {children}
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
