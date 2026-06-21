import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 uses Turbopack by default; it bundles the relayer SDK's WebAssembly natively.
  // Pin the workspace root so the parent Hardhat lockfile isn't mistaken for it.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
