import { motion } from "framer-motion";

/**
 * Occaz brand logo — the swirl / loop mark (no text).
 *
 * Two layered teardrop-shaped arcs in a purple → magenta → pink
 * gradient, wrapping around a stylized "Z" with curved corners at
 * the center.
 *
 * Props
 *   size       pixel size (square)
 *   className  extra class names on the <svg>
 *   withMotion wraps in a Framer-Motion spring-in animation
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
  const gradId = "occaz-logo-grad";
  const inner = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Occaz"
      role="img"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="10"
          y1="0"
          x2="95"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#5b21b6" />
          <stop offset="0.35" stopColor="#9333ea" />
          <stop offset="0.7" stopColor="#c026d3" />
          <stop offset="1" stopColor="#ec1e79" />
        </linearGradient>
      </defs>

      <g fill={`url(#${gradId})`}>
        {/* Outer ring — large teardrop arc opening at the bottom-right */}
        <path
          d="M 86 32
             A 40 40 0 1 0 60 86
             L 60 74
             A 28 28 0 1 1 74 32
             Z"
        />

        {/* Inner teardrop — a smaller arc layered in the upper-right */}
        <path
          d="M 76 24
             A 28 28 0 0 0 30 28
             L 36 36
             A 18 18 0 0 1 64 32
             Z"
        />

        {/* Bottom-left trail — a thin teardrop tail */}
        <path
          d="M 14 76
             A 22 22 0 0 0 30 92
             L 30 84
             A 14 14 0 0 1 22 76
             Z"
        />

        {/* Inner Z — top bar, diagonal, bottom bar (curved corners) */}
        <g transform="rotate(-14 50 50)">
          <rect x="30" y="30" width="40" height="6" rx="3" />
          <path d="M 36 36 L 64 36 L 60 62 L 32 62 L 60 36 Z" />
          <rect x="30" y="58" width="40" height="6" rx="3" />
        </g>
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
