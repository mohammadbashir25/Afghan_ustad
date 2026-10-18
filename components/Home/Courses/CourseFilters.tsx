"use client";

/**
 * CourseFilters
 * ---------------------------------------------------------------------------
 * Responsibility: the category filter bar. It is fully controlled (the parent
 * owns `activeId`) and fully data-driven (it renders whatever categories it
 * is given, plus the reserved "All" chip).
 *
 * Interaction decisions
 * - Native <button aria-pressed> chips in a labelled group. This is a filter,
 *   not a tab set, so tab semantics would be wrong for screen readers.
 * - One shared green pill glides between chips via Framer's `layoutId`.
 *   It is the only animated thing here; with reduced motion it snaps.
 * - On narrow screens the bar scrolls horizontally (scrollbar hidden) and
 *   bleeds to the screen edge so it clearly reads as swipeable.
 * - RTL needs no special code: flex + logical spacing mirror automatically,
 *   and scrolling starts from the reading-start edge.
 */
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import {
  ALL_CATEGORY_ID,
  localize,
  type CourseCategory,
} from "./data";

interface CourseFiltersProps {
  /** Categories to offer (the parent already removed empty ones). */
  readonly categories: readonly CourseCategory[];
  /** Currently selected category id, or ALL_CATEGORY_ID. */
  readonly activeId: string;
  /** Number of courses per category id, including ALL_CATEGORY_ID. */
  readonly counts: Readonly<Record<string, number>>;
  readonly onChange: (id: string) => void;
}

export default function CourseFilters({
  categories,
  activeId,
  counts,
  onChange,
}: CourseFiltersProps): React.JSX.Element {
  const t = useTranslations("landing.courses");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

  // Unique per instance so two filter bars could never share one pill.
  const pillId = useId();

  /** "All" first, then the configured categories. */
  const options: ReadonlyArray<{ id: string; label: string }> = [
    { id: ALL_CATEGORY_ID, label: t("filters.all") },
    ...categories.map((category) => ({
      id: category.id,
      label: localize(category.label, locale),
    })),
  ];

  return (
    <div
      role="group"
      aria-label={t("filters.label")}
      // Negative margins let the row bleed to the viewport edge on mobile.
      className="-mx-6 flex gap-2.5 overflow-x-auto px-6 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={`relative shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isActive
                ? "border-primary text-surface"
                : "border-border bg-surface text-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {/* The shared pill: rendered only under the active chip. */}
            {isActive ? (
              <motion.span
                layoutId={pillId}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 36 }
                }
              />
            ) : null}

            <span className="relative flex items-center gap-2">
              {option.label}
              {/* Count chip: gives a sense of catalog depth at a glance. */}
              <span
                aria-hidden="true"
                className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums transition-colors duration-200 ${
                  isActive
                    ? "bg-surface/20 text-surface"
                    : "bg-surface-muted text-text-secondary"
                }`}
              >
                {counts[option.id] ?? 0}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
