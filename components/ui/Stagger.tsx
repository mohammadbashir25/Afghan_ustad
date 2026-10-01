"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT, MOTION } from "./utils";

const PARENT = { div: motion.div, ul: motion.ul, ol: motion.ol } as const;
const ITEM = { div: motion.div, li: motion.li } as const;

export type StaggerProps = {
  children: ReactNode;
  /** Seconds between children. */
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  /** Use "ul"/"ol" with StaggerItem as="li" for real lists. */
  as?: keyof typeof PARENT;
  className?: string;
};

export function Stagger({
  children,
  stagger = MOTION.stagger,
  delay = 0,
  once = true,
  amount = 0.15,
  as = "div",
  className,
}: StaggerProps) {
  const reduce = useReducedMotion();
  const Tag = PARENT[as];
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay } },
  };
  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </Tag>
  );
}

export type StaggerItemProps = {
  children: ReactNode;
  as?: keyof typeof ITEM;
  distance?: number;
  className?: string;
};

export function StaggerItem({ children, as = "div", distance = 16, className }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const Tag = ITEM[as];
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : distance },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.6, ease: EASE_OUT } },
  };
  return (
    <Tag className={className} variants={variants}>
      {children}
    </Tag>
  );
}
