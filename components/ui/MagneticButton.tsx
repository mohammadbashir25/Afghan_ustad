"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFinePointer } from "./hooks";
import { cn } from "./utils";

export type MagneticButtonProps = {
  /** A <Button> (or any single interactive element). */
  children: ReactNode;
  /** 0–0.3. How far the element follows the pointer. Default is deliberately small. */
  strength?: number;
  className?: string;
};

const MAX_SHIFT = 6; // px — hard cap so it never reads as "dragging"
const SPRING = { stiffness: 220, damping: 22, mass: 0.4 } as const;

/**
 * Wrap a special CTA: <MagneticButton><Button>…</Button></MagneticButton>
 * The element drifts a few pixels toward the pointer and settles back on leave.
 * Inactive on touch devices and with reduced motion (renders children as-is).
 */
export function MagneticButton({ children, strength = 0.12, className }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  if (!fine || reduce) {
    return <span className={cn("inline-flex", className)}>{children}</span>;
  }

  const clamp = (value: number) => Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, value));

  function onPointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(clamp((event.clientX - (rect.left + rect.width / 2)) * strength));
    y.set(clamp((event.clientY - (rect.top + rect.height / 2)) * strength));
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x: sx, y: sy }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.span>
  );
}
