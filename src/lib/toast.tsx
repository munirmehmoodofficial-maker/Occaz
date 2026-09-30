import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import clsx from "clsx";

type ToastKind = "ok" | "err" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface Ctx {
  push: (kind: ToastKind, text: string) => void;
}
const ToastCtx = createContext<Ctx | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = nextId++;
    setItems((p) => [...p, { id, kind, text }]);
    window.setTimeout(() => {
      setItems((p) => p.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = (id: number) =>
    setItems((p) => p.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className={clsx(
                "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border p-3 text-sm shadow-2xl backdrop-blur",
                t.kind === "ok" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
                t.kind === "err" &&
                  "border-red-500/30 bg-red-500/10 text-red-200",
                t.kind === "info" &&
                  "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)]",
              )}
            >
              {t.kind === "ok" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              {t.kind === "err" && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              {t.kind === "info" && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent-400" />}
              <span className="flex-1">{t.text}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
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
      push: (_kind: ToastKind, _text: string) => {},
    } as Ctx;
  }
  return ctx;
}
