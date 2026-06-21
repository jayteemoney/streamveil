"use client";

import { useWallet, type ToastKind } from "@/lib/store";

const STYLES: Record<ToastKind, { wrap: string; icon: string; mark: string }> = {
  error: {
    wrap: "border-rose-500/40 bg-rose-950/85 text-rose-100",
    icon: "text-rose-400",
    mark: "⚠",
  },
  success: {
    wrap: "border-emerald-500/40 bg-emerald-950/85 text-emerald-100",
    icon: "text-emerald-400",
    mark: "✓",
  },
  info: {
    wrap: "border-sky-500/40 bg-sky-950/85 text-sky-100",
    icon: "text-sky-300",
    mark: "ⓘ",
  },
};

export function Toast() {
  const toasts = useWallet((s) => s.toasts);
  const dismiss = useWallet((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-5 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:max-w-sm">
      {toasts.map((t) => {
        const s = STYLES[t.kind];
        return (
          <div key={t.id} className="rise">
            <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 backdrop-blur ${s.wrap}`}>
              <span className={`mt-0.5 ${s.icon}`}>{s.mark}</span>
              <p className="flex-1 text-sm">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="opacity-70 transition hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
