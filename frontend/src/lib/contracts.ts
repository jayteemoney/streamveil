import { ethers } from "ethers";
import deployment from "@/abi/deployment.json";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? deployment.chainId ?? 11155111);
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS ?? (deployment.token.address as string);
export const STREAMVEIL_ADDRESS =
  process.env.NEXT_PUBLIC_STREAMVEIL_ADDRESS ?? (deployment.streamVeil.address as string);

export const TOKEN_ABI = deployment.token.abi as ethers.InterfaceAbi;
export const STREAMVEIL_ABI = deployment.streamVeil.abi as ethers.InterfaceAbi;

export const TOKEN_DECIMALS = 6;

/** Read-only provider — lets anyone browse streams without connecting a wallet. */
export function readProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
}

export function tokenContract(runner: ethers.ContractRunner): ethers.Contract {
  return new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, runner);
}

export function streamVeilContract(runner: ethers.ContractRunner): ethers.Contract {
  return new ethers.Contract(STREAMVEIL_ADDRESS, STREAMVEIL_ABI, runner);
}
