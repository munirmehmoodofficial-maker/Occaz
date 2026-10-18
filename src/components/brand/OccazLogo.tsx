import { motion } from "framer-motion";
import { useBranding } from "../../hooks/useBranding";

/**
 * Occaz brand logo — supports an admin-uploaded custom logo.
 *
 * When the admin has uploaded a logo (via /admin/branding), the
 * uploaded image is shown. Otherwise the built-in "ocz" monogram
 * (purple → magenta → pink gradient) is rendered.
 *
 * Props
 *   size       pixel size (square) — height is computed from the
 *              custom image's aspect ratio, or 200:140 for the
 *              built-in monogram
 *   className  extra class names on the <svg>/<img>
 *   withMotion wraps the built-in monogram in a Framer-Motion
 *              spring-in animation
 */
export function OccazLogo({
  size = 32,
  className = "",
  withMotion = false,
}: {
  size?: number;
  className?: string;
  withMotion?: boolean;
}) {
  const brand = useBranding();
  const gradId = "occaz-logo-grad";

  // ─── Custom uploaded logo ───────────────────────────────────
  if (brand.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt="Occaz"
        style={{ height: size, width: "auto", maxWidth: size * 4 }}
        className={className}
        draggable={false}
      />
    );
  }

  // ─── Built-in "ocz" monogram (fallback) ─────────────────────
  const width = size;
  const height = Math.round((size * 140) / 200);
  const inner = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 140"
      width={width}
      height={height}
      style={{ display: "block" }}
      className={className}
      aria-label="Occaz"
      role="img"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="20"
          y1="20"
          x2="180"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.35" stopColor="#a21caf" />
          <stop offset="0.7" stopColor="#d946ef" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
      </defs>

      <g fill={`url(#${gradId})`}>
        <path
          fillRule="evenodd"
          d="M 110 60 A 50 50 0 1 0 10 60 A 50 50 0 1 0 110 60 Z
             M 92 60 A 32 32 0 1 1 28 60 A 32 32 0 1 1 92 60 Z"
        />
        <path
          fillRule="evenodd"
          d="M 153 55 A 38 38 0 1 0 77 55 A 38 38 0 1 0 153 55 Z
             M 137 55 A 22 22 0 1 1 93 55 A 22 22 0 1 1 137 55 Z"
        />
        <path d="M 130 78 L 168 78 A 10 10 0 0 1 168 98 L 130 98 Z" />
      </g>
    </svg>
  );

  if (!withMotion) return inner;
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="inline-flex"
    >
      {inner}
    </motion.span>
  );
}
