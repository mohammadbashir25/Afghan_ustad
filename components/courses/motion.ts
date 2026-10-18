/**
 * Shared Framer Motion presets for the Courses page.
 * One place to tune timing; every variant collapses to a plain fade
 * (no movement) when the user prefers reduced motion.
 */
import { useReducedMotion, type Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export interface MotionPresets {
  readonly reduce: boolean;
  /** Parent that staggers its children. */
  readonly stagger: Variants;
  /** Child that rises into place. */
  readonly rise: Variants;
}

export function useMotionPresets(distance = 20): MotionPresets {
  const reduce = Boolean(useReducedMotion());
  return {
    reduce,
    stagger: {
      hidden: {},
      visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
    },
    rise: {
      hidden: reduce ? { opacity: 1 } : { opacity: 0, y: distance },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: EASE },
      },
    },
  };
}
