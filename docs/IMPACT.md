# The Gap StreamVeil Bridges

## The gap, in one sentence

Before confidential smart contracts, on-chain payments forced a choice between **transparency
and privacy**. StreamVeil removes that trade-off for streaming payments: money settles and
accrues on-chain with full correctness, while the sensitive amounts stay private — and the right
people can still see the truth.

## Where each existing approach falls short

| Approach | What it gives you | What it costs you |
|---|---|---|
| **Public streaming protocols** (e.g. transparent token streams) | Continuous, trustless, composable payments | Every salary, rate, and balance is fully public |
| **Off-chain / centralized payroll** | Privacy | No on-chain settlement guarantees, no composability, a trusted operator who *does* see everything |
| **Mixers / shielded transfers** | Hide *who* or *that* a transfer happened | Not built for continuous accrual, programmable schedules, or selective audit |
| **StreamVeil** | Continuous on-chain streaming **and** encrypted amounts **and** selective auditor reveal | Runs where Zama's fhEVM is available (currently Sepolia testnet) |

StreamVeil sits precisely in the empty cell that earlier tools left open: **private, programmable,
continuously-settling payments with built-in, opt-in auditability.**

## Concretely, what becomes possible

- **A DAO can run real payroll on-chain** without publishing every contributor's salary to its
  competitors — while still proving solvency and letting a treasurer or auditor verify the books.
- **Grant programs can disburse over time** without revealing award sizes that would distort
  applicant behavior or invite gaming.
- **Teams can vest tokens privately**, with the ability to pause or cancel-and-refund, without
  broadcasting individual allocations.
- **Contractors can be paid by the second**, with the flow paused exactly when work pauses, and
  amounts kept between the two parties.

In every case the previously unavoidable leak — *how much* — is closed, without giving up the
settlement, correctness, and composability that put these payments on-chain in the first place.

## Why this matters for the ecosystem

Confidentiality is the missing primitive that keeps serious organizations off public chains for
anything money-sensitive. Payroll is one of the clearest, most universal examples: every
organization has it, and almost none can put it on a transparent ledger as-is.

By implementing a complete, demoable confidential-payroll protocol on **Zama's fhEVM** — using a
real **ERC-7984** confidential token, homomorphic accrual math, on-chain access control, and
client-side decryption — StreamVeil shows that this missing primitive is not theoretical. It is
buildable today with the ecosystem's standard tools, and it directly expands the set of
real-world applications that belong on-chain.

See **[PROBLEM.md](./PROBLEM.md)** for the problem in depth and **[SOLUTION.md](./SOLUTION.md)**
for exactly how it's built.
