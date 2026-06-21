# StreamVeil — User Guide & End-to-End Test Checklist

A friendly, step-by-step walkthrough of every feature, written so you can both **learn the
app** and **verify it works** against the live Sepolia deployment. Each step says what to do
and the **expected result**. Tick the boxes as you go.

---

## Deployment under test

| Item | Value |
|---|---|
| Network | **Sepolia** (chainId `11155111`) |
| ConfidentialToken (svUSD) | [`0xf98404FF4e1824AB64b244894c66c49cAD048461`](https://sepolia.etherscan.io/address/0xf98404FF4e1824AB64b244894c66c49cAD048461#code) |
| StreamVeil | [`0x4bb78Acf2696e660100048B728e817850d94f754`](https://sepolia.etherscan.io/address/0x4bb78Acf2696e660100048B728e817850d94f754#code) |
| Token decimals | 6 (`svUSD`) |

---

## 0. Prerequisites

- [ ] **MetaMask** installed in your browser.
- [ ] **Two Sepolia accounts** in MetaMask — call them **A (sender)** and **B (recipient)**.
      Add or import a second account for B so you can test the recipient side (claiming).
- [ ] **Both accounts hold a little Sepolia ETH for gas** (~0.02 each is fine).
      Fund them from a faucet, e.g. https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- [ ] App running locally:
      ```bash
      cd frontend
      npm install      # first time only
      npm run dev      # http://localhost:3000
      ```
- [ ] Open **http://localhost:3000** in the browser where MetaMask lives.

> **What to expect on a live network:** StreamVeil runs real Fully Homomorphic Encryption
> through Zama's coprocessor on Sepolia. After a transaction confirms, **decryption / "Reveal"
> takes a few seconds** while the coprocessor and relayer respond. A short spinner is normal —
> it is not a hang.

---

## 1. Landing page

- [ ] The landing page loads with every section (hero, stats, how-it-works, features,
      privacy model, architecture, use cases, FAQ, footer).
- [ ] Nav links scroll to the matching sections. On a phone, the **☰ menu** opens them.
- [ ] **Launch App** (top-right) and the hero button both switch to the dashboard.

**Expected:** No console errors; the page reflows cleanly from desktop down to mobile width.

---

## 2. Connect wallet

- [ ] Click **Connect** / **Launch App**.
- [ ] MetaMask pops up requesting connection → approve with **Account A**.
- [ ] The button now shows your shortened address (e.g. `0x98B9…dbd`).

**Edge cases to verify:**
- [ ] **Reject** the MetaMask prompt once → a toast shows *"Request cancelled in your wallet."*
      and the app stays usable.
- [ ] **Reload the page** while connected → it silently re-detects the account (no popup).
- [ ] **Switch account** in MetaMask → the dApp updates to the new address and clears any
      previously revealed amounts.

---

## 3. Network handling

- [ ] While connected, switch MetaMask to a **different network** (e.g. Ethereum Mainnet).
- [ ] The dashboard shows **"Wrong network — StreamVeil runs on Sepolia."**
- [ ] Click **Switch to Sepolia** → MetaMask prompts to switch (or to *add* Sepolia if it's
      missing) → approve.
- [ ] After switching back to Sepolia, the dashboard renders normally.

**Expected:** No "Unrecognized chain ID" error — the app is pinned to Sepolia.

---

## 4. Faucet — mint confidential tokens

On **Account A**:

- [ ] Click **Faucet +1,000**.
- [ ] MetaMask prompts a transaction → confirm.
- [ ] Wait for confirmation, then a green **"Minted 1,000 svUSD"** toast appears.

**Expected:** The balance card still shows `•••••• svUSD` — it's encrypted on-chain until you reveal it.

- [ ] Try clicking Faucet again **immediately** → it should be rejected by the **60-second
      faucet cooldown**. Expected: an error toast (*"The faucet is cooling down…"*), **not** a
      second mint. After ~60s it works again.

> The cooldown is owner-configurable. To make the faucet unlimited (fast demo) or change the
> window: `FAUCET_COOLDOWN=0 npm run cooldown:sepolia` (any number of seconds; 0 = unlimited).

---

## 5. Reveal balance (client-side decryption)

On **Account A**:

- [ ] Click **Reveal** on the balance card.
- [ ] MetaMask prompts an **EIP-712 signature** (not a transaction, no gas) → sign.
- [ ] After a few seconds the balance shows **`1,000 svUSD`** (or 1,000 × number of faucets).

**Expected:** Only *you* can decrypt your own balance. The signature authorizes the relayer to
return the plaintext to your browser only.

---

## 6. Create a confidential stream

On **Account A** (sender):

- [ ] Click **New confidential stream**.
- [ ] Fill in:
  - **Recipient** = your **Account B** address.
  - **Amount** = e.g. `100`.
  - **Duration** = **5 minutes (demo)** (so you can watch it stream quickly).
  - **Organization / DAO** = any name, e.g. `Acme DAO`.
- [ ] Click **Create stream**.
- [ ] MetaMask may prompt **two** actions the first time:
  1. **Approve operator** (one-time `setOperator` so StreamVeil can pull your tokens), then
  2. The **createStream** transaction.
- [ ] Confirm each.

**Expected:**
- The amount is **encrypted in your browser** before sending (note the "Encrypting & sending…" state).
- A green **"Confidential stream created"** toast appears, and a new **Stream card** shows up
  under *Your streams*, status **Active**, labelled `Outgoing → 0x…B`.

---

## 7. Watch live accrual + reveal a stream

On **Account A**, on the new stream card:

- [ ] Click **Reveal amounts** → sign the EIP-712 prompt.
- [ ] After a few seconds the card shows the real numbers: **Streamed / 100 svUSD**,
      **Claimable now**, **Already claimed = 0**.
- [ ] The **Streamed** value and progress bar **tick upward every second** while Active.

**Expected:** Over the 5-minute window the streamed amount climbs from 0 toward 100,
proportional to elapsed time.

---

## 8. Claim as recipient

Switch MetaMask to **Account B** (recipient):

- [ ] The dashboard now shows the same stream as `Incoming ← 0x…A`.
- [ ] Click **Reveal amounts** (sign) to see the claimable figure.
- [ ] Click **Claim** → confirm the transaction.
- [ ] After confirmation, click **Reveal** again: **Already claimed** rises and **Claimable now**
      drops toward 0.
- [ ] Optionally **Reveal Account B's token balance** (faucet card) → it increased by the claimed amount.

**Expected:** The recipient receives exactly the accrued (streamed-so-far) amount, no more.
Claiming again immediately yields ~0 until more time accrues.

---

## 9. Sender controls — Pause / Resume

Switch back to **Account A**:

- [ ] Click **Pause** → confirm tx. Status badge → **Paused**.
- [ ] Reveal again and watch for ~30s: the **Streamed** value **stops increasing** while paused.
- [ ] Click **Resume** → confirm tx. Status → **Active**; accrual continues.

**Expected:** Time spent paused does **not** count toward the recipient's entitlement.

---

## 10. Top up a stream

On **Account A** (sender), on an active (or paused) stream card:

- [ ] Click **Top up** → a modal opens.
- [ ] Enter an **Add amount** (e.g. `50`) and choose an **Extend by** option (e.g. `+5 minutes`).
- [ ] Click **Top up** → confirm the transaction(s) (operator approval if first time, then the top-up).
- [ ] After confirmation, **Reveal amounts** again.

**Expected:**
- The **deposit / target total** (the `/ NNN svUSD`) increases by the amount you added.
- The **Ends in** time extends by the duration you chose.
- The per-second **rate stays the same** — the extension is what lets the added funds stream out.

---

## 11. Auditor — selective reveal (programmable compliance)

On **Account A**:

- [ ] Click **Add auditor** → paste a **third address** (or Account B) → confirm tx.
- [ ] The card's **Auditor** field now shows that address.
- [ ] Switch MetaMask to the **auditor account**, open the stream, click **Reveal amounts**, sign.

**Expected:** The auditor can decrypt this stream's amounts. An account that is **not** the
sender, recipient, or auditor **cannot** reveal them.

- [ ] (Negative test) Connect a random 4th account → it can see the stream exists/status but
      **Reveal fails / shows nothing**, because it isn't on the access list.

---

## 12. Cancel + refund

On **Account A**:

- [ ] Click **Cancel** → confirm tx. Status → **Canceled**.
- [ ] Reveal your **Account A balance** → it increased by the **unstreamed remainder**.
- [ ] Switch to **Account B** → it can still **Claim remainder** for anything that had accrued
      before cancellation.

**Expected:** On cancel, accrued-but-unclaimed funds stay claimable by the recipient; the rest
refunds to the sender. Nothing is lost or double-counted.

---

## 13. Persistence / reload

- [ ] Reload the page → the connected account, streams, and statuses all reload from chain.
- [ ] Revealed amounts re-hide until you Reveal again (decryption is per-session by design).

---

## Quick troubleshooting

| Symptom | Cause / Fix |
|---|---|
| "Wrong network" won't clear | Ensure MetaMask is on **Sepolia**; reload after switching. |
| "Unrecognized chain ID 0x7a69" | Stale localhost build — restart `npm run dev` so it reloads `deployment.json` + `.env.local`. |
| Reveal spins for a while | Live coprocessor latency or RPC rate-limit. Wait ~10s; if persistent, set a dedicated `NEXT_PUBLIC_RPC_URL` (Infura/Alchemy) in `frontend/.env.local` and restart. |
| "Not enough Sepolia ETH…" | The active MetaMask account needs Sepolia **ETH for gas** (separate from svUSD). |
| createStream reverts | Confirm the **operator approval** step first; ensure your svUSD balance ≥ amount (use Faucet). |
| Faucet reverts second time | Faucet **60s cooldown** — expected; wait ~1 min, or run `FAUCET_COOLDOWN=0 npm run cooldown:sepolia`. |
| Numbers look off by ×10⁶ | svUSD has **6 decimals**; the UI handles this — only relevant if you read raw on-chain values. |

---

## What "all working" looks like

- ✅ Connect / disconnect / account-switch / network-switch all behave.
- ✅ Faucet mints, Reveal decrypts, balances are private until revealed.
- ✅ A stream is created with an **encrypted** amount and accrues live, by the second.
- ✅ The recipient claims exactly the accrued amount; the sender can pause, resume, cancel, and top up.
- ✅ An auditor can selectively decrypt; outsiders cannot.
- ✅ Cancel refunds the sender and preserves the recipient's accrued claim.

If any step deviates from its **Expected** result, note the step number and the exact toast /
console message — that's enough to pinpoint the issue.
