import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:bg-white/90 active:bg-white/80 shadow-[0_8px_24px_rgba(255,255,255,0.12)]",
  secondary:
    "bg-accent-500 text-[var(--text-primary)] hover:bg-accent-400 active:bg-accent-600 shadow-[0_8px_24px_rgba(139,92,246,0.3)]",
  ghost:
    "bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-default)]",
  outline:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-default)] hover:ring-[var(--border-strong)]",
  danger: "bg-red-500/15 text-red-400 hover:bg-red-500/25 ring-1 ring-red-500/30",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
