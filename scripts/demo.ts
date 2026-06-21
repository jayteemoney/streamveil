import { FhevmType } from "@fhevm/hardhat-plugin";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, fhevm } from "hardhat";

/**
 * End-to-end scripted demo (run on the in-process hardhat network or `--network localhost`):
 *   faucet -> register org -> create stream -> accrue -> claim -> auditor reveal.
 * Prints decrypted values at each step to prove the confidential accounting works.
 */
async function main() {
  await fhevm.initializeCLIApi(); // required when running outside the test lifecycle

  const [deployer, alice, bob, carol] = await ethers.getSigners();
  const fmt = (v: bigint) => (Number(v) / 1e6).toFixed(2);

  const token = await (await ethers.getContractFactory("ConfidentialToken"))
    .connect(deployer)
    .deploy("StreamVeil USD", "svUSD", "https://streamveil.xyz");
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();

  const streamVeil = await (await ethers.getContractFactory("StreamVeil")).connect(deployer).deploy();
  await streamVeil.waitForDeployment();
  const streamVeilAddr = await streamVeil.getAddress();

  const dec = (handle: string, addr: string, signer: typeof alice) =>
    handle === ethers.ZeroHash ? Promise.resolve(0n) : fhevm.userDecryptEuint(FhevmType.euint64, handle, addr, signer);

  console.log("ConfidentialToken:", tokenAddr);
  console.log("StreamVeil:       ", streamVeilAddr, "\n");

  // 1. Alice (DAO payer) gets test tokens + approves StreamVeil as operator.
  await (await token.connect(alice).faucet()).wait();
  await (await token.connect(alice).setOperator(streamVeilAddr, 2n ** 47n)).wait();
  console.log("Alice balance after faucet:", fmt(await dec(await token.confidentialBalanceOf(alice.address), tokenAddr, alice)), "svUSD");

  // 2. Register a DAO and open a 1,000s stream of 100 svUSD to Bob.
  await (await streamVeil.connect(alice).registerOrganization("Acme DAO")).wait();
  const orgId = await streamVeil.orgCount();
  const start = (await time.latest()) + 1;
  const stop = start + 1000;
  const enc = await fhevm.createEncryptedInput(streamVeilAddr, alice.address).add64(100_000_000n).encrypt();
  await (
    await streamVeil.connect(alice).createStream(orgId, bob.address, tokenAddr, start, stop, enc.handles[0], enc.inputProof)
  ).wait();
  const streamId = await streamVeil.streamCount();
  console.log(`\nStream #${streamId}: 100.00 svUSD over 1000s to Bob (amounts encrypted on-chain)`);

  // 3. Let it accrue, then Bob claims.
  await time.increase(250);
  await (await streamVeil.connect(bob).claim(streamId)).wait();
  console.log("Bob balance after claim (~25%):", fmt(await dec(await token.confidentialBalanceOf(bob.address), tokenAddr, bob)), "svUSD");

  // 4. Auditor reveal: Alice authorizes Carol, who decrypts the deposit.
  await (await streamVeil.connect(alice).setAuditor(streamId, carol.address)).wait();
  const s = await streamVeil.getStream(streamId);
  console.log("Auditor (Carol) decrypts deposit:", fmt(await dec(s.deposit, streamVeilAddr, carol)), "svUSD");

  console.log("\nDemo complete ✅");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
