"use client";

import { useState } from "react";
import { useWallet } from "@/lib/store";
import { useStreams } from "@/lib/hooks";
import { FaucetCard } from "./FaucetCard";
import { CreateStreamModal } from "./CreateStreamModal";
import { StreamCard } from "./StreamCard";
import { WalletButton } from "./WalletButton";

export function Dashboard() {
  const { address, wrongNetwork, switchToTargetChain } = useWallet();
  const { data: streams, isLoading } = useStreams(address);
  const [showCreate, setShowCreate] = useState(false);

  if (!address) {
    return (
      <Centered>
        <h2 className="font-display text-2xl font-semibold">Connect to get started</h2>
        <p className="mt-2 max-w-sm text-[var(--color-muted)]">
          Connect a Sepolia wallet to mint test tokens and open your first confidential stream.
        </p>
        <div className="mt-6">
          <WalletButton size="lg" />
        </div>
      </Centered>
    );
  }

  if (wrongNetwork()) {
    return (
      <Centered>
        <h2 className="font-display text-2xl font-semibold">Wrong network</h2>
        <p className="mt-2 max-w-sm text-[var(--color-muted)]">StreamVeil runs on Sepolia. Switch to continue.</p>
        <button onClick={switchToTargetChain} className="mt-6 rounded-xl btn-primary px-6 py-3 font-semibold">
          Switch to Sepolia
        </button>
      </Centered>
    );
  }

  return (
    <div className="container-x py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Your confidential streams and balance.</p>
        </div>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <FaucetCard />
        <button
          onClick={() => setShowCreate(true)}
          className="group rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel)]/40 p-6 text-left transition hover:border-[var(--color-accent)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent2)] text-2xl text-white">
              +
            </span>
            <div>
              <div className="font-display text-lg font-semibold">New confidential stream</div>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                Encrypt an amount in your browser and stream it by the second.
              </p>
            </div>
          </div>
        </button>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Your streams
        </h2>
        {isLoading ? (
          <p className="text-[var(--color-muted)]">Loading…</p>
        ) : !streams || streams.length === 0 ? (
          <div className="rounded-2xl glass p-10 text-center text-[var(--color-muted)]">
            No streams yet. Grab tokens from the faucet, then create your first stream.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {streams.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        )}
      </section>

      {showCreate && <CreateStreamModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">{children}</div>;
}
