"use client";

/**
 * CourseFilters
 * ---------------------------------------------------------------------------
 * Fully controlled UI (state lives in CourseDiscovery):
 *   row 1 → search field  +  level segmented control
 *   row 2 → topic chips with counts (horizontally scrollable on mobile)
 * Buttons use aria-pressed so state is announced. The search icon and clear
 * button sit on logical start/end, so they swap sides automatically in RTL.
 */
import { useTranslations } from "next-intl";
import { LuSearch, LuX } from "react-icons/lu";
import { COURSES_NAMESPACE } from "./data";
import type { CourseCategory, CourseLevel, Filter } from "./types";
import s from "./courses.module.css";
import { useFormatNumber } from "../shared/format-number";

interface Option<T extends string> {
  readonly id: T;
  readonly count: number;
}

interface CourseFiltersProps {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly category: Filter<CourseCategory>;
  readonly onCategoryChange: (value: Filter<CourseCategory>) => void;
  readonly level: Filter<CourseLevel>;
  readonly onLevelChange: (value: Filter<CourseLevel>) => void;
  readonly categories: readonly Option<CourseCategory>[];
  readonly levels: readonly Option<CourseLevel>[];
  readonly total: number;
}

export function CourseFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  level,
  onLevelChange,
  categories,
  levels,
  total,
}: CourseFiltersProps) {
  const t = useTranslations(COURSES_NAMESPACE);
  const formatNumber = useFormatNumber();

  return (
    <div className={s.filters}>
      <div className={s.toolbar}>
        {/* Search */}
        <label className={s.search}>
          <span className={s.srOnly}>{t("discovery.searchLabel")}</span>
          <LuSearch className={s.searchIcon} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("discovery.searchPlaceholder")}
            className={s.searchInput}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className={s.searchClear}
              onClick={() => onQueryChange("")}
              aria-label={t("discovery.clearSearch")}
            >
              <LuX aria-hidden="true" />
            </button>
          )}
        </label>

        {/* Level segmented control */}
        <div className={s.segmented} role="group" aria-label={t("discovery.levelLabel")}>
          <button
            type="button"
            aria-pressed={level === "all"}
            className={level === "all" ? s.segmentOn : s.segment}
            onClick={() => onLevelChange("all")}
          >
            {t("discovery.all")}
          </button>
          {levels.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={level === l.id}
              className={level === l.id ? s.segmentOn : s.segment}
              onClick={() => onLevelChange(l.id)}
            >
              {t(`levels.${l.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Topic chips */}
      <div className={s.chips} role="group" aria-label={t("discovery.categoryLabel")}>
        <button
          type="button"
          aria-pressed={category === "all"}
          className={category === "all" ? s.chipOn : s.chip}
          onClick={() => onCategoryChange("all")}
        >
          {t("discovery.all")}
          <span className={s.chipCount}>{formatNumber(total)}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            className={category === c.id ? s.chipOn : s.chip}
            onClick={() => onCategoryChange(c.id)}
          >
            {t(`categories.${c.id}`)}
            <span className={s.chipCount}>{formatNumber(c.count)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
