import { motion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";

const easing = [0.22, 1, 0.36, 1] as const;

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: easing } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easing },
  },
};

export const staggerParent = (stagger = 0.06, delay = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.5, ease: easing, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  delay = 0,
  stagger = 0.06,
  className,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerParent(stagger, delay)}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div variants={fadeInUp} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: easing }}
    >
      {children}
    </motion.div>
  );
}
