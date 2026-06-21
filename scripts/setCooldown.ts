import { ethers, network } from "hardhat";
import deployment from "../frontend/src/abi/deployment.json";

/**
 * Owner-only: set the faucet cooldown (seconds) on the deployed ConfidentialToken.
 *   FAUCET_COOLDOWN=60 npx hardhat run scripts/setCooldown.ts --network sepolia
 * Default is 60s. Use 0 to make the faucet unlimited again.
 */
async function main() {
  const seconds = BigInt(process.env.FAUCET_COOLDOWN ?? "60");
  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("ConfidentialToken", deployment.token.address, signer);

  console.log(`Network: ${network.name}`);
  console.log(`Token:   ${deployment.token.address}`);
  console.log(`Owner:   ${await signer.getAddress()}`);
  console.log(`Setting faucetCooldown = ${seconds}s ...`);

  const tx = await token.setFaucetCooldown(seconds);
  await tx.wait();

  const onchain = await token.faucetCooldown();
  console.log(`Done. faucetCooldown is now ${onchain}s (tx ${tx.hash})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
