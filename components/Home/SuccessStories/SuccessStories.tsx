"use client";

/**
 * SuccessStories (landing-page section)
 * ---------------------------------------------------------------------------
 * Role: the section shell. It decides WHAT to show; the carousel and card
 * decide HOW.
 *
 *   publishable stories exist  -> SuccessStoryCarousel
 *   none (today's reality)     -> a designed empty state, never fake stories
 *   `previewPlaceholders`      -> the carousel with the marker-filled stories,
 *                                 for design review only
 *
 * Trust: only stories that are approved and have a real name + story reach
 * the public carousel (`getPublishableStories`). Nothing is invented here.
 *
 * The empty state deliberately mirrors the story card's composition (same
 * frame, same plate, same quote glyph), so real stories later drop into a
 * layout visitors have already seen, and the page never looks unfinished.
 *
 * Layout + RTL
 * - Critical container metrics are inline styles (can't be lost to a Tailwind
 *   scan miss); everything else uses theme tokens and logical utilities.
 * - No locale branching in this file; direction is handled by the browser.
 *
 * Note: written with light local primitives instead of the shared Container /
 * Button / SectionHeading because their props aren't visible to the
 * generator; swapping them in is mechanical.
 */
import { useMemo, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { MotionConfig, motion, useReducedMotion, type Variants } from "framer-motion";
import { LuArrowRight, LuQuote, LuTarget, LuUser } from "react-icons/lu";
import type { IconType } from "react-icons";
import { useLocale, useTranslations } from "next-intl";

import SuccessStoryCarousel from "./SuccessStoryCarousel";
import { PhotoPlaceholder, StoryImageFrame } from "./SuccessStoryCard";
import {
  EXPLORE_COURSES_HREF,
  SUCCESS_STORIES,
  getPublishableStories,
  isRtlLocale,
  type SuccessStory,
} from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

interface SuccessStoriesProps {
  /** Stories from your CMS. Defaults to the placeholder list in data.ts. */
  readonly stories?: readonly SuccessStory[];
  /** Design review only: show the carousel using placeholder stories. */
  readonly previewPlaceholders?: boolean;
  /** Override the auto-slide default from data.ts. */
  readonly autoPlay?: boolean;
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

export default function SuccessStories({
  stories = SUCCESS_STORIES,
  previewPlaceholders = false,
  autoPlay,
}: SuccessStoriesProps): React.JSX.Element {
  const t = useTranslations("landing.successStories");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

  /** Only approved, real stories are ever shown publicly. */
  const publishable = useMemo(() => getPublishableStories(stories, locale), [stories, locale]);
  const hasStories = publishable.length > 0;
  const carouselStories = hasStories ? publishable : previewPlaceholders ? stories : [];

  /** Header + panel reveal: one quiet fade-up each. */
  const reveal: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.7, ease: EASE },
    },
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="success-stories"
        aria-labelledby="success-stories-heading"
        style={sectionStyle}
        className="bg-surface"
      >
        {/* Decorative: soft gold glow at the start edge, green at the end. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40rem_26rem_at_0%_0%,rgba(255,244,194,0.6),transparent_65%),radial-gradient(44rem_30rem_at_100%_100%,rgba(230,244,238,0.9),transparent_65%)]"
        />

        <div style={containerStyle}>
          {/* -------------------------------- Heading ------------------------------- */}
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-2xl text-start"
          >
            <p className="flex items-center gap-3 text-sm font-semibold text-primary">
              <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
              {t("eyebrow")}
            </p>
            <h2
              id="success-stories-heading"
              className="mt-5 text-balance text-3xl font-bold leading-[1.5] text-primary-dark sm:text-4xl xl:text-5xl xl:leading-[1.45]"
            >
              {t("heading")}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-[2] text-text-secondary sm:text-lg">
              {t("description")}
            </p>
          </motion.div>

          {/* --------------------------------- Stage -------------------------------- */}
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-12 rounded-[2rem] border border-border bg-surface p-6 shadow-[0_40px_80px_-50px_rgba(5,59,46,0.45)] sm:p-10 lg:p-14"
          >
            {carouselStories.length > 0 ? (
              <SuccessStoryCarousel stories={carouselStories} autoPlay={autoPlay} />
            ) : (
              <StoriesEmptyState />
            )}
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}

