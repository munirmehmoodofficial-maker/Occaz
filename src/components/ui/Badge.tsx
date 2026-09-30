import clsx from "clsx";
import type { ReactNode } from "react";

type Tone =
  | "default"
  | "accent"
  | "pink"
  | "cyan"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "violet"
  | "outline";

const tones: Record<Tone, string> = {
  default:
    "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]",
  accent:
    "bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30",
  pink: "bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30",
  cyan: "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30",
  emerald: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  red: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  blue: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  violet: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
  outline:
    "bg-transparent text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
