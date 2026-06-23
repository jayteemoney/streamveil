# On-Chain Evidence

This document is the verifiable proof that **every StreamVeil feature works on the live Sepolia
network**. Each function below links to its real transaction on Etherscan, with a short
explanation of what it does and — importantly — **what it proves about confidentiality**.

> **How to verify:** click any transaction hash to open it on Sepolia Etherscan. For the
> confidential functions, open the StreamVeil **Read Contract → `getStream`** view and you will see
> the amounts stored as opaque `bytes32` ciphertext handles — never plaintext numbers. That is
> Fully Homomorphic Encryption (Zama fhEVM) at work: the chain enforces the payroll without ever
> seeing the values.

---

## Deployed & verified contracts

| Contract | Address (verified source on Etherscan) |
|---|---|
| ConfidentialToken (`svUSD`, ERC-7984) | [`0xf98404FF4e1824AB64b244894c66c49cAD048461`](https://sepolia.etherscan.io/address/0xf98404FF4e1824AB64b244894c66c49cAD048461#code) |
| StreamVeil (protocol) | [`0x4bb78Acf2696e660100048B728e817850d94f754`](https://sepolia.etherscan.io/address/0x4bb78Acf2696e660100048B728e817850d94f754#code) |

## Accounts used

| Role | Address | Activity |
|---|---|---|
| **Account A** — sender (and recipient/claimer of streams sent to it) | `0xc088ef44ac89d8c507bc13eb7607e51a013ce971` | [view](https://sepolia.etherscan.io/address/0xc088ef44ac89d8c507bc13eb7607e51a013ce971) |
| **Account B** — recipient & auditor of the demonstrated stream | `0x98B9b68296911Ae4fBf1de856930642dab922dbd` | [view](https://sepolia.etherscan.io/address/0x98B9b68296911Ae4fBf1de856930642dab922dbd) |

Both accounts independently transacted with the protocol on Sepolia, so every function is proven
from a real wallet.

---

## Transaction evidence — full lifecycle from Account A

A single, contemporaneous run by **Account A** (`0xc088…`) on 2026-06-23 covering every function.
The `claim` is Account A acting as a recipient. Reproduction steps for each row are in
**[USERGUIDE.md](./USERGUIDE.md)**.

| # | Functionality | Actor | Contract | Transaction |
|---|---|---|---|---|
| 1 | **faucet** — mint encrypted test tokens | A | ConfidentialToken | [`0x0b7109…99e1`](https://sepolia.etherscan.io/tx/0x0b7109cc6c04b2ff329b455da3c67416b5d6debcafb2816f8048021ba5a499e1) |
| 2 | **setOperator** — authorize StreamVeil to pull funds | A | ConfidentialToken | [`0xaedd4e…1362`](https://sepolia.etherscan.io/tx/0xaedd4e197db3761cef49d46550bd764e98565d78a181de598903afe42dca1362) |
| 3 | **registerOrganization** — create a DAO/org | A | StreamVeil | [`0x37906b…85c3f`](https://sepolia.etherscan.io/tx/0x37906b9289c406f120a719277a3a394a1f7042836faf9d0f73bf2e8788085c3f) |
| 4 | **createStream** — open a stream with an encrypted deposit (recipient = Account B) | A → B | StreamVeil | [`0x4dbf60…8d60`](https://sepolia.etherscan.io/tx/0x4dbf60045bc6a2f8da6fa2562c695746445422de505766f0253a529e01df8d60) |
| 5 | **pause** — freeze accrual | A | StreamVeil | [`0xd330bb…0988`](https://sepolia.etherscan.io/tx/0xd330bbe57f82460520f732b966ba5be781245043dd3be83d06946bfa59890988) |
| 6 | **topUp** — add encrypted funds + extend | A | StreamVeil | [`0xf81fc2…0025`](https://sepolia.etherscan.io/tx/0xf81fc25f12eed10f21fada1a93cafffba43d98e61e20eb72dba5c432e8db0025) |
| 7 | **setAuditor** — grant decrypt rights for one stream (auditor = Account B) | A → B | StreamVeil | [`0xdc8615…0270`](https://sepolia.etherscan.io/tx/0xdc86157c98a10240c56cf3ebdea6737998b2ec8a4bd67d445c38d979137f0270) |
| 8 | **resume** — continue accrual, end date shifts | A | StreamVeil | [`0x289d6a…473c`](https://sepolia.etherscan.io/tx/0x289d6a24bd913e3d5b4d89ae03c45fd804bb28e700eabfd748944437c55d473c) |
| 9 | **cancel** — stop stream, refund unspent remainder | A | StreamVeil | [`0xaf0d3e…67ff`](https://sepolia.etherscan.io/tx/0xaf0d3ef33bc7fbcb5bdb9ed84ed03e4d81ddeb6356d49a5df8cdbc033e4f67ff) |
| 10 | **claim** — recipient withdraws accrued funds | A (as recipient) | StreamVeil | [`0xb8543a…bf03`](https://sepolia.etherscan.io/tx/0xb8543aca98712c5bd6d5241137a3ee74a1fb4f04cb96f293f0f157c02553bf03) |

## Cross-account confirmation — Account B

**Account B** (`0x98B9…`) is the recipient and auditor in transactions #4 and #7 above, and also
independently ran the sender flow — proving the protocol works across distinct wallets:

| Functionality | Actor | Contract | Transaction |
|---|---|---|---|
| **faucet** | B | ConfidentialToken | [`0x3e8ac5…be98`](https://sepolia.etherscan.io/tx/0x3e8ac5deafde2d9776a47d2973815e03d999fa6a33086ae016e4905c5380be98) |
| **setOperator** | B | ConfidentialToken | [`0x993dfa…c989`](https://sepolia.etherscan.io/tx/0x993dfa4fcf5496fc30a2db420811b98cd2914be84366b7307e5cb7b7ac66c989) |
| **registerOrganization** | B | StreamVeil | [`0xca9d74…0e72`](https://sepolia.etherscan.io/tx/0xca9d74c0afa9aaba4a803599680fc110b8ef2b0bd715a4a6510680650bd30e72) |
| **createStream** | B | StreamVeil | [`0x77c5b4…2bb0`](https://sepolia.etherscan.io/tx/0x77c5b4b91ec6c4b0e6580449d1f4abac2428569aff30d31c4beb454264c12bb0) |
| **pause** | B | StreamVeil | [`0x9ba8b8…522f`](https://sepolia.etherscan.io/tx/0x9ba8b85600d115e828c7e683c136824f0c6b9e549e31849757b901b911f0522f) |
| **topUp** | B | StreamVeil | [`0xf2fd39…e4ba`](https://sepolia.etherscan.io/tx/0xf2fd393e0e83635f1cd3e23934b687f238fa3070ad03136784ca0ec5da34e4ba) |
| **resume** | B | StreamVeil | [`0x165609…e803`](https://sepolia.etherscan.io/tx/0x16560926a836a8c1971100ff0c4f3af2aacfc243f7d86969f4ba67aa2459e803) |

---

## What each function proves

### Token & balances (ConfidentialToken — ERC-7984)

- **faucet:** mints a fixed drip to the caller, but it lands as an **encrypted `euint64` balance**.
  On-chain the balance is a ciphertext handle, not a readable number — proving the asset itself is
  confidential, not just StreamVeil's bookkeeping.
- **setOperator:** the ERC-7984 operator model. The account authorizes the StreamVeil contract to
  move its confidential tokens, so deposits can be pulled with `confidentialTransferFrom`.

### Stream lifecycle (StreamVeil)

- **createStream:** the deposit amount is **encrypted in the browser before the transaction is
  sent**. The contract derives the per-second rate homomorphically and stores `deposit`, `rate`,
  and `claimed` as encrypted `euint64`. The transaction succeeds without the network ever
  decrypting the amount.
- **claim:** the recipient receives exactly the accrued amount, computed on ciphertext as
  `min(rate × elapsedSeconds, deposit) − alreadyClaimed`. No party — not even the contract — reads
  the figures in plaintext.

### Sender controls

- **pause / resume:** pausing banks the elapsed seconds (pure plaintext schedule, no FHE write);
  resuming shifts the end time forward so the full encrypted deposit still streams. Proves the
  "encrypt the money, keep the schedule public" design.
- **topUp:** adds an **encrypted** amount to the deposit and extends the end date, keeping the
  total confidential while the stream keeps flowing.
- **cancel:** refunds the unspent remainder (`deposit − accrued`) to the sender confidentially,
  while leaving any accrued-but-unclaimed funds claimable by the recipient.

### Programmable compliance

- **setAuditor:** extends the on-chain access control list (`FHE.allow`) for **one specific stream**
  so a chosen auditor address can decrypt its figures. This proves selective, per-stream, opt-in
  disclosure — compliance on the sender's terms, never global or automatic.

---

## A note on "Reveal" (decryption) — why there are no transaction hashes for it

Reading an encrypted value is **not** an on-chain transaction. To reveal a balance or a stream's
amounts, an authorized address signs a one-time **EIP-712 message** (no gas, no transaction) and
the Zama relayer returns the plaintext **to that user's browser only**. This is the heart of the
privacy model:

- The figures are computed and stored encrypted on-chain (see the transactions above).
- They are decrypted **client-side**, only by addresses on the value's access list (sender,
  recipient, or an authorized auditor).
- No counterparty, validator, indexer, or bystander can read them.

So the transactions above prove the **confidential computation and settlement**, while decryption
happens privately off-chain by design — exactly as a confidential protocol should behave.
