"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFinePointer } from "./hooks";
import { cn } from "./utils";

export type SpotlightProps = {
  children: ReactNode;
  /** Diameter of the glow in px. */
  size?: number;
  /** Peak strength as a percentage of the tone color. Keep low (8–16). */
  intensity?: number;
  /** "accent" (gold) suits dark sections; "primary" (green) suits light ones. */
  tone?: "accent" | "primary";
  className?: string;
};

/**
 * Pointer-follow radial highlight behind the children. Position updates go
 * through motion values (no React re-renders). Mouse only; inert on touch and
 * with reduced motion, where it renders a plain wrapper.
 */
export function Spotlight({ children, size = 480, intensity = 12, tone = "accent", className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const presence = useMotionValue(0);
  const opacity = useSpring(presence, { stiffness: 120, damping: 24 });

  const color = tone === "accent" ? "var(--color-accent)" : "var(--color-primary)";
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, color-mix(in srgb, ${color} ${intensity}%, transparent), transparent 70%)`;

  if (!fine || reduce) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  function track(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
    presence.set(1);
  }

  return (
    <div
      ref={ref}
      className={cn("relative isolate overflow-hidden", className)}
      onPointerMove={track}
      onPointerLeave={() => presence.set(0)}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background, opacity }} />
      <div className="relative">{children}</div>
    </div>
  );
}
