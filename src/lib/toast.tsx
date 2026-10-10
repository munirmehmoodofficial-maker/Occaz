import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import clsx from "clsx";

// Supported toast tones. Backwards compatible: "ok" / "err" / "info" still work.
export type ToastTone = "ok" | "err" | "info" | "green" | "red" | "amber" | "violet" | "default";

interface ToastInput {
  tone?: ToastTone;
  title?: string;
  message?: string;
  // Legacy: just a string passed as the first arg
  text?: string;
}
interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message?: string;
  text?: string;
}

interface Ctx {
  push: (a: ToastTone | ToastInput, b?: string) => void;
}
const ToastCtx = createContext<Ctx | null>(null);

let nextId = 1;

const TONE_CLASSES: Record<ToastTone, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  err: "border-red-500/30 bg-red-500/10 text-red-200",
  red: "border-red-500/30 bg-red-500/10 text-red-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  info: "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)]",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-100",
  default: "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)]",
};

const TONE_ICON: Record<ToastTone, "ok" | "err" | "info"> = {
  ok: "ok",
  green: "ok",
  err: "err",
  red: "err",
  amber: "info",
  info: "info",
  violet: "info",
  default: "info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((a: ToastTone | ToastInput, b?: string) => {
    const id = nextId++;
    // Normalize input: either (kind, text) or {tone, title, message}
    let item: ToastItem;
    if (typeof a === "string") {
      item = { id, tone: a as ToastTone, text: b };
    } else {
      item = { id, tone: a.tone ?? "info", ...a };
    }
    setItems((p) => [...p, item]);
    window.setTimeout(() => {
      setItems((p) => p.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismiss = (id: number) =>
    setItems((p) => p.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        <AnimatePresence>
          {items.map((t) => {
            const text = t.text ?? t.message ?? t.title ?? "";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className={clsx(
                  "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border p-3 text-sm shadow-2xl backdrop-blur",
                  TONE_CLASSES[t.tone] ?? TONE_CLASSES.default,
                )}
              >
                {TONE_ICON[t.tone] === "ok" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                {TONE_ICON[t.tone] === "err" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                {TONE_ICON[t.tone] === "info" && <Info className="mt-0.5 h-4 w-4 shrink-0" />}
                <div className="flex-1 min-w-0">
                  {t.title && <div className="font-semibold leading-tight">{t.title}</div>}
                  {text && <div className={clsx("leading-snug", t.title && "mt-0.5")}>{text}</div>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="rounded p-0.5 opacity-60 transition hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // safe no-op for callers outside the provider
    return {
      push: (_a: ToastTone | ToastInput, _b?: string) => {},
    } as Ctx;
  }
  return ctx;
}
