import { useState } from "react";
import { ImageIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Optional text shown on the fallback. Defaults to alt. */
  fallbackTitle?: string;
}

/**
 * An <img> that gracefully falls back to a gradient + icon + text
 * if the URL is empty, blob:, or fails to load.
 *
 * This rescues the UI from dead blob: URLs left over from the old
 * URL.createObjectURL flow, and from any future broken uploads.
 */
export function SafeImage({ src, alt, className, fallbackTitle }: Props) {
  const [failed, setFailed] = useState(false);

  const isBad =
    !src ||
    src.trim() === "" ||
    src.startsWith("blob:") ||
    src === "null" ||
    failed;

  if (isBad) {
    return (
      <div
        className={clsx(
          "relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-card)] to-[var(--bg-elevated)]",
          className,
        )}
        aria-label={alt}
      >
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/30">
            <ImageIcon className="h-5 w-5" />
          </div>
          {fallbackTitle && (
            <span className="line-clamp-2 text-xs font-medium text-white/40">
              {fallbackTitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
