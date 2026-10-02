"use client";

/**
 * LevelMeter
 * ---------------------------------------------------------------------------
 * Three small bars + the level name. Used on cards, the featured course and
 * the guidance section so "level" always looks the same. Bars are decorative
 * (aria-hidden); the text label carries the meaning.
 */
import { useTranslations } from "next-intl";
import { COURSES_NAMESPACE } from "./data";
import type { CourseLevel } from "./types";
import s from "./courses.module.css";

const RANK: Record<CourseLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function LevelMeter({ level }: { readonly level: CourseLevel }) {
  const t = useTranslations(COURSES_NAMESPACE);
  return (
    <span className={s.level}>
      <span className={s.levelBars} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= RANK[level] ? s.barOn : s.bar} />
        ))}
      </span>
      {t(`levels.${level}`)}
    </span>
  );
}
