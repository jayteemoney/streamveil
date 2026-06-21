"use client";

import { Logo } from "./Logo";

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="overflow-clip">
      <Hero onLaunch={onLaunch} />
      <Marquee />
      <Stats />
      <Problem />
      <HowItWorks />
      <Features />
      <PrivacyModel />
      <Architecture />
      <UseCases />
      <FAQ />
      <FinalCTA onLaunch={onLaunch} />
      <Footer />
    </div>
  );
}

/* ----------------------------------------------------------------- HERO */
function Hero({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg h-[640px]" />
      <div className="container-x relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="rise">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent2)]" />
            Private payments on Ethereum, powered by Zama
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.07] tracking-tight sm:text-5xl lg:text-6xl">
            Pay people by the second &mdash; <br className="hidden sm:block" />
            <span className="grad-text">keep the amounts private.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            StreamVeil lets a company or DAO send salaries, grants, and vesting as a steady, real-time
            flow of money &mdash; not awkward monthly lump sums. And here&apos;s what makes it different:{" "}
            <span className="text-white">every amount stays scrambled on the public blockchain.</span>{" "}
            The network still does the accounting perfectly; it simply never gets to see the numbers.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={onLaunch} className="rounded-xl btn-primary px-6 py-3 text-base font-semibold">
              Launch the app →
            </button>
            <a href="#how" className="rounded-xl btn-ghost px-6 py-3 text-base font-medium">
              See how it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--color-muted)]">
            <Check>Real ERC-7984 token</Check>
            <Check>Built on audited OpenZeppelin code</Check>
            <Check>Live on Sepolia testnet</Check>
          </div>
        </div>

        <div className="relative lg:pl-6">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative mx-auto max-w-md animate-float">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent2)]/20 blur-2xl" />
      <div className="relative rounded-3xl grad-border glow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Logo size={26} /> Stream #128
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
            Active
          </span>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-[var(--color-muted)]">Paid so far</span>
            <span className="font-mono">
              <span className="animate-pulse-soft text-white">▓▓▓.▓▓</span>
              <span className="text-[var(--color-muted)]"> / •••• svUSD</span>
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent2)] shimmer" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <MiniStat label="Rate / second" value="🔒 private" />
          <MiniStat label="Ready to claim" value="🔒 private" />
          <MiniStat label="Recipient" value="0x4f…9aB2" />
          <MiniStat label="Auditor" value="opt-in" />
        </div>

        <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-black/30 p-3 text-center text-xs text-[var(--color-muted)]">
          To everyone else on the public ledger, this card is just scrambled data.
          <br />
          Only you can unlock it &mdash; right inside your browser.
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-black/20 px-3 py-2">
      <div className="text-[11px] text-[var(--color-muted)]">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------- MARQUEE */
