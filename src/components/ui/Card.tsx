import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        "rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)] transition-all duration-300",
        className,
      )}
    >
      {children}
    </div>
  );
}
