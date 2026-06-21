import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { ConfidentialToken, StreamVeil } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner; // sender / DAO payer
  bob: HardhatEthersSigner; // recipient / employee
  carol: HardhatEthersSigner; // auditor
};

const DAY = 24 * 60 * 60;
const DEPOSIT = 100_000_000n; // 100 tokens @ 6 decimals
const FAUCET = 1_000_000_000n; // 1,000 tokens

describe("StreamVeil", function () {
  let signers: Signers;
  let token: ConfidentialToken;
  let tokenAddr: string;
  let streamVeil: StreamVeil;
  let streamVeilAddr: string;

  before(async function () {
    const eth = await ethers.getSigners();
    signers = { deployer: eth[0], alice: eth[1], bob: eth[2], carol: eth[3] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This suite only runs against the FHEVM mock (hardhat network).");
      this.skip();
    }

    token = (await (await ethers.getContractFactory("ConfidentialToken"))
      .connect(signers.deployer)
      .deploy("StreamVeil USD", "svUSD", "https://streamveil.xyz")) as ConfidentialToken;
    tokenAddr = await token.getAddress();

    streamVeil = (await (await ethers.getContractFactory("StreamVeil"))
      .connect(signers.deployer)
      .deploy()) as StreamVeil;
    streamVeilAddr = await streamVeil.getAddress();
  });

  // ---- helpers -------------------------------------------------------------------

  async function decryptBalance(holder: HardhatEthersSigner): Promise<bigint> {
    const handle = await token.confidentialBalanceOf(holder.address);
    if (handle === ethers.ZeroHash) return 0n;
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddr, holder);
  }

  async function decryptStreamField(
    field: bigint | string,
    reader: HardhatEthersSigner,
  ): Promise<bigint> {
    if (field === ethers.ZeroHash) return 0n;
    return fhevm.userDecryptEuint(FhevmType.euint64, field as string, streamVeilAddr, reader);
  }

  async function fundAndApprove(sender: HardhatEthersSigner) {
    await (await token.connect(sender).faucet()).wait();
    // Approve StreamVeil as an ERC-7984 operator so it can pull the deposit.
    await (await token.connect(sender).setOperator(streamVeilAddr, 2n ** 47n)).wait();
  }

  async function openStream(
    sender: HardhatEthersSigner,
    recipient: HardhatEthersSigner,
    deposit: bigint,
    durationSeconds: number,
  ): Promise<{ streamId: bigint; startTime: number; stopTime: number }> {
    const orgTx = await streamVeil.connect(sender).registerOrganization("Acme DAO");
    await orgTx.wait();
    const orgId = await streamVeil.orgCount();

    const start = (await time.latest()) + 1;
    const stop = start + durationSeconds;

    const enc = await fhevm
      .createEncryptedInput(streamVeilAddr, sender.address)
      .add64(deposit)
      .encrypt();

    const tx = await streamVeil
      .connect(sender)
      .createStream(orgId, recipient.address, tokenAddr, start, stop, enc.handles[0], enc.inputProof);
    await tx.wait();

    return { streamId: await streamVeil.streamCount(), startTime: start, stopTime: stop };
  }

  // ---- tests ---------------------------------------------------------------------

  it("faucet mints an encrypted balance", async function () {
    await (await token.connect(signers.alice).faucet()).wait();
    expect(await decryptBalance(signers.alice)).to.eq(FAUCET);
  });

  it("creates a stream, debiting the sender's confidential balance", async function () {
    await fundAndApprove(signers.alice);
    const { streamId } = await openStream(signers.alice, signers.bob, DEPOSIT, 1000);

    expect(await decryptBalance(signers.alice)).to.eq(FAUCET - DEPOSIT);

    const s = await streamVeil.getStream(streamId);
    expect(s.sender).to.eq(signers.alice.address);
    expect(s.recipient).to.eq(signers.bob.address);
    // sender can decrypt the (private) deposit
    expect(await decryptStreamField(s.deposit, signers.alice)).to.eq(DEPOSIT);
    // recipient can decrypt the rate (deposit / duration)
    expect(await decryptStreamField(s.rate, signers.bob)).to.eq(DEPOSIT / 1000n);
  });

  it("accrues over time and lets the recipient claim the exact encrypted amount", async function () {
    await fundAndApprove(signers.alice);
    const { streamId, startTime } = await openStream(signers.alice, signers.bob, DEPOSIT, 1000);
    const rate = DEPOSIT / 1000n;

    await time.increase(100);

    const tx = await streamVeil.connect(signers.bob).claim(streamId);
    const rcpt = await tx.wait();
    const block = await ethers.provider.getBlock(rcpt!.blockNumber);
    const elapsed = BigInt(block!.timestamp) - BigInt(startTime);
    const expected = elapsed >= 1000n ? DEPOSIT : rate * elapsed;

    expect(await decryptBalance(signers.bob)).to.eq(expected);
    expect(await decryptStreamField((await streamVeil.getStream(streamId)).claimed, signers.bob)).to.eq(
      expected,
    );
  });

  it("pauses (freezing accrual) and resumes (extending the end time)", async function () {
    await fundAndApprove(signers.alice);
    const { streamId } = await openStream(signers.alice, signers.bob, DEPOSIT, 1000);
    const rate = DEPOSIT / 1000n;

    await time.increase(100);
    const pauseTx = await streamVeil.connect(signers.alice).pause(streamId);
    await pauseTx.wait();
    const frozen = await streamVeil.activeSecondsOf(streamId);

    // While paused, active seconds must not grow.
    await time.increase(500);
    expect(await streamVeil.activeSecondsOf(streamId)).to.eq(frozen);

    // Claim while paused pays only the frozen accrual.
    await (await streamVeil.connect(signers.bob).claim(streamId)).wait();
    expect(await decryptBalance(signers.bob)).to.eq(rate * frozen);

    // Resume shifts stopTime forward by the paused gap.
    const stopBefore = (await streamVeil.getStream(streamId)).stopTime;
    await (await streamVeil.connect(signers.alice).resume(streamId)).wait();
    const stopAfter = (await streamVeil.getStream(streamId)).stopTime;
    expect(stopAfter).to.be.greaterThan(stopBefore);
  });

  it("cancels: refunds the unstreamed remainder to the sender", async function () {
    await fundAndApprove(signers.alice);
    const { streamId, startTime } = await openStream(signers.alice, signers.bob, DEPOSIT, 1000);
    const rate = DEPOSIT / 1000n;

    await time.increase(200);
    const tx = await streamVeil.connect(signers.alice).cancel(streamId);
    const rcpt = await tx.wait();
    const block = await ethers.provider.getBlock(rcpt!.blockNumber);
    const accrued = (BigInt(block!.timestamp) - BigInt(startTime)) * rate;
    const refund = DEPOSIT - accrued;

    // Sender got the unstreamed remainder back: started 1000 - deposit 100, +refund.
    expect(await decryptBalance(signers.alice)).to.eq(FAUCET - DEPOSIT + refund);

    // Recipient can still claim everything accrued up to cancellation.
    await (await streamVeil.connect(signers.bob).claim(streamId)).wait();
    expect(await decryptBalance(signers.bob)).to.eq(accrued);
  });

  it("authorizes an auditor to decrypt the stream's private figures", async function () {
    await fundAndApprove(signers.alice);
    const { streamId } = await openStream(signers.alice, signers.bob, DEPOSIT, 1000);

    // Before authorization, carol cannot decrypt.
    const s0 = await streamVeil.getStream(streamId);
    await expect(decryptStreamField(s0.deposit, signers.carol)).to.be.rejected;

    await (await streamVeil.connect(signers.alice).setAuditor(streamId, signers.carol.address)).wait();

    const s1 = await streamVeil.getStream(streamId);
    expect(await decryptStreamField(s1.deposit, signers.carol)).to.eq(DEPOSIT);
  });

  it("guards access control", async function () {
    await fundAndApprove(signers.alice);
    const { streamId } = await openStream(signers.alice, signers.bob, DEPOSIT, 1000);

    await expect(streamVeil.connect(signers.bob).pause(streamId)).to.be.revertedWithCustomError(
      streamVeil,
      "NotStreamSender",
    );
    await expect(streamVeil.connect(signers.alice).claim(streamId)).to.be.revertedWithCustomError(
      streamVeil,
      "NotStreamRecipient",
    );
  });
});