/* ------------------------------- Empty state ------------------------------- */

interface SlotConfig {
  readonly id: "photo" | "story" | "outcome";
  readonly icon: IconType;
  readonly labelKey: "empty.slots.photo" | "empty.slots.story" | "empty.slots.outcome";
}

/** The three things a future story will contain, shown as quiet outlines. */
const EMPTY_SLOTS: readonly SlotConfig[] = [
  { id: "photo", icon: LuUser, labelKey: "empty.slots.photo" },
  { id: "story", icon: LuQuote, labelKey: "empty.slots.story" },
  { id: "outcome", icon: LuTarget, labelKey: "empty.slots.outcome" },
] as const;

/**
 * StoriesEmptyState
 * Shown while no approved story exists. It repeats the real card's
 * composition (frame, plate, quote glyph) with dashed outlines, explains
 * honestly why it is empty, and gives visitors a useful next step.
 * Decorative carousel controls hint at what is coming (hidden from AT).
 */
function StoriesEmptyState(): React.JSX.Element {
  const t = useTranslations("landing.successStories");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  // The shimmer travels toward the reading-end side in both directions.
  const shimmerPath = isRtlLocale(locale) ? ["120%", "-420%"] : ["-120%", "420%"];

  return (
    <div className="grid items-center gap-10 text-start md:grid-cols-12 md:gap-14">
      {/* Image side: the same frame the real story will use. */}
      <div className="md:col-span-5">
        <StoryImageFrame dashed>
          <PhotoPlaceholder label={t("card.imagePlaceholder")} />
        </StoryImageFrame>
      </div>

      {/* Story side */}
      <div className="min-w-0 md:col-span-7">
        <LuQuote
          aria-hidden="true"
          className="size-12 text-accent rtl:-scale-x-100"
          strokeWidth={1.5}
        />
        <h3 className="mt-5 text-2xl font-bold leading-[1.6] text-primary-dark sm:text-3xl">
          {t("empty.title")}
        </h3>
        <p className="mt-3 max-w-xl text-base leading-[2] text-text-secondary">
          {t("empty.description")}
        </p>

        {/* Slots: what a story will contain. A slow shimmer sweeps across
            (static for reduced motion). */}
        <ul className="mt-7 space-y-3">
          {EMPTY_SLOTS.map(({ id, icon: Icon, labelKey }, slotIndex) => (
            <li
              key={id}
              className="relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-border-strong/70 bg-surface-muted/60 px-4 py-3.5"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary"
              >
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-semibold text-foreground">{t(labelKey)}</span>
              {!prefersReducedMotion ? (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 start-0 w-1/3 bg-gradient-to-r from-transparent via-surface/70 to-transparent"
                  initial={{ x: shimmerPath[0] }}
                  animate={{ x: shimmerPath[1] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    repeatDelay: 2.2 + slotIndex * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
            </li>
          ))}
        </ul>

        {/* Next step + decorative preview of the carousel controls. */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <Link
            href={EXPLORE_COURSES_HREF}
            className="group inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-surface shadow-[0_14px_30px_-14px_rgba(11,107,79,0.8)] transition-[background-color,transform] duration-200 hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {t("empty.cta")}
            <LuArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
            />
          </Link>

          <div aria-hidden="true" className="flex items-center gap-4 opacity-50">
            <span className="flex items-center gap-2">
              <span className="h-2 w-7 rounded-full bg-primary" />
              <span className="size-2 rounded-full bg-border-strong" />
              <span className="size-2 rounded-full bg-border-strong" />
            </span>
            <span className="flex gap-2">
              <span className="flex size-10 items-center justify-center rounded-full border border-border text-primary">
                <LuArrowRight className="size-4 rotate-180 rtl:rotate-0" />
              </span>
              <span className="flex size-10 items-center justify-center rounded-full border border-primary bg-primary text-surface">
                <LuArrowRight className="size-4 rtl:rotate-180" />
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
