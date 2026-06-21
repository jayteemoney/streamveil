import { ethers, network } from "hardhat";
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

/**
 * Deploys ConfidentialToken + StreamVeil and writes an artifact the frontend consumes
 * (addresses + ABIs), keyed by chainId, to `deployments/<chainId>.json` and
 * `frontend/src/abi/deployment.json`.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`Network: ${network.name} (chainId ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const token = await (await ethers.getContractFactory("ConfidentialToken"))
    .connect(deployer)
    .deploy("StreamVeil USD", "svUSD", "https://streamveil.xyz");
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log(`ConfidentialToken: ${tokenAddr}`);

  const streamVeil = await (await ethers.getContractFactory("StreamVeil")).connect(deployer).deploy();
  await streamVeil.waitForDeployment();
  const streamVeilAddr = await streamVeil.getAddress();
  console.log(`StreamVeil:        ${streamVeilAddr}`);

  const tokenArtifact = await ethers.getContractFactory("ConfidentialToken");
  const streamArtifact = await ethers.getContractFactory("StreamVeil");

  const deployment = {
    chainId,
    network: network.name,
    deployedAt: new Date().toISOString(),
    token: {
      address: tokenAddr,
      abi: JSON.parse(tokenArtifact.interface.formatJson()),
    },
    streamVeil: {
      address: streamVeilAddr,
      abi: JSON.parse(streamArtifact.interface.formatJson()),
    },
  };

  const json = JSON.stringify(deployment, null, 2);

  const rootDir = resolve(__dirname, "../deployments");
  mkdirSync(rootDir, { recursive: true });
  writeFileSync(resolve(rootDir, `${chainId}.json`), json);

  const feDir = resolve(__dirname, "../frontend/src/abi");
  mkdirSync(feDir, { recursive: true });
  writeFileSync(resolve(feDir, "deployment.json"), json);

  console.log(`\nWrote deployments/${chainId}.json and frontend/src/abi/deployment.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
