"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { useWallet } from "@/lib/store";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#usecases", label: "Use cases" },
  { href: "#faq", label: "FAQ" },
];

export function Nav({ view, setView }: { view: "home" | "app"; setView: (v: "home" | "app") => void }) {
  const { address, connect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  async function launch() {
    if (!address) await connect();
    setView("app");
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/70 backdrop-blur-xl">
      <nav className="container-x flex h-16 items-center justify-between">
        <button onClick={() => setView("home")} className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight">StreamVeil</span>
        </button>

        {view === "home" && (
          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-[var(--color-muted)] transition hover:text-white">
                {l.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {view === "app" && (
            <button onClick={() => setView("home")} className="hidden rounded-xl btn-ghost px-3 py-2 text-sm sm:block">
              ← Home
            </button>
          )}
          {view === "home" ? (
            <button onClick={launch} className="rounded-xl btn-primary px-4 py-2 text-sm font-semibold">
              Launch App
            </button>
          ) : (
            <WalletButton />
          )}

          {/* Mobile menu toggle — only on the landing view */}
          {view === "home" && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-lg btn-ghost md:hidden"
            >
              <span className="text-lg leading-none">{menuOpen ? "✕" : "☰"}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown */}
      {view === "home" && menuOpen && (
        <div className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg)]/95 px-5 py-3 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
