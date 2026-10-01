"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useIsRTL } from "./hooks";
import { EASE_OUT, MOTION } from "./utils";

/**
 * Direction = the way the element travels while appearing.
 * "up" starts lower and moves up. "left"/"right" are physical.
 * "start"/"end" are logical and flip in RTL.
 */
export type RevealDirection = "up" | "down" | "left" | "right" | "start" | "end" | "none";

export type RevealProps = {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  amount?: number;
  className?: string;
};

function offsetFor(direction: RevealDirection, distance: number, rtl: boolean) {
  const physical =
    direction === "start" ? (rtl ? "right" : "left") : direction === "end" ? (rtl ? "left" : "right") : direction;
  switch (physical) {
    case "up":
      return { x: 0, y: distance };
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = MOTION.duration,
  distance = MOTION.distance,
  once = true,
  amount = 0.2,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  const rtl = useIsRTL();
  const { x, y } = reduce ? { x: 0, y: 0 } : offsetFor(direction, distance, rtl);

  return (
    <motion.div
      // Remount once the real direction is known so start/end offsets are correct in RTL.
      key={rtl ? "rtl" : "ltr"}
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: reduce ? 0.3 : duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
