"use client";

/**
 * FeaturedCourseCard
 * ---------------------------------------------------------------------------
 * Responsibility: every course presentation used in the section, in three
 * deliberately different weights so the grid has real visual hierarchy:
 *
 *   FeaturedCourseCard (default export)  the "lead": large, dark, editorial
 *   CourseCard variant="compact"         horizontal, quick-scan side card
 *   CourseCard variant="standard"        cover-on-top grid card
 *
 * plus `CourseCardSkeleton` for loading states.
 *
 * Interaction decisions
 * - Each card is ONE link: the title's anchor is stretched over the card
 *   (`after:absolute after:inset-0`). Big click target, one tab stop, and the
 *   accessible name is simply the course title.
 * - Hover is calm: cover zooms ~4%, border/shadow warm up, the arrow nudges.
 *   Everything is CSS (compositor-friendly) and disabled by `motion-reduce`.
 * - Framer is used only for the card's entrance (`variants` come from the
 *   parent's stagger), so filtering re-plays a quiet reveal.
 * - Yellow is used once here: the small dot on the "Featured" chip.
 * - RTL: logical spacing everywhere, arrows are mirrored with
 *   `rtl:-scale-x-100` and nudge the opposite way, abstract covers are
 *   mirrored too.
 */

import { useId } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuBookOpen,
  LuClock,
  LuGauge,
  LuImage,
} from "react-icons/lu";
import { useLocale, useTranslations } from "next-intl";

import {
  getCourseHref,
  hasText,
  isPending,
  localize,
  type Course,
  type CourseCategory,
  type CoverVariant,
} from "./data";

/* --------------------------------- Shared --------------------------------- */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Background tone of a cover; cycled by the parent so neighbours differ. */
export type CoverTone = "light" | "brand" | "dark";

/** Tone cycle used by the parent for non-featured cards. */
export const COVER_TONES: readonly CoverTone[] = [
  "light",
  "dark",
  "brand",
] as const;

/** Tailwind classes per tone: background + pattern colour (via currentColor). */
const TONE_CLASSES: Readonly<Record<CoverTone, string>> = {
  light: "bg-primary-light text-primary",
  brand: "bg-primary text-primary-light",
  dark: "bg-primary-dark text-accent-light",
};

/**
 * Converts Western digits to Persian digits for Dari and Pashto.
 *
 * This is intentionally deterministic on both server and client.
 * It prevents hydration mismatches such as:
 *
 * Server: ۱۶ درسونه
 * Client: 16 درسونه
 */
const toLocalizedDigits = (value: number, locale: string): string => {
  if (locale !== "ps" && locale !== "fa") {
    return String(value);
  }

  const digits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(
    /\d/g,
    (digit) => digits[Number(digit)],
  );
};

/** Entrance variants for one card; the parent supplies the stagger. */
function useCardVariants(): Variants {
  const prefersReducedMotion = useReducedMotion();

  return {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.55,
        ease: EASE,
      },
    },
  };
}

interface CardBaseProps {
  readonly course: Course;
  /** Resolved category (for label + icon); may be undefined if data is stale. */
  readonly category: CourseCategory | undefined;
  readonly tone: CoverTone;
}

/* --------------------------------- Cover ---------------------------------- */

interface CourseCoverProps {
  readonly variant: CoverVariant;
  readonly tone: CoverTone;
  readonly imageSrc: string;
  readonly imageAlt: string;
  readonly icon: IconType | undefined;
  readonly className?: string;
}

/**
 * CourseCover
 * Shows the real cover image when supplied; otherwise draws an abstract,
 * on-brand motif so the empty state looks designed, not broken. The zoom on
 * hover is driven by the parent's `group` class.
 */
function CourseCover({
  variant,
  tone,
  imageSrc,
  imageAlt,
  icon: CategoryIcon,
  className = "",
}: CourseCoverProps): React.JSX.Element {
  const patternId = useId();
  const hasImage = !isPending(imageSrc) && imageSrc.trim().length > 0;

  return (
    <div className={`relative overflow-hidden ${TONE_CLASSES[tone]} ${className}`}>
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        {hasImage ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-cover"
          />
        ) : (
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full opacity-[0.22] rtl:-scale-x-100"
            preserveAspectRatio="xMidYMid slice"
            viewBox="0 0 400 240"
          >
            <CoverMotif variant={variant} patternId={patternId} />
          </svg>
        )}
      </div>

      {/* Category icon tile: anchors the cover and hints at the topic. */}
      {CategoryIcon && !hasImage ? (
        <span
          aria-hidden="true"
          className="absolute start-4 top-4 flex size-10 items-center justify-center rounded-xl bg-surface text-primary shadow-[0_10px_24px_-12px_rgba(5,59,46,0.6)]"
        >
          <CategoryIcon className="size-5" />
        </span>
      ) : null}

      {/* Quiet marker that a real photo is still to come (placeholder only). */}
      {!hasImage ? (
        <LuImage
          aria-hidden="true"
          className="absolute bottom-4 end-4 size-5 opacity-40"
          strokeWidth={1.5}
        />
      ) : null}
    </div>
  );
}

