"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { LuArrowRight, LuSearchX } from "react-icons/lu";
import { useLocale, useTranslations } from "next-intl";

import CourseFilters from "./CourseFilters";
import FeaturedCourseCard, {
  COVER_TONES,
  CourseCard,
  CourseCardSkeleton,
} from "./FeaturedCourseCard";
import {
  ALL_CATEGORY_ID,
  COURSE_CATEGORIES,
  COURSES,
  COURSES_ALL_HREF,
  HOME_COURSE_LIMIT,
  sortForDisplay,
  type Course,
  type CourseCategory,
} from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

const toLocalizedDigits = (value: number, locale: string) => {
  if (locale !== "ps" && locale !== "fa") {
    return String(value);
  }

  const digits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(
    /\d/g,
    (digit) => digits[Number(digit)],
  );
};

interface CoursesProps {
  readonly courses?: readonly Course[];
  readonly categories?: readonly CourseCategory[];
  readonly isLoading?: boolean;
}

const sectionStyle: CSSProperties = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  paddingBlock: "clamp(4.5rem, 9vw, 8rem)",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "80rem",
  marginInline: "auto",
  paddingInline: "clamp(1.5rem, 4vw, 2rem)",
};

export default function Courses({
  courses = COURSES,
  categories = COURSE_CATEGORIES,
  isLoading = false,
}: CoursesProps): React.JSX.Element {
  const t = useTranslations("landing.courses");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

  const [activeId, setActiveId] = useState<string>(ALL_CATEGORY_ID);

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, {
    once: true,
    amount: 0.1,
  });

  const sorted = useMemo(
    () => sortForDisplay(courses),
    [courses],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      [ALL_CATEGORY_ID]: sorted.length,
    };

    for (const course of sorted) {
      result[course.categoryId] =
        (result[course.categoryId] ?? 0) + 1;
    }

    return result;
  }, [sorted]);

  const usedCategories = useMemo(
    () =>
      categories.filter(
        (category) => (counts[category.id] ?? 0) > 0,
      ),
    [categories, counts],
  );

  const effectiveId = usedCategories.some(
    (category) => category.id === activeId,
  )
    ? activeId
    : ALL_CATEGORY_ID;

  const categoryById = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category,
        ]),
      ),
    [categories],
  );

  const visible = useMemo(
    () =>
      sorted
        .filter(
          (course) =>
            effectiveId === ALL_CATEGORY_ID ||
            course.categoryId === effectiveId,
        )
        .slice(0, HOME_COURSE_LIMIT),
    [sorted, effectiveId],
  );

  const [lead, ...rest] = visible;
  const sideCourses = rest.slice(0, 2);
  const gridCourses = rest.slice(2);

  const resultCount = toLocalizedDigits(
    visible.length,
    locale,
  );

  const stagger: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  const header: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.7,
        ease: EASE,
      },
    },
  };

  const hasCourses = courses.length > 0;

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="courses"
        aria-labelledby="courses-heading"
        style={sectionStyle}
        className="bg-surface-muted"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50rem_30rem_at_0%_0%,rgba(230,244,238,0.95),transparent_65%)]"
        />

        <div style={containerStyle}>
          <motion.div
            variants={header}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-col gap-6 text-start md:flex-row md:items-end md:justify-between"
          >
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 text-sm font-semibold text-primary">
                <span
                  aria-hidden="true"
                  className="h-0.5 w-10 rounded-full bg-accent"
                />
                {t("eyebrow")}
              </p>

              <h2
                id="courses-heading"
                className="mt-5 text-balance text-3xl font-bold leading-[1.5] text-primary-dark sm:text-4xl xl:text-5xl xl:leading-[1.45]"
              >
                {t("heading")}
              </h2>

              <p className="mt-4 max-w-xl text-base leading-[2] text-text-secondary sm:text-lg">
                {t("description")}
              </p>
            </div>

            <Link
              href={COURSES_ALL_HREF}
              className="group inline-flex w-fit shrink-0 items-center gap-2 text-base font-semibold text-primary underline-offset-8 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              {t("cta.viewAll")}

              <LuArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
              />
            </Link>
          </motion.div>

          {hasCourses && !isLoading ? (
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CourseFilters
                categories={usedCategories}
                activeId={effectiveId}
                counts={counts}
                onChange={setActiveId}
              />

              <p
                role="status"
                aria-live="polite"
                className="shrink-0 text-sm text-text-secondary"
              >
                {t("resultCount", {
                  count: resultCount,
                })}
              </p>
            </div>
          ) : null}

          <div
            ref={gridRef}
            className="mt-8"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <div
                role="status"
                aria-label={t("loading")}
                className="grid gap-6 lg:grid-cols-12"
              >
                <div className="lg:col-span-7">
                  <CourseCardSkeleton variant="featured" />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-5">
                  <CourseCardSkeleton variant="compact" />
                  <CourseCardSkeleton variant="compact" />
                </div>
              </div>
            ) : visible.length === 0 || !lead ? (
              <EmptyState
                canReset={effectiveId !== ALL_CATEGORY_ID}
                onReset={() =>
                  setActiveId(ALL_CATEGORY_ID)
                }
              />
            ) : (
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={effectiveId}
                  variants={stagger}
                  initial="hidden"
                  animate={
                    gridInView ? "visible" : "hidden"
                  }
                  exit={{
                    opacity: 0,
                    transition: {
                      duration: prefersReducedMotion
                        ? 0
                        : 0.15,
                    },
                  }}
                >
                  <div className="grid gap-6 lg:grid-cols-12">
                    <div
                      className={
                        sideCourses.length > 0
                          ? "lg:col-span-7"
                          : "lg:col-span-12"
                      }
                    >
                      <FeaturedCourseCard
                        course={lead}
                        category={categoryById.get(
                          lead.categoryId,
                        )}
                      />
                    </div>

                    {sideCourses.length > 0 ? (
                      <div className="flex flex-col gap-6 lg:col-span-5">
                        {sideCourses.map(
                          (course, index) => (
                            <div
                              key={course.id}
                              className="flex-1"
                            >
                              <CourseCard
                                variant="compact"
                                course={course}
                                category={categoryById.get(
                                  course.categoryId,
                                )}
                                tone={
                                  COVER_TONES[
                                    index %
                                      COVER_TONES.length
                                  ]
                                }
                              />
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>

                  {gridCourses.length > 0 ? (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {gridCourses.map(
                        (course, index) => (
                          <CourseCard
                            key={course.id}
                            variant="standard"
                            course={course}
                            category={categoryById.get(
                              course.categoryId,
                            )}
                            tone={
                              COVER_TONES[
                                (index + 2) %
                                  COVER_TONES.length
                              ]
                            }
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <CatalogBand />
        </div>
      </section>
    </MotionConfig>
  );
}

interface EmptyStateProps {
  readonly canReset: boolean;
  readonly onReset: () => void;
}

function EmptyState({
  canReset,
  onReset,
}: EmptyStateProps): React.JSX.Element {
  const t = useTranslations("landing.courses");

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-primary-light text-primary"
      >
        <LuSearchX className="size-6" />
      </span>

      <h3 className="text-xl font-bold text-foreground">
        {t("empty.title")}
      </h3>

      <p className="max-w-md text-base leading-[1.9] text-text-secondary">
        {t("empty.description")}
      </p>

      {canReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("empty.reset")}
        </button>
      ) : null}
    </div>
  );
}

function CatalogBand(): React.JSX.Element {
  const t = useTranslations("landing.courses");

  return (
    <div className="relative mt-14 overflow-hidden rounded-[2rem] bg-primary-dark px-7 py-10 text-start text-surface sm:px-12 sm:py-12">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full text-accent opacity-[0.1] rtl:-scale-x-100"
      >
        <defs>
          <pattern
            id="courses-band-lattice"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M13 13H51V51H13Z M32 4L60 32L32 60L4 32Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#courses-band-lattice)"
        />
      </svg>

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold leading-[1.5]">
            {t("cta.title")}
          </h3>

          <p className="mt-2 text-base leading-[2] text-primary-light/80">
            {t("cta.description")}
          </p>
        </div>

        <Link
          href={COURSES_ALL_HREF}
          className="group inline-flex w-fit shrink-0 items-center gap-3 rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-primary-dark transition-[background-color,transform] duration-200 hover:bg-accent-light active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {t("cta.button")}

          <LuArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
          />
        </Link>
      </div>
    </div>
  );
}