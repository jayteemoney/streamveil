import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// A throwaway mnemonic is used for local development if none is provided.
const MNEMONIC: string =
  process.env.MNEMONIC ?? "test test test test test test test test test test test junk";
const SEPOLIA_RPC_URL: string =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash keeps deterministic bytecode across machines.
        bytecodeHash: "none",
      },
      optimizer: {
        enabled: true,
        runs: 800,
      },
      // FHE contracts juggle many ciphertext handles; IR codegen avoids "stack too deep".
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0",
        count: 10,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  mocha: {
    timeout: 120000,
  },
};

export default config;