interface CoverMotifProps {
  readonly variant: CoverVariant;
  readonly patternId: string;
}

/** The four abstract motifs, all drawn with `currentColor`. */
function CoverMotif({
  variant,
  patternId,
}: CoverMotifProps): React.JSX.Element {
  switch (variant) {
    case "lattice":
      // Interlaced squares: an eight-point-star rhythm.
      return (
        <>
          <defs>
            <pattern
              id={patternId}
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M13 13H51V51H13Z M32 4L60 32L32 60L4 32Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>

          <rect
            width="400"
            height="240"
            fill={`url(#${patternId})`}
          />
        </>
      );

    case "grid":
      // Blueprint grid with a few filled cells (practice / structure).
      return (
        <>
          <defs>
            <pattern
              id={patternId}
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M32 0H0V32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect
            width="400"
            height="240"
            fill={`url(#${patternId})`}
          />

          <rect
            x="224"
            y="64"
            width="32"
            height="32"
            fill="currentColor"
            opacity="0.6"
          />

          <rect
            x="256"
            y="96"
            width="32"
            height="32"
            fill="currentColor"
            opacity="0.35"
          />

          <rect
            x="288"
            y="128"
            width="32"
            height="32"
            fill="currentColor"
            opacity="0.6"
          />
        </>
      );

    case "rings":
      // Concentric rings spreading from a corner (growth / reach).
      return (
        <>
          {[40, 80, 120, 160, 200, 240, 280].map((radius) => (
            <circle
              key={radius}
              cx="400"
              cy="240"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ))}
        </>
      );

    case "path":
      // Dotted rising path: the same "progress" motif used across the site.
      return (
        <>
          <path
            d="M24 214 C120 214 120 130 210 130 S320 50 380 34"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 10"
          />

          {[
            { cx: 24, cy: 214, r: 6 },
            { cx: 210, cy: 130, r: 6 },
            { cx: 380, cy: 34, r: 10 },
          ].map((dot) => (
            <circle
              key={`${dot.cx}-${dot.cy}`}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="currentColor"
            />
          ))}
        </>
      );
  }
}

/* ---------------------------------- Meta ---------------------------------- */

interface CourseMetaProps {
  readonly course: Course;
  /** "dark" is for text on the dark featured card. */
  readonly surface: "light" | "dark";
}

/**
 * CourseMeta
 * Level, duration and lesson count. Each item renders ONLY when the client
 * has supplied a real value, so placeholders never masquerade as facts.
 */
function CourseMeta({
  course,
  surface,
}: CourseMetaProps): React.JSX.Element | null {
  const t = useTranslations("landing.courses");
  const locale = useLocale();

  const items: Array<{
    key: string;
    icon: IconType;
    text: string;
  }> = [];

  if (!isPending(course.level)) {
    items.push({
      key: "level",
      icon: LuGauge,
      text: t(`level.${course.level}`),
    });
  }

  if (hasText(course.duration, locale)) {
    items.push({
      key: "duration",
      icon: LuClock,
      text: localize(course.duration, locale),
    });
  }

  if (!isPending(course.lessonCount)) {
    const lessonCount = toLocalizedDigits(
      course.lessonCount,
      locale,
    );

    items.push({
      key: "lessons",
      icon: LuBookOpen,
      text: t("meta.lessons", {
        count: lessonCount,
      }),
    });
  }

  if (items.length === 0) return null;

  return (
    <ul
      className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${
        surface === "dark"
          ? "text-primary-light/80"
          : "text-text-secondary"
      }`}
    >
      {items.map(({ key, icon: Icon, text }) => (
        <li
          key={key}
          className="flex items-center gap-1.5"
        >
          <Icon
            aria-hidden="true"
            className="size-4 shrink-0"
          />
          {text}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------- Arrow dot -------------------------------- */

/**
 * ArrowDot: the CTA affordance shared by all cards. Mirrors in RTL and nudges
 * toward the reading direction when the parent `group` is hovered.
 */
function ArrowDot({
  className = "",
}: {
  readonly className?: string;
}): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${className}`}
    >
      <LuArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" />
    </span>
  );
}

/* ----------------------------- Featured (lead) ----------------------------- */

/**
 * FeaturedCourseCard
 * The lead course: large dark card, cover on top, generous type, and a quiet
 * white CTA (yellow stays reserved for the tiny "Featured" dot).
 */
