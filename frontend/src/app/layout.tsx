import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StreamVeil — Pay people by the second, keep the amounts private",
  description:
    "StreamVeil streams salaries, grants, and vesting in real time on Ethereum — while every amount stays scrambled on the public chain. Hide the salary, not the payday. Powered by Zama's fhEVM.",
  openGraph: {
    title: "StreamVeil — Private, real-time payroll on Ethereum",
    description:
      "Stream money by the second while every amount stays private. Powered by Zama's Fully Homomorphic Encryption.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
