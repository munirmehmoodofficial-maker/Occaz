import { motion } from "framer-motion";

/**
 * Occaz brand logo — the swirl mark (no text).
 *
 * Three filled teardrop shapes in a purple → magenta → pink gradient,
 * layered around a stylized "Z" at the center. The teardrops have
 * proper round bodies and tapered tails (not simple ring arcs).
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
          x1="20"
          y1="5"
          x2="85"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#5b21b6" />
          <stop offset="0.35" stopColor="#8b1dba" />
          <stop offset="0.65" stopColor="#c026d3" />
          <stop offset="1" stopColor="#ec1e79" />
        </linearGradient>
      </defs>

      <g fill={`url(#${gradId})`}>
        {/*
          OUTER teardrop — body at upper-left, tail sweeps down-right
            body center (38, 38), radius 26, tip (90, 90)
            tangent points (calculated): T1=(48.4, 61.9), T2=(61.9, 48.4)
            arc goes around the back (upper-left) using large-arc + sweep
        */}
        <path d="M 90 90 L 48.4 61.9 A 26 26 0 1 0 61.9 48.4 L 90 90 Z" />

        {/*
          MIDDLE teardrop — smaller, layered in the upper portion,
            tail pointing up-right
            body center (50, 25), radius 14, tip (78, 18)
        */}
        <path d="M 78 18 L 63.5 28.6 A 14 14 0 1 0 60.25 15.47 L 78 18 Z" />

        {/*
          BOTTOM-LEFT teardrop — thin, tail at lower-left
            body center (22, 70), radius 10, tip (8, 86)
        */}
        <path d="M 8 86 L 12.6 73.4 A 10 10 0 1 0 19.7 79.7 L 8 86 Z" />

        {/*
          INNER Z — three rounded strokes (top bar, diagonal,
            bottom bar), tilted -14°.  Stroke-linecap round gives
            soft corners where the diagonal meets the bars.
        */}
        <g
          stroke={`url(#${gradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          transform="rotate(-14 50 50)"
        >
          <line x1="32" y1="32" x2="64" y2="32" />
          <line x1="64" y1="32" x2="32" y2="64" />
          <line x1="32" y1="64" x2="64" y2="64" />
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
