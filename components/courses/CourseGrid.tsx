"use client";

/**
 * CourseGrid
 * ---------------------------------------------------------------------------
 * Responsive list of cards (1 → 2 → 3 columns). Filtering is animated with
 * Framer's `layout` + AnimatePresence(popLayout): cards that stay glide to
 * their new slot, cards that leave fade out without collapsing the grid.
 * Reduced motion: layout animation is off, only opacity remains.
 */
import { AnimatePresence, motion } from "framer-motion";
import { CourseCard } from "./CourseCard";
import { EASE, useMotionPresets } from "./motion";
import type { Course } from "./types";
import s from "./courses.module.css";

export function CourseGrid({ courses }: { readonly courses: readonly Course[] }) {
  const { reduce } = useMotionPresets();

  return (
    <ul className={s.grid}>
      <AnimatePresence mode="popLayout" initial={false}>
        {courses.map((course, i) => (
          <motion.li
            key={course.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 5) * 0.04 }}
          >
            <CourseCard course={course} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
