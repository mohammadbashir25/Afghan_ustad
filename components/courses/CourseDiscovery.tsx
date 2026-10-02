"use client";

/**
 * CourseDiscovery
 * ---------------------------------------------------------------------------
 * Owns ALL catalog interaction state: search text, topic, level.
 *
 *  - Filter options are derived from the data (only topics/levels that exist
 *    appear), with counts.
 *  - Search matches title + description in the CURRENT locale.
 *  - While no filter is active the featured course gets its own block and is
 *    removed from the grid; once the visitor filters, it rejoins the normal
 *    results so nothing is hidden from a search.
 *  - Three states: results, "no matches" (with reset), "catalog empty".
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {  useLocale, useTranslations } from "next-intl";
import { LuRotateCcw } from "react-icons/lu";
import { CourseFilters } from "./CourseFilters";
import { CourseGrid } from "./CourseGrid";
import { FeaturedCourse } from "./FeaturedCourse";
import { CATEGORY_ORDER, COURSES_NAMESPACE, LEVEL_ORDER, localize } from "./data";
import { EASE, useMotionPresets } from "./motion";
import type { Course, CourseCategory, CourseLevel, Filter } from "./types";
import { Container } from "@/components/ui/Container"; // existing layout primitive
import s from "./courses.module.css";
import { useFormatNumber } from "../shared/format-number";

export function CourseDiscovery({ courses }: { readonly courses: readonly Course[] }) {
  const t = useTranslations(COURSES_NAMESPACE);
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const { reduce, rise } = useMotionPresets(12);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter<CourseCategory>>("all");
  const [level, setLevel] = useState<Filter<CourseLevel>>("all");

  // Options that actually exist in the data, with counts, in a fixed order.
  const categories = useMemo(
    () =>
      CATEGORY_ORDER.map((id) => ({
        id,
        count: courses.filter((c) => c.category === id).length,
      })).filter((o) => o.count > 0),
    [courses],
  );
  const levels = useMemo(
    () =>
      LEVEL_ORDER.map((id) => ({
        id,
        count: courses.filter((c) => c.level === id).length,
      })).filter((o) => o.count > 0),
    [courses],
  );

  const isFiltering = query.trim() !== "" || category !== "all" || level !== "all";

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return courses.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (level !== "all" && c.level !== level) return false;
      if (!needle) return true;
      const haystack = `${localize(c.title, locale)} ${localize(c.description, locale)}`
        .toLocaleLowerCase(locale);
      return haystack.includes(needle);
    });
  }, [courses, query, category, level, locale]);

  const featured = courses.find((c) => c.featured);
  const showFeatured = Boolean(featured) && !isFiltering;
  const gridCourses = showFeatured
    ? filtered.filter((c) => c.id !== featured?.id)
    : filtered;

  const reset = () => {
    setQuery("");
    setCategory("all");
    setLevel("all");
  };

  return (
    <section className={`${s.section} ${s.discovery}`} aria-labelledby="catalog-heading">
      <Container>
        <h2 id="catalog-heading" className={s.srOnly}>
          {t("discovery.searchLabel")}
        </h2>

        {courses.length === 0 ? (
          <div className={s.state}>
            <h3 className={s.stateTitle}>{t("states.empty.title")}</h3>
            <p className={s.stateText}>{t("states.empty.text")}</p>
          </div>
        ) : (
          <>
            <CourseFilters
              query={query}
              onQueryChange={setQuery}
              category={category}
              onCategoryChange={setCategory}
              level={level}
              onLevelChange={setLevel}
              categories={categories}
              levels={levels}
              total={courses.length}
            />

            {/* Live results line + reset */}
            <div className={s.resultsBar}>
              <p className={s.resultsText} aria-live="polite">
                {t("discovery.results", {
                  shown: formatNumber(filtered.length),
                  total: formatNumber(courses.length),
                  count: filtered.length,
                })}
              </p>
              {isFiltering && (
                <button type="button" className={s.resetLink} onClick={reset}>
                  <LuRotateCcw aria-hidden="true" />
                  {t("discovery.resetFilters")}
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {showFeatured && featured && (
                <motion.div
                  key="featured"
                  className={s.featuredWrap}
                  variants={rise}
                  initial="hidden"
                  animate="visible"
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <FeaturedCourse course={featured} />
                </motion.div>
              )}
            </AnimatePresence>

            {filtered.length === 0 ? (
              <div className={s.state}>
                <h3 className={s.stateTitle}>{t("states.noResults.title")}</h3>
                <p className={s.stateText}>{t("states.noResults.text")}</p>
                <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={reset}>
                  <LuRotateCcw aria-hidden="true" />
                  {t("states.noResults.action")}
                </button>
              </div>
            ) : (
              <CourseGrid courses={gridCourses} />
            )}
          </>
        )}
      </Container>
    </section>
  );
}