function Marquee() {
  const items = [
    "Real-time payroll",
    "Private by default",
    "Powered by Zama fhEVM",
    "ERC-7984 confidential token",
    "Unlock in your browser",
    "Built on OpenZeppelin",
    "Compliance on your terms",
  ];
  const row = [...items, ...items];
  return (
    <div className="relative border-y border-[var(--color-border)]/60 bg-black/20 py-4">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-5">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
            <span className="text-[var(--color-accent)]">◆</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- STATS */
function Stats() {
  const stats = [
    { k: "100%", v: "of every amount stays private on-chain" },
    { k: "1 click", v: "to start, claim, pause, or cancel" },
    { k: "0", v: "salary figures leaked to the public" },
    { k: "by the second", v: "money arrives continuously, in real time" },
  ];
  return (
    <section className="container-x grid grid-cols-2 gap-4 py-14 md:grid-cols-4 md:py-16">
      {stats.map((s) => (
        <div key={s.v} className="rounded-2xl glass p-6 text-center">
          <div className="font-display text-2xl font-bold grad-text sm:text-3xl">{s.k}</div>
          <div className="mt-2 text-sm text-[var(--color-muted)]">{s.v}</div>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------- PROBLEM */
function Problem() {
  return (
    <section className="container-x py-14 md:py-20">
      <SectionTitle
        eyebrow="The problem"
        title="On a normal blockchain, your payroll is a public spreadsheet."
        sub="Send someone a salary on a typical public chain and the amount is right there for the whole world to read — competitors, counterparties, and curious strangers alike. They can see what you pay, work out the rate, and follow every withdrawal. For a real company or DAO, that simply isn't an option."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-7">
          <div className="text-sm font-semibold text-rose-300">❌ Paying out in the open</div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
            <li>• Salaries, rates, and balances are visible to anyone, forever.</li>
            <li>• Rivals can map your spending, your runway, and your headcount.</li>
            <li>• Your team&apos;s pay is exposed to the entire internet.</li>
            <li>• Compliance becomes all-or-nothing: reveal everything, or prove nothing.</li>
          </ul>
        </div>
        <div className="rounded-2xl grad-border p-7">
          <div className="text-sm font-semibold text-[var(--color-accent2)]">✓ Paying with StreamVeil</div>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
            <li>• Amounts are scrambled on-chain &mdash; just unreadable data to outsiders.</li>
            <li>• Only the sender, the recipient, and people they choose can read them.</li>
            <li>• Unlocking happens privately, in the browser &mdash; never on the blockchain.</li>
            <li>• Share the books with an auditor one stream at a time, when you want to.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- HOW IT WORKS */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Lock in the amount, privately",
      d: "You decide how much to stream. Your browser scrambles that number before it ever leaves your device, so the amount is confidential from the very first moment.",
    },
    {
      n: "02",
      t: "Let it flow, second by second",
      d: "StreamVeil releases the money continuously over the period you set. Every calculation runs on the scrambled numbers, so the contract keeps the books perfectly without ever seeing a figure.",
    },
    {
      n: "03",
      t: "Claim and reveal on your terms",
      d: "The recipient can withdraw whatever has built up, whenever they like. Each person unlocks only their own numbers with a quick signature &mdash; and you can invite an auditor any time you need to.",
    },
  ];
  return (
    <section id="how" className="container-x py-14 md:py-20">
      <SectionTitle eyebrow="How it works" title="Three steps. No leaks." />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="group relative rounded-2xl glass p-7 transition hover:border-[var(--color-accent)]">
            <div className="font-display text-5xl font-bold text-[var(--color-border)] transition group-hover:text-[var(--color-accent)]/40">
              {s.n}
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ FEATURES */
function Features() {
  const feats = [
    { i: "🔒", t: "Private amounts", d: "Deposits, rates, and balances are encrypted from end to end. Outsiders see only scrambled data, never a real figure." },
    { i: "⏱️", t: "Real-time streaming", d: "Money accrues every single second against the clock. Watch it tick upward live, unlocked right in your browser." },
    { i: "⏸️", t: "Pause and resume", d: "Stop the flow in a click. When you resume, the end date shifts forward so the full amount still arrives — just a little later." },
    { i: "↩️", t: "Cancel and refund", d: "Changed your mind? Cancel any time and the unsent remainder comes straight back to you, privately, down to the last unit." },
    { i: "🕵️", t: "Invite an auditor", d: "Let a trusted address view a stream's figures, one stream at a time. Compliance on your terms — never automatic, never global." },
    { i: "🏛️", t: "Organize by team", d: "Group related streams under an organization or DAO for tidy treasury records and clean payroll management." },
  ];
  return (
    <section id="features" className="container-x py-14 md:py-20">
      <SectionTitle eyebrow="Features" title="Everything a private payroll needs." />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {feats.map((f) => (
          <div key={f.t} className="rounded-2xl glass p-7 transition hover:-translate-y-1 hover:border-[var(--color-accent)]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent2)]/10 text-xl">
              {f.i}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------- PRIVACY MODEL */
function PrivacyModel() {
  return (
    <section className="container-x py-14 md:py-20">
      <div className="rounded-3xl grad-border p-8 md:p-12">
        <SectionTitle
          eyebrow="The privacy model"
          title="Hide the salary, not the payday."
          sub="StreamVeil makes a deliberate choice: keep the money private, but leave the schedule out in the open. That keeps the timing logic simple, cheap, and trustless — while the only things kept secret are the figures that actually matter."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-accent2)]/30 bg-[var(--color-accent2)]/5 p-6">
            <div className="text-sm font-semibold text-[var(--color-accent2)]">🔒 Kept private</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["the deposit", "the rate per second", "amount accrued", "amount claimed", "token balances"].map((t) => (
                <span key={t} className="rounded-lg bg-black/30 px-3 py-1.5 text-xs">{t}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-black/20 p-6">
            <div className="text-sm font-semibold text-[var(--color-muted)]">👁️ Public, by design</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["who's involved", "start and stop time", "stream status", "organization name"].map((t) => (
                <span key={t} className="rounded-lg bg-black/30 px-3 py-1.5 text-xs text-[var(--color-muted)]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- ARCHITECTURE */
function Architecture() {
  return (
    <section className="container-x py-14 md:py-20">
      <SectionTitle
        eyebrow="Under the hood"
        title="Two small contracts, one private flow."
        sub="For the curious (and the judges): here's what's actually doing the work."
      />
      <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
        <ArchCard
          title="The app you use"
          tag="Next.js + Zama SDK"
          lines={["Scrambles your amounts in-browser", "Unlocks figures with a quick signature", "Shows the balance ticking up live"]}
        />
        <ArchCard
          title="StreamVeil"
          tag="the protocol"
          highlight
          lines={["Keeps the encrypted books per stream", "Create, pause, cancel, claim, top up", "Decides who is allowed to unlock what"]}
        />
        <ArchCard
          title="The token"
          tag="ERC-7984"
          lines={["Encrypted balances and transfers", "Moves funds without revealing sums", "Built-in faucet for free test tokens"]}
        />
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--color-muted)]">
        Deposits are pulled in and payouts are sent back using the token&apos;s own confidential transfers, and StreamVeil
        always books the exact amount that actually moved &mdash; so the numbers stay correct to the unit, and nobody is
        ever overpaid.
      </p>
    </section>
  );
}

function ArchCard({ title, tag, lines, highlight }: { title: string; tag: string; lines: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-7 ${highlight ? "grad-border glow" : "glass"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">{tag}</span>
      </div>
      <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-muted)]">
        {lines.map((l) => (
          <li key={l} className="flex gap-2">
            <span className="text-[var(--color-accent2)]">›</span> {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------- USE CASES */
function UseCases() {
  const cases = [
    { i: "💼", t: "DAO payroll", d: "Pay contributors a steady salary that arrives in real time — without publishing what everyone earns." },
    { i: "🎓", t: "Grants & bounties", d: "Release funding gradually, without broadcasting the size of every award to your rivals." },
    { i: "📈", t: "Token vesting", d: "Vest team and investor allocations privately, with the option to cancel and refund." },
    { i: "🤝", t: "Contractor pay", d: "Stream invoices by the second, and pause the moment the work pauses." },
  ];
  return (
    <section id="usecases" className="container-x py-14 md:py-20">
      <SectionTitle eyebrow="Who it's for" title="Made for money that should stay private." />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cases.map((c) => (
          <div key={c.t} className="rounded-2xl glass p-6 transition hover:border-[var(--color-accent)]">
            <div className="text-2xl">{c.i}</div>
            <h3 className="mt-3 font-display text-lg font-semibold">{c.t}</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- FAQ */
function FAQ() {
  const qs = [
    {
      q: "How can the blockchain handle money it can't even read?",
      a: "Through a breakthrough called Fully Homomorphic Encryption (FHE), provided by Zama's fhEVM. It lets the network do maths directly on scrambled numbers. StreamVeil works out rates and balances on the encrypted values; the answer stays encrypted, and only the right person can unscramble it — on their own device.",
    },
    {
      q: "Who can actually see a stream's amounts?",
      a: "Only the people on its private guest list: the sender, the recipient, and an auditor if the sender chooses to add one. To everyone else, the amounts are just unreadable data.",
    },
    {
      q: "What's left out in the open?",
      a: "The addresses involved, the schedule (start, stop, and pause times), the stream's status, and the organization's name. We hide the salary, not the payday — which keeps the timing logic cheap and trustless.",
    },
    {
      q: "Where does it run, and what does it cost me to try?",
      a: "It runs on the Sepolia test network, where Zama's encryption infrastructure lives. There's a built-in faucet that hands you free test tokens, so you can try everything end to end without spending any real money.",
    },
    {
      q: "Is the token a real standard?",
      a: "Yes. The asset you stream is an OpenZeppelin ERC-7984 confidential token, so its balances and transfers are encrypted too — not just StreamVeil's own internal bookkeeping.",
    },
  ];
  return (
    <section id="faq" className="container-x py-14 md:py-20">
      <SectionTitle eyebrow="Good questions" title="Everything you might be wondering." />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {qs.map((item) => (
          <details key={item.q} className="group rounded-2xl glass p-5 [&_summary]:cursor-pointer">
            <summary className="flex items-center justify-between gap-4 font-medium marker:content-none">
              {item.q}
              <span className="shrink-0 text-[var(--color-muted)] transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ FINAL CTA */
function FinalCTA({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="container-x py-14 md:py-20">
      <div className="relative overflow-hidden rounded-3xl grad-border p-10 text-center md:p-16">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Pay your people <span className="grad-text">privately.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted)]">
            Open a confidential stream in under a minute. Free test tokens are built right in &mdash; no real funds needed.
          </p>
          <div className="mt-8 flex justify-center">
            <button onClick={onLaunch} className="rounded-xl btn-primary px-8 py-3.5 text-base font-semibold">
              Launch StreamVeil →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- FOOTER */
function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]/60">
      <div className="container-x flex flex-col items-center justify-between gap-4 py-10 text-center text-sm text-[var(--color-muted)] sm:flex-row sm:text-left">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-display font-semibold text-white">StreamVeil</span>
        </div>
        <p>Amounts encrypted with Zama fhEVM &mdash; schedule public, money private.</p>
        <p>Built for the Zama Builder Track · MIT</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------- HELPERS */
function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{eyebrow}</div>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-[var(--color-muted)]">{sub}</p>}
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[var(--color-accent2)]">✓</span> {children}
    </span>
  );
}
