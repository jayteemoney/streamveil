"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { Landing } from "@/components/Landing";
import { Dashboard } from "@/components/Dashboard";
import { Toast } from "@/components/Toast";

export default function Home() {
  const init = useWallet((s) => s.init);
  const [view, setView] = useState<"home" | "app">("home");

  // Detect an already-connected wallet on mount (no prompt) and wire listeners.
  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      <Nav view={view} setView={setView} />
      {view === "home" ? <Landing onLaunch={() => setView("app")} /> : <Dashboard />}
      <Toast />
    </>
  );
}
