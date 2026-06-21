# The Problem

## Public blockchains make payroll public

Blockchains earned their trust by being transparent: every transaction is visible to everyone,
forever. That openness is a feature for many things — but it is a serious problem for **paying
people**.

When an organization pays a salary, a grant, or a vesting allocation on a normal public chain,
the amount is written in plain sight. Anyone can:

- **Read every salary.** Open a block explorer and the figure is right there.
- **Infer the rate and the runway.** Repeated payments reveal pay rates, raises, and how long
  the treasury can last.
- **Track every withdrawal.** Each claim is timestamped and public.
- **Profile the whole organization.** Competitors and counterparties can map headcount,
  seniority, and spend patterns without ever talking to you.

For an individual, this is the equivalent of having your payslip stapled to a public notice
board. For a company or a DAO, it leaks strategic information and makes confidential
compensation impossible.

## Streaming makes it worse, not better

"Money streaming" — paying continuously over time instead of in monthly lumps — is a genuinely
better model for salaries, grants, and vesting. It improves cash flow for recipients and lets
senders pause or cancel precisely.

But streaming protocols on transparent chains amplify the privacy problem: now the **rate per
second**, the **total deposit**, and the **live running balance** are all on-chain and
continuously observable. The more granular the payment, the more granular the leak.

## The compliance dilemma

Faced with this, teams are pushed to an unhappy binary:

- **Go fully public** and accept that all compensation data is exposed, or
- **Go fully off-chain** and lose the settlement guarantees, auditability, and composability
  that made on-chain payments attractive in the first place.

What's missing is a **middle path**: payments that settle and accrue on-chain with full
correctness guarantees, while the sensitive numbers stay private — and where the people
involved (and an auditor they choose) can still see the truth when they need to.

## What a good solution must do

A credible confidential payroll system has to satisfy all of the following at once:

1. **Encrypt the sensitive figures** — deposit, rate, accrued, claimed, and balances — so they
   are never visible in plaintext on-chain.
2. **Still enforce correct accounting** — the contract must compute accrual, claims, and
   refunds correctly *without* being able to read the numbers it is computing on.
3. **Stream continuously** — accrue by the second, with pause, resume, cancel-with-refund, and
   top-up.
4. **Give controlled visibility** — the sender and recipient can always read their own figures,
   and the sender can selectively grant an auditor read access, per stream, for compliance.
5. **Stay practical** — usable from an ordinary browser wallet, with reasonable gas, and no
   trusted off-chain operator deciding who sees what.

StreamVeil is built to meet every one of these. See **[SOLUTION.md](./SOLUTION.md)** for how,
and **[IMPACT.md](./IMPACT.md)** for the gap it closes.