export default function FeaturedCourseCard({
  course,
  category,
}: Omit<CardBaseProps, "tone">): React.JSX.Element {
  const t = useTranslations("landing.courses");
  const locale = useLocale();
  const variants = useCardVariants();
  const title = localize(course.title, locale);

  return (
    <motion.article
      variants={variants}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-[2rem] bg-primary-dark text-start text-surface shadow-[0_40px_80px_-40px_rgba(5,59,46,0.7)] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4"
    >
      <div className="relative">
        <CourseCover
          variant={course.coverVariant}
          tone="brand"
          imageSrc={course.coverImage}
          imageAlt={title}
          icon={category?.icon}
          className="aspect-[16/9] min-h-56 w-full"
        />

        {/* Featured chip: the single deliberate yellow touch. */}
        <span className="absolute end-4 top-4 inline-flex items-center gap-2 rounded-full bg-primary-dark/85 px-3.5 py-1.5 text-xs font-bold text-surface backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-accent"
          />
          {t("featuredBadge")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-7 sm:p-9">
        {category ? (
          <p className="text-sm font-semibold text-accent-light">
            {localize(category.label, locale)}
          </p>
        ) : null}

        <h3 className="text-2xl font-bold leading-[1.5] sm:text-3xl sm:leading-[1.45]">
          {/* Stretched link: the whole card is the click target. */}
          <Link
            href={getCourseHref(course)}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </Link>
        </h3>

        <p className="max-w-xl text-base leading-[2] text-primary-light/80">
          {localize(course.summary, locale)}
        </p>

        <CourseMeta
          course={course}
          surface="dark"
        />

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-surface/15 pt-6">
          <span className="text-base font-semibold">
            {t("card.view")}
          </span>

          <ArrowDot className="bg-surface text-primary-dark group-hover:bg-accent" />
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------- Compact + standard cards ------------------------ */

interface CourseCardProps extends CardBaseProps {
  /** compact: horizontal side card. standard: cover-on-top grid card. */
  readonly variant: "compact" | "standard";
}

/**
 * CourseCard
 * Light cards for everything that is not the lead. `compact` trades the big
 * cover for a square thumbnail so two of them stack beside the lead card.
 */
export function CourseCard({
  course,
  category,
  tone,
  variant,
}: CourseCardProps): React.JSX.Element {
  const locale = useLocale();
  const variants = useCardVariants();
  const title = localize(course.title, locale);
  const isCompact = variant === "compact";

  return (
    <motion.article
      variants={variants}
      className={`group relative isolate flex overflow-hidden rounded-3xl border border-border bg-surface text-start transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_24px_50px_-28px_rgba(5,59,46,0.5)] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
        isCompact
          ? "h-full flex-row items-stretch"
          : "flex-col"
      }`}
    >
      <CourseCover
        variant={course.coverVariant}
        tone={tone}
        imageSrc={course.coverImage}
        imageAlt={title}
        icon={category?.icon}
        className={
          isCompact
            ? "w-32 shrink-0 sm:w-44"
            : "aspect-[16/10] w-full"
        }
      />

      <div
        className={`flex min-w-0 flex-1 flex-col gap-3 ${
          isCompact ? "p-5" : "p-6"
        }`}
      >
        {category ? (
          <p className="text-xs font-bold text-primary">
            {localize(category.label, locale)}
          </p>
        ) : null}

        <h3 className="text-lg font-bold leading-[1.6] text-foreground">
          <Link
            href={getCourseHref(course)}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </Link>
        </h3>

        {/* Summary shows on standard cards only; compact stays scannable. */}
        {!isCompact ? (
          <p className="line-clamp-2 text-sm leading-[1.9] text-text-secondary">
            {localize(course.summary, locale)}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <CourseMeta
            course={course}
            surface="light"
          />

          <ArrowDot className="ms-auto bg-primary-light text-primary group-hover:bg-primary group-hover:text-surface" />
        </div>
      </div>
    </motion.article>
  );
}

/* -------------------------------- Skeleton --------------------------------- */

/**
 * CourseCardSkeleton
 * Loading placeholder with the same footprint as the real cards, so the
 * layout does not jump when CMS data arrives. Pulse is disabled for users
 * who prefer reduced motion.
 */
export function CourseCardSkeleton({
  variant,
}: {
  readonly variant: "featured" | "compact" | "standard";
}): React.JSX.Element {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <div
      aria-hidden="true"
      className={`flex animate-pulse overflow-hidden rounded-3xl border border-border bg-surface motion-reduce:animate-none ${
        isCompact
          ? "h-full flex-row"
          : "h-full flex-col"
      }`}
    >
      <div
        className={`bg-surface-muted ${
          isFeatured
            ? "aspect-[16/9] min-h-56 w-full"
            : isCompact
              ? "w-32 shrink-0 sm:w-44"
              : "aspect-[16/10] w-full"
        }`}
      />

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="h-3 w-1/4 rounded-full bg-surface-muted" />
        <div className="h-5 w-3/4 rounded-full bg-surface-muted" />

        {!isCompact ? (
          <div className="h-3 w-full rounded-full bg-surface-muted" />
        ) : null}

        {isFeatured ? (
          <div className="h-3 w-2/3 rounded-full bg-surface-muted" />
        ) : null}
      </div>
    </div>
  );
}
