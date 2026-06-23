# StreamVeil Documentation

Confidential, real-time payroll streaming on Zama's fhEVM — *hide the salary, not the payday.*

This folder is the deep-dive companion to the top-level [README](../README.md).

▶️ **[Watch the demo video](https://www.loom.com/share/49d6dd12489c4ba89f2f2b3d20901071)** (2.5 min).

## Contents

| Document | What's inside |
|---|---|
| **[PROBLEM.md](./PROBLEM.md)** | Why on-chain payments leak compensation data, why streaming makes it worse, and what a real solution must do. |
| **[SOLUTION.md](./SOLUTION.md)** | The approach and the full technology stack — including exactly where Zama fhEVM, ERC-7984, the relayer SDK, and the rest are used. The key technical decisions live here too. |
| **[IMPACT.md](./IMPACT.md)** | The gap StreamVeil bridges versus existing approaches, and what it makes newly possible. |
| **[USERGUIDE.md](./USERGUIDE.md)** | A friendly, step-by-step walkthrough that doubles as an end-to-end test checklist against the live Sepolia deployment. |
| **[EVIDENCE.md](./EVIDENCE.md)** | Verifiable on-chain proof — the transaction hash for each function on Sepolia, with what each one demonstrates about confidentiality. |

## Live deployment (Sepolia)

| Contract | Address (verified on Etherscan) |
|---|---|
| ConfidentialToken (svUSD) | [`0xf98404FF4e1824AB64b244894c66c49cAD048461`](https://sepolia.etherscan.io/address/0xf98404FF4e1824AB64b244894c66c49cAD048461#code) |
| StreamVeil | [`0x4bb78Acf2696e660100048B728e817850d94f754`](https://sepolia.etherscan.io/address/0x4bb78Acf2696e660100048B728e817850d94f754#code) |

## Suggested reading order

1. **PROBLEM** — understand what's broken.
2. **SOLUTION** — see how StreamVeil fixes it and with what.
3. **IMPACT** — see the gap it closes.
4. **USERGUIDE** — try it yourself.
