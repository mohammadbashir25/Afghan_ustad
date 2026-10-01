"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT } from "./utils";

export type FadeInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  className?: string;
};

/** Opacity-only entrance for small UI pieces. */
export function FadeIn({ children, delay = 0, duration = 0.6, once = true, amount = 0.3, className }: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once, amount }}
      transition={{ duration: reduce ? 0.2 : duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
