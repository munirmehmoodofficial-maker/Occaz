import { motion } from "framer-motion";

/**
 * Occaz brand logo — the "ocz" monogram (no text).
 *
 * Composed of:
 *   1. A large rounded "o" (left)
 *   2. A smaller rounded "o" (right, overlapping the first)
 *   3. A horizontal bar with a curved right end — the "z" tail
 *
 * All three elements share a single purple → magenta → pink gradient.
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
  // The logo's natural aspect ratio is 200:140 (about 1.43:1)
  const width = size;
  const height = Math.round((size * 140) / 200);
  const inner = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 140"
      width={width}
      height={height}
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
        {/*
          Large "o" (left)
            Center (60, 60), outer radius 50, inner radius 32
            Annulus drawn as two full circles with even-odd fill rule
        */}
        <path
          fillRule="evenodd"
          d="M 110 60 A 50 50 0 1 0 10 60 A 50 50 0 1 0 110 60 Z
             M 92 60 A 32 32 0 1 1 28 60 A 32 32 0 1 1 92 60 Z"
        />

        {/*
          Smaller "o" (right, overlapping the first)
            Center (115, 55), outer radius 38, inner radius 22
        */}
        <path
          fillRule="evenodd"
          d="M 153 55 A 38 38 0 1 0 77 55 A 38 38 0 1 0 153 55 Z
             M 137 55 A 22 22 0 1 1 93 55 A 22 22 0 1 1 137 55 Z"
        />

        {/*
          Horizontal bar with curved right end — the "z" tail/underline
            Top of bar at y=78, bottom at y=98
            Right end is rounded with a half-circle
        */}
        <path
          d="M 130 78
             L 168 78
             A 10 10 0 0 1 168 98
             L 130 98
             Z"
        />
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
