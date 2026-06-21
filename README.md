# StreamVeil 🌊🔒

**Confidential payment streaming for DAOs, built on [Zama's fhEVM](https://docs.zama.org/protocol).**

StreamVeil lets an organization stream tokens to a recipient continuously (salary, grants, vesting) where **every sensitive number — the deposit, the per‑second rate, the amount claimed — stays encrypted end‑to‑end** using Fully Homomorphic Encryption. The chain enforces the accounting without ever seeing a plaintext amount. Only the sender, the recipient, and an optional auditor can decrypt their own figures, client‑side.

> Schedule is public, **money is private.**

This is a from‑scratch fhEVM port of the [StackStream](https://github.com/jayteemoney/stackstream) Clarity protocol, rebuilt for Solidity + Zama and submitted to the **Zama Builder Track**.

---

## 🟢 Live on Sepolia (verified)

Both contracts are deployed to the Sepolia testnet and **verified on Etherscan** — click to read the source:

| Contract | Address |
|---|---|
| **ConfidentialToken** (`svUSD`, ERC‑7984) | [`0xf98404FF4e1824AB64b244894c66c49cAD048461`](https://sepolia.etherscan.io/address/0xf98404FF4e1824AB64b244894c66c49cAD048461#code) |
| **StreamVeil** (protocol) | [`0x4bb78Acf2696e660100048B728e817850d94f754`](https://sepolia.etherscan.io/address/0x4bb78Acf2696e660100048B728e817850d94f754#code) |

Run the dApp locally (`cd frontend && npm install && npm run dev`), connect a Sepolia wallet, and use the built‑in faucet — no real funds needed. Full walkthrough: **[docs/USERGUIDE.md](docs/USERGUIDE.md)**.

---

## 📚 Documentation

| Doc | What's inside |
|---|---|
| [docs/PROBLEM.md](docs/PROBLEM.md) | Why on‑chain payroll leaks compensation data, and what a real fix must do |
| [docs/SOLUTION.md](docs/SOLUTION.md) | The approach + the full technology stack (where Zama fhEVM, ERC‑7984 & the relayer SDK are used) |
| [docs/IMPACT.md](docs/IMPACT.md) | The gap StreamVeil bridges and what it makes newly possible |
| [docs/USERGUIDE.md](docs/USERGUIDE.md) | Step‑by‑step walkthrough that doubles as an end‑to‑end test checklist |

---

## ✨ What it does

| Capability | Confidential? |
|---|---|
| Create a stream funded by an encrypted deposit | ✅ amount encrypted |
| Continuous by‑the‑second accrual | ✅ rate encrypted |
| Recipient claims accrued funds anytime | ✅ amounts encrypted |
| Pause / resume (resume extends the end date) | ✅ |
| Cancel with automatic confidential refund of the unstreamed remainder | ✅ |
| Top‑up an existing stream | ✅ |
| DAO / organization registry | metadata public |
| **Auditor selective reveal** (programmable compliance) | ✅ opt‑in per stream |

The whole asset is a real **ERC‑7984 confidential fungible token** (OpenZeppelin), so balances and transfers are encrypted too — not just StreamVeil's internal bookkeeping.

---

## 🏗 Architecture

```
                          ┌─────────────────────────────────────────────┐
   Browser (Next.js)      │                  Sepolia                     │
 ┌───────────────────┐    │   ┌────────────────┐      ┌───────────────┐  │
 │ @zama-fhe/relayer  │encrypt │  StreamVeil.sol │ pull │ ConfidentialToken│
 │  -sdk (WASM)       ├────┼──▶│  (euint64 acct) │◀────▶│   (ERC-7984)    │ │
 │  • createEncrypted │    │   │  • org registry │ pay  │  • faucet/mint  │ │
 │    Input → handle  │    │   │  • create/pause │      └───────────────┘  │
 │  • userDecrypt     │◀───┼───│    /cancel/claim│                          │
 │    (EIP-712 + ACL) │decrypt │  • FHE.allow ACL│      ┌───────────────┐  │
 └───────────────────┘    │   └───────┬─────────┘      │  Zama FHE       │ │
                          │           │ ciphertext ops  │  coprocessor +  │ │
                          │           └────────────────▶│  KMS / Gateway  │ │
                          └─────────────────────────────└───────────────┘──┘
```

**Two contracts:**

- **`ConfidentialToken.sol`** — an OpenZeppelin **ERC‑7984** (`ConfidentialFungibleToken`) used as the streamed asset, plus a public `faucet()` so the demo is self‑serve. Balances/transfers are `euint64`.
- **`StreamVeil.sol`** — the protocol. Holds deposited tokens, tracks encrypted `deposit / rate / claimed` per stream, and a plaintext `start / stop / pause` schedule. Pulls funds via ERC‑7984 operator `confidentialTransferFrom` and pays out via `confidentialTransfer`, always using the **returned actually‑transferred ciphertext** to keep invariants exact.

**Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Zustand · TanStack Query · `@zama-fhe/relayer-sdk` for in‑browser encryption and user decryption.

---

## 🔑 Key migration decisions (Clarity → Solidity + FHE)

These are the design calls that make StreamVeil work well under FHE:

1. **Privacy boundary: encrypt the money, not the clock.**
   Amounts (`deposit`, `rate`, `claimed`) are `euint64`; the *schedule* (timestamps, status) is plaintext. This keeps all branching/time logic in ordinary Solidity (cheap, no FHE branches) and confines FHE to arithmetic. The right tradeoff for payroll: you hide salaries, not the fact that payday is monthly.

2. **Temporal accrual with timestamps.**
   Continuous streaming is approximated with `block.timestamp`. We bank `secondsStreamed` at each checkpoint plus a live `lastCheckpoint`, so
   `accrued = min(rate * activeSeconds, deposit)`.
   **Pause** simply banks the active seconds (no FHE write needed); **resume** shifts `stopTime` forward by the paused gap so the full deposit still streams, just later.

3. **Precision / no overflow.**
   `rate = deposit / duration` via FHE **scalar** division (`FHE.div(euint64, uint64)`). Integer truncation guarantees `rate * duration ≤ deposit`, so the `FHE.min(..., deposit)` cap is exact and never overpays; any dust is refundable to the sender on cancel. Using `euint64` (not `euint256`) matches ERC‑7984 and keeps gas/HCU sane.

4. **Permission system (ACL).**
   After every state change, each encrypted field is granted with `FHE.allowThis` + `FHE.allow(field, sender)` + `FHE.allow(field, recipient)` (+ auditor if set). Cross‑contract transfers use `FHE.allowTransient(amount, token)` so the token can operate on the ciphertext for exactly one transaction. Decryption happens **client‑side** via the relayer SDK (EIP‑712 signature → `userDecrypt`); the contract never learns plaintext and there is no on‑chain oracle round‑trip in the hot path.

5. **Real confidential asset, not play money.**
   We integrate OpenZeppelin's audited ERC‑7984 rather than faking balances. Deposits are pulled with the operator model (`setOperator` → `confidentialTransferFrom`) and the **returned** transferred handle (capped at the payer's balance) is what we book — so under‑funding degrades gracefully instead of reverting on a value the contract can't see.

---

## 🚀 Quickstart

### Prerequisites
- Node ≥ 20
- A wallet (MetaMask) + some Sepolia ETH for the live demo

### 1. Contracts — install, compile, test (FHEVM mock)

```bash
npm install
npm run compile
npm test            # 7 passing — full flow with real FHE encrypt/decrypt in mock mode
```

Run the scripted end‑to‑end demo against a local node:

```bash
npx hardhat node            # terminal 1
npm run demo:localhost      # terminal 2  → faucet → stream → claim → auditor reveal
```

### 2. Deploy to Sepolia

```bash
cp .env.example .env              # set MNEMONIC (+ optionally a dedicated SEPOLIA_RPC_URL)

# Find the deployer address (first account from your mnemonic) and fund it
# with a little Sepolia ETH from a faucet before deploying:
npm run accounts:sepolia

# Deploy both contracts. This also writes the addresses + ABIs into
# deployments/<chainId>.json AND frontend/src/abi/deployment.json:
npm run deploy:sepolia
```

The contracts inherit `ZamaEthereumConfig`, which wires the live Zama coprocessor
on Sepolia automatically — no extra coprocessor setup is required.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # already targets Sepolia (chainId 11155111)
npm run dev                         # http://localhost:3000
```

> If you previously ran a localhost deploy, restart `npm run dev` after the Sepolia
> deploy so the new `deployment.json` (chainId 11155111) is picked up. `.env.local`
> pins the app to Sepolia so the wallet's network gate stays in sync.

---

## 🎬 Demo flow

1. **Connect** a Sepolia wallet.
2. **Faucet +1,000** — mints 1,000 svUSD as an *encrypted* balance. Click **Reveal** to decrypt it locally (one EIP‑712 signature).
3. **New confidential stream** → recipient + amount + duration. The amount is encrypted in your browser before it ever touches the chain.
4. On the recipient's account, the stream card shows the **live, by‑the‑second accrual animating** — computed client‑side from the decrypted rate. Hit **Claim** to withdraw.
5. **Pause / Resume / Cancel / Top up** as the sender. Cancel refunds the unstreamed remainder confidentially; Top up adds encrypted funds and extends the end date.
6. **Add auditor** → paste an address; that address can now `Reveal` the stream's figures (programmable compliance), nobody else can.

---

## 🔬 Privacy guarantees

- **On‑chain:** deposits, rates, accrued balances, claimed amounts and token balances are ciphertext handles. Validators, indexers and the public RPC see only opaque `bytes32`.
- **Decryption is authorized & client‑side:** a value is readable only by addresses on its FHE ACL. The relayer SDK proves authorization with an EIP‑712 signature; plaintext is returned to the user's browser, never posted on‑chain.
- **What is intentionally public:** stream existence, participant addresses, organization metadata, and the schedule (start/stop/pause times). This is the deliberate "hide the salary, not the payday" model — adjustable if a use case needs more.
- **Auditor reveal is explicit and per‑stream:** only the sender can add an auditor, and only to streams they own.

---

## ⛽ Gas / cost notes

FHE operations are metered in **HCU** (Homomorphic Complexity Units) by the coprocessor in addition to EVM gas. StreamVeil keeps the hot paths lean:

- `pause` / `resume` perform **zero** FHE arithmetic — they only move plaintext checkpoints.
- `claim` does a fixed, small number of FHE ops: `mul` (scalar) + `min` + `sub` + `add` + the token transfer.
- `createStream` does `fromExternal` + scalar `div` + the confidential pull.

Run a gas report with:

```bash
REPORT_GAS=true npm test
```

(EVM gas only; HCU is reported by the coprocessor on testnet.)

---

## 🧪 Test coverage

`test/StreamVeil.ts` exercises the full lifecycle against the FHEVM mock with genuine encrypt/decrypt:

- faucet mints an encrypted balance
- create stream debits the sender's confidential balance
- accrual over time → recipient claims the **exact** encrypted amount
- pause freezes accrual; resume extends the end time
- cancel refunds the unstreamed remainder to the sender
- auditor authorization gates decryption (rejected before, succeeds after)
- access control (only sender pauses, only recipient claims)

---

## 📁 Layout

```
streamveil/
├── contracts/
│   ├── ConfidentialToken.sol     # ERC-7984 asset + faucet
│   └── StreamVeil.sol            # core protocol
├── test/StreamVeil.ts            # full-flow mock tests
├── scripts/
│   ├── deploy.ts                 # deploy + emit frontend artifact
│   ├── accounts.ts               # print deployer address + balance
│   ├── setCooldown.ts            # owner: tune the faucet cooldown
│   └── demo.ts                   # scripted end-to-end demo
├── deployments/<chainId>.json    # generated addresses + ABIs
├── docs/                         # problem · solution · impact · user guide
└── frontend/                     # Next.js 16 dApp
    └── src/{app,components,lib,abi}
```

---

## 🛠 Tech stack

`@fhevm/solidity 0.11` · `@fhevm/hardhat-plugin` · OpenZeppelin Confidential Contracts (ERC‑7984) · Hardhat · Solidity 0.8.27 (viaIR) · `@zama-fhe/relayer-sdk` · Next.js 16 · React 19 · Tailwind v4 · ethers v6 · Zustand · TanStack Query.

---

## 🏆 Zama Builder Track — submission notes

- **Strong privacy:** real ERC‑7984 confidential asset + encrypted protocol accounting + opt‑in auditor reveal.
- **Real utility:** confidential DAO payroll/grants/vesting — a concrete, repeatedly‑requested confidential‑DeFi use case.
- **End‑to‑end & demoable:** compiles, 7 passing FHE tests, a one‑command scripted demo, and a polished dApp with live encrypted accrual.
- **Best practices:** audited OZ libraries, current `FHE`/ACL APIs (no deprecated `TFHE.decrypt`/`reencrypt`), `viaIR`, careful overflow/precision handling, client‑side decryption (no oracle hot path).

**License:** MIT.
