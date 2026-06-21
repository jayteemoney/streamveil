# The Solution & The Technology

StreamVeil solves confidential payroll with one core idea and a carefully chosen stack. This
document explains **how** it works and **what** it is built with — including exactly where each
piece of the required Zama ecosystem is used.

---

## The core idea: encrypt the money, keep the schedule public

The insight that makes StreamVeil efficient is a deliberate split:

- **Encrypted (the sensitive part):** the deposit, the per-second rate, the amount accrued, the
  amount claimed, and all token balances. These are stored as `euint64` — encrypted integers.
- **Public (the harmless part):** who is involved, the start/stop/pause timestamps, the stream
  status, and the organization name.

We **hide the salary, not the payday.** Timing logic (how many seconds have elapsed) is cheap,
trustless plaintext arithmetic. Only the figures that actually need protecting are encrypted.
This keeps gas reasonable while giving real confidentiality where it matters.

### How the chain computes on numbers it can't read

Zama's **fhEVM** supports **Fully Homomorphic Encryption (FHE)**: arithmetic performed directly
on ciphertext. StreamVeil computes:

- **rate** = `deposit / duration` — once, at creation, on encrypted values.
- **accrued** = `min(rate × elapsedSeconds, deposit)` — clamped so a stream never over-pays.
- **claimable** = `accrued − alreadyClaimed`.
- **refund on cancel** = `deposit − accrued`.

Every one of these runs homomorphically. The contract produces the right encrypted answer
without ever decrypting an input. Decryption only ever happens **client-side**, in the browser,
by an authorized party.

---

## The technology stack

### Smart contracts (Solidity + Zama fhEVM)

| Technology | Version | Where it's used |
|---|---|---|
| **Solidity** | `0.8.27` (viaIR, cancun) | Both contracts |
| **`@fhevm/solidity`** — the `FHE` library | `^0.11.1` | All encrypted state & math (`euint64`, `FHE.add/sub/mul/div/min`, `FHE.fromExternal`, `FHE.allow*`) |
| **`ZamaEthereumConfig`** base contract | from `@fhevm/solidity` | Wires both contracts to the live Zama coprocessor / KMS on Sepolia |
| **`@openzeppelin/confidential-contracts`** — ERC-7984 | `^0.4.1` | The streamed asset is a real confidential token |
| **`@openzeppelin/contracts`** | `^5.6.1` | `Ownable` for the faucet/mint admin |

**Two contracts:**

- **`ConfidentialToken.sol`** — an OpenZeppelin **ERC-7984** confidential fungible token
  (`svUSD`, 6 decimals). Balances and transfers are encrypted `euint64`. Adds a public
  `faucet()` (with an owner-tunable cooldown) so anyone can self-serve test tokens, plus an
  owner `mint(address, externalEuint64, proof)` for funding a treasury with a client-encrypted
  amount.
- **`StreamVeil.sol`** — the protocol. An organization registry plus per-stream encrypted books
  (`deposit / rate / claimed` as `euint64`) and a plaintext schedule
  (`startTime / stopTime / pausedAt / status`). Implements `createStream`, `topUp`, `pause`,
  `resume`, `cancel`, `claim`, and `setAuditor`.

### Frontend (the dApp)

| Technology | Where it's used |
|---|---|
| **Next.js 16** (App Router) + **React 19** + **TypeScript** | The application shell and UI |
| **`@zama-fhe/relayer-sdk`** (`0.4.1`) | In-browser **encryption** of inputs and **user decryption** (EIP-712 + ACL) |
| **Tailwind CSS v4** | Design system & responsive layout |
| **Zustand** | Wallet/session state and the toast system |
| **TanStack Query** | On-chain reads, caching, and refresh after actions |
| **ethers v6** | Contract calls and signing |

### Tooling

- **Hardhat** (`^2.28`) with **`@fhevm/hardhat-plugin`** + **`@fhevm/mock-utils`** for a local
  FHE mock used in tests, and **`@nomicfoundation/hardhat-verify`** for Etherscan verification.
- Deployment, account-inspection, and faucet-cooldown scripts under `scripts/`.

---

## Key technical decisions

These are the non-obvious choices that make StreamVeil correct under FHE:

1. **Encrypted inputs are bound to the contract that decrypts them.** The deposit amount is
   encrypted in the browser *for `StreamVeil`*, and `FHE.fromExternal` is called **inside
   StreamVeil** (not the token). StreamVeil then grants the token transient access with
   `FHE.allowTransient` and pulls funds via the `euint64` overload of `confidentialTransferFrom`.
   This avoids fragile cross-contract handle rebinding.

2. **Always book the *actually transferred* ciphertext.** ERC-7984 transfers return the real
   amount moved (which can differ from the requested amount if a balance is short). StreamVeil
   adds **that returned handle** to its books — so internal accounting can never drift from real
   token balances, and no one is ever overpaid.

3. **Access control via `FHE.allow`.** Each encrypted value's read access list is maintained
   on-chain: the contract itself, the sender, the recipient, and — only if the sender opts in —
   an auditor. Everyone else sees opaque `bytes32` handles. `setAuditor` extends the ACL for a
   single stream; nothing is global.

4. **Decryption never touches the hot path.** There is no on-chain decryption oracle in
   create/claim/cancel. Reads are decrypted client-side with the relayer SDK's `userDecrypt`,
   authorized by a one-time EIP-712 signature scoped to both contracts.

5. **`viaIR` compilation.** FHE contracts juggle many ciphertext handles; IR-based codegen is
   required to avoid "stack too deep".

---

## How privacy is actually enforced (end to end)

1. **Create:** the browser encrypts the deposit with the relayer SDK → a ciphertext handle +
   zero-knowledge input proof. Only the handle ever leaves the device.
2. **Compute:** StreamVeil derives the encrypted rate and accrues on ciphertext. Validators see
   only opaque handles and timestamps.
3. **Reveal:** an authorized address signs an EIP-712 request; the relayer returns the plaintext
   **to that browser only**. No counterparty, validator, or bystander can read it.
4. **Audit (optional):** the sender calls `setAuditor`, extending the on-chain ACL so a chosen
   address can also decrypt — per stream, reversible in spirit, and never automatic.

For the problem this addresses, see **[PROBLEM.md](./PROBLEM.md)**; for the gap it closes in the
ecosystem, see **[IMPACT.md](./IMPACT.md)**; to try it, see **[USERGUIDE.md](./USERGUIDE.md)**.
