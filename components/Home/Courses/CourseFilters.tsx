"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { ALL_CATEGORY_ID, localize, type CourseCategory } from "./data";

interface CourseFiltersProps {
  readonly categories: readonly CourseCategory[];
  readonly activeId: string;
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
  const pillId = useId();

  const options = [
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
      className="flex w-full flex-nowrap gap-2.5 overflow-x-auto py-2 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        const count = counts[option.id] ?? 0;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={`relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isActive
                ? "border-primary text-white"
                : "border-border bg-surface text-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {isActive && (
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
            )}

            <span className="relative z-10">{option.label}</span>

            <span
              aria-hidden="true"
              className={`relative z-10 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-surface-muted text-text-secondary"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
