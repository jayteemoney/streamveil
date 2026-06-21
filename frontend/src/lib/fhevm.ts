import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instancePromise: Promise<FhevmInstance> | null = null;

/**
 * Lazily initialize the Zama relayer SDK (loads WASM) and bind an instance to the
 * injected wallet. Browser-only; safe to call repeatedly (memoized).
 */
export async function getFhevmInstance(): Promise<FhevmInstance> {
  if (typeof window === "undefined") {
    throw new Error("The Zama SDK can only run in the browser.");
  }
  if (!instancePromise) {
    instancePromise = (async () => {
      const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/web");
      await initSDK(); // loads the TFHE/KMS WebAssembly modules
      const ethereum = (window as unknown as { ethereum?: unknown }).ethereum;
      if (!ethereum) throw new Error("No injected wallet found.");
      return createInstance({
        ...SepoliaConfig,
        network: ethereum as Parameters<typeof createInstance>[0]["network"],
      });
    })().catch((err) => {
      instancePromise = null; // allow retry after a failure
      throw err;
    });
  }
  return instancePromise;
}
