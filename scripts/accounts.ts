import { ethers, network } from "hardhat";

/**
 * Prints the deployer account (first account from MNEMONIC) and its balance on the
 * selected network. Run BEFORE deploying so you know which address to fund:
 *   npx hardhat run scripts/accounts.ts --network sepolia
 */
async function main() {
  const signers = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId ${net.chainId})\n`);

  for (let i = 0; i < Math.min(signers.length, 3); i++) {
    const addr = await signers[i].getAddress();
    const bal = await ethers.provider.getBalance(addr);
    const tag = i === 0 ? "  (deployer — fund this one)" : "";
    console.log(`#${i}  ${addr}  ${ethers.formatEther(bal)} ETH${tag}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
