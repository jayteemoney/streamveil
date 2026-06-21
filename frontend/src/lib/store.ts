import { create } from "zustand";
import { ethers } from "ethers";
import { CHAIN_ID } from "./contracts";
import { resetDecryptAuth } from "./decrypt";
import { humanizeError } from "./errors";

export type ToastKind = "error" | "success" | "info";
export type ToastItem = { id: number; kind: ToastKind; message: string };
let toastSeq = 0;

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
  providers?: Eip1193[];
  isMetaMask?: boolean;
};

/** Resolve an injected EIP-1193 provider, preferring MetaMask when several coexist. */
function injected(): Eip1193 | undefined {
  if (typeof window === "undefined") return undefined;
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  if (!eth) return undefined;
  if (Array.isArray(eth.providers) && eth.providers.length) {
    return eth.providers.find((p) => p.isMetaMask) ?? eth.providers[0];
  }
  return eth;
}

/** EIP-3085 params for chains we can offer to add to the wallet on demand. */
const CHAIN_PARAMS: Record<number, Record<string, unknown>> = {
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com", "https://1rpc.io/sepolia"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

let listenersAttached = false;

type WalletState = {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  ready: boolean; // true once we've checked for an existing connection (hydration-safe)
  hasWallet: boolean;
  decrypted: Record<string, bigint>;
  toasts: ToastItem[];
  init: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  getSigner: () => Promise<ethers.Signer>;
  switchToTargetChain: () => Promise<void>;
  setDecrypted: (entries: Record<string, bigint>) => void;
  notify: (message: string, kind?: ToastKind) => void;
  /** Convenience: humanize any thrown error and show it as an error toast. */
  notifyError: (e: unknown) => void;
  dismissToast: (id: number) => void;
  wrongNetwork: () => boolean;
};

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  connecting: false,
  ready: false,
  hasWallet: false,
  decrypted: {},
  toasts: [],

  // Runs once on mount: detect an already-authorized account without prompting.
  init: async () => {
    const eth = injected();
    if (!eth) {
      set({ ready: true, hasWallet: false });
      return;
    }
    set({ hasWallet: true });

    if (!listenersAttached) {
      listenersAttached = true;
      eth.on?.("accountsChanged", (...a) => {
        const accs = (a[0] as string[]) ?? [];
        resetDecryptAuth();
        set({ address: accs[0] ?? null, decrypted: {} });
      });
      eth.on?.("chainChanged", (...a) => {
        const idArg = a[0] as string | number;
        set({ chainId: Number(idArg), decrypted: {} });
      });
    }

    try {
      const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
      const chainIdHex = (await eth.request({ method: "eth_chainId" })) as string;
      set({
        address: accounts?.[0] ?? null,
        chainId: Number(chainIdHex),
        ready: true,
      });
    } catch {
      set({ ready: true });
    }
  },

  connect: async () => {
    const eth = injected();
    if (!eth) {
      get().notify("No Ethereum wallet detected. Install MetaMask to continue.", "error");
      if (typeof window !== "undefined") window.open("https://metamask.io/download/", "_blank");
      return;
    }
    set({ connecting: true });
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const chainIdHex = (await eth.request({ method: "eth_chainId" })) as string;
      set({
        address: accounts?.[0] ?? null,
        chainId: Number(chainIdHex),
        connecting: false,
        ready: true,
      });
    } catch (e) {
      set({ connecting: false });
      get().notifyError(e);
    }
  },

  disconnect: () => {
    resetDecryptAuth();
    set({ address: null, decrypted: {} });
  },

  getSigner: async () => {
    const eth = injected();
    if (!eth) throw new Error("No wallet found.");
    const provider = new ethers.BrowserProvider(eth as ethers.Eip1193Provider);
    return provider.getSigner();
  },

  switchToTargetChain: async () => {
    const eth = injected();
    if (!eth) return;
    const hexId = "0x" + CHAIN_ID.toString(16);
    const params = CHAIN_PARAMS[CHAIN_ID];
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e) {
      const err = e as { code?: number; message?: string };
      // 4902 = chain unknown to the wallet → add it, then the wallet switches automatically.
      // (MetaMask cannot add 31337/localhost this way; that path only makes sense for public chains.)
      if (err.code === 4902 && params) {
        try {
          await eth.request({ method: "wallet_addEthereumChain", params: [params] });
        } catch (e2) {
          get().notifyError(e2);
        }
      } else if (err.code === 4902) {
        get().notify(
          `This network (chain ${CHAIN_ID}) can't be added automatically. Add it in your wallet manually, or deploy to Sepolia.`,
          "error",
        );
      } else {
        get().notifyError(e);
      }
    }
  },

  setDecrypted: (entries) => set({ decrypted: { ...get().decrypted, ...entries } }),

  notify: (message, kind = "info") => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, kind, message }] });
    // Auto-dismiss after a few seconds (errors linger a touch longer).
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismissToast(id), kind === "error" ? 7000 : 4500);
    }
  },
  notifyError: (e) => get().notify(humanizeError(e), "error"),
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  wrongNetwork: () => {
    const { chainId, address } = get();
    return !!address && chainId !== null && chainId !== CHAIN_ID;
  },
}));
