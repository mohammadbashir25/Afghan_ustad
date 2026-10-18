"use client";

/**
 * SuccessStoryCarousel
 * ---------------------------------------------------------------------------
 * Role: an accessible, touch-friendly carousel around SuccessStoryCard.
 * It owns navigation state only; it knows nothing about story content.
 *
 * State
 * - `index` / `direction`  current slide and travel direction (1 = forward)
 * - `isHovered`, `isFocusWithin`  transient pause signals
 * - `isDocumentHidden`     pause while the tab is in the background
 * - `userPlaying`          the visitor's own play/pause choice
 *
 * Accessibility
 * - Region + slide semantics (`aria-roledescription`), labelled "Story n of m".
 * - Focusable slide area with arrow keys, Home and End. "Forward" is
 *   ArrowRight in LTR and ArrowLeft in RTL, matching reading direction.
 * - Previous/Next are real buttons; pagination dots are labelled buttons with
 *   `aria-current`.
 * - Live region is "off" while auto-sliding (so it never chatters) and
 *   "polite" otherwise.
 * - Auto-slide is OFF by default. When enabled it pauses on hover, on focus
 *   within, in background tabs, and via a visible play/pause button. It never
 *   runs for visitors who prefer reduced motion.
 *
 * Motion
 * - A short, flat horizontal slide + fade (no 3D, no scaling). Direction is
 *   RTL-aware: "next" always enters from the reading-end side.
 * - Swipe: horizontal drag with `touch-action: pan-y`, so vertical page
 *   scrolling still works. Swipe direction is flipped for RTL.
 * - Reduced motion collapses travel to zero and durations to near-instant.
 */
import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft, LuArrowRight, LuPause, LuPlay } from "react-icons/lu";

import SuccessStoryCard from "./SuccessStoryCard";
import { CAROUSEL_CONFIG, isRtlLocale, type SuccessStory } from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

interface SuccessStoryCarouselProps {
  /** Stories to present (the parent already filtered to publishable ones). */
  readonly stories: readonly SuccessStory[];
  /** Enable automatic sliding. Defaults to CAROUSEL_CONFIG.autoPlay (off). */
  readonly autoPlay?: boolean;
  /** Time per story when auto-sliding. */
  readonly autoPlayIntervalMs?: number;
}

export default function SuccessStoryCarousel({
  stories,
  autoPlay = CAROUSEL_CONFIG.autoPlay,
  autoPlayIntervalMs = CAROUSEL_CONFIG.autoPlayIntervalMs,
}: SuccessStoryCarouselProps): React.JSX.Element | null {
  const t = useTranslations("landing.successStories");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const isRtl = isRtlLocale(locale);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [userPlaying, setUserPlaying] = useState(true);

  const count = stories.length;
  // Guard against the story list shrinking while mounted.
  const current = Math.min(index, Math.max(count - 1, 0));

  /* ------------------------------- Navigation ------------------------------ */

  /** Move to a slide with an explicit travel direction. */
  const move = useCallback(
    (target: number, travel: 1 | -1): void => {
      if (count < 2) return;
      setDirection(travel);
      setIndex(((target % count) + count) % count);
    },
    [count],
  );

  const goNext = useCallback((): void => move(current + 1, 1), [move, current]);
  const goPrev = useCallback((): void => move(current - 1, -1), [move, current]);

  /* ------------------------------- Auto-slide ------------------------------ */

  // Never auto-slide for reduced-motion visitors or a single story.
  const canAutoPlay = autoPlay && !prefersReducedMotion && count > 1;
  const isPaused = isHovered || isFocusWithin || isDocumentHidden;
  const isAutoSliding = canAutoPlay && userPlaying && !isPaused;

  // Pause while the browser tab is in the background.
  useEffect(() => {
    const onVisibility = (): void => setIsDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // One timer per slide; any change to the inputs below restarts it.
  useEffect(() => {
    if (!isAutoSliding) return;
    const timer = window.setTimeout(goNext, autoPlayIntervalMs);
    return () => window.clearTimeout(timer);
  }, [isAutoSliding, goNext, autoPlayIntervalMs]);

  /* -------------------------------- Handlers ------------------------------- */

  /** Arrow keys follow reading direction; Home/End jump to the ends. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const backKey = isRtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === forwardKey) {
      event.preventDefault();
      goNext();
    } else if (event.key === backKey) {
      event.preventDefault();
      goPrev();
    } else if (event.key === "Home") {
      event.preventDefault();
      move(0, -1);
    } else if (event.key === "End") {
      event.preventDefault();
      move(count - 1, 1);
    }
  };

  /** Swipe: in RTL the gesture meaning is mirrored. */
  const handleDragEnd = (_: unknown, info: PanInfo): void => {
    const threshold = CAROUSEL_CONFIG.swipeThresholdPx;
    const draggedStartward = isRtl ? info.offset.x > threshold : info.offset.x < -threshold;
    const draggedEndward = isRtl ? info.offset.x < -threshold : info.offset.x > threshold;
    if (draggedStartward) goNext();
    else if (draggedEndward) goPrev();
  };

  /** Focus-within without flicker when focus moves between inner controls. */
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusWithin(false);
  };

  if (count === 0) return null;

  /* -------------------------------- Variants ------------------------------- */

  // Forward travel enters from the reading-END side: +x in LTR, -x in RTL.
  const sign = isRtl ? -1 : 1;
  const offset = prefersReducedMotion ? 0 : CAROUSEL_CONFIG.slideOffsetPx;
  const duration = prefersReducedMotion ? 0.01 : 0.5;

  const slideVariants: Variants = {
    enter: (travel: number) => ({ opacity: 0, x: travel * sign * offset }),
    center: { opacity: 1, x: 0, transition: { duration, ease: EASE } },
    exit: (travel: number) => ({
      opacity: 0,
      x: -travel * sign * offset,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.3, ease: EASE },
    }),
  };

  const hasMultiple = count > 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t("carousel.label")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={handleBlur}
    >
      {/* Slide stage: focusable so arrow keys work; swipeable on touch. */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-live={isAutoSliding ? "off" : "polite"}
        className="overflow-hidden rounded-3xl outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-primary"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={stories[current].id}
            role="group"
            aria-roledescription={t("carousel.slide")}
            aria-label={t("carousel.slideLabel", { current: current + 1, total: count })}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={hasMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            // pan-y keeps vertical scrolling alive while we handle horizontal drags.
            style={{ touchAction: "pan-y" }}
          >
            <SuccessStoryCard story={stories[current]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls: pagination at the start, buttons at the end. Order mirrors
          automatically in RTL; the arrow icons are mirrored explicitly. */}
      {hasMultiple ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-6">
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-2">
              {stories.map((story, dotIndex) => {
                const isActive = dotIndex === current;
                return (
                  <li key={story.id}>
                    <button
                      type="button"
                      aria-label={t("carousel.goTo", { number: dotIndex + 1 })}
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => move(dotIndex, dotIndex > current ? 1 : -1)}
                      className="flex h-6 items-center px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <motion.span
                        aria-hidden="true"
                        animate={{ width: isActive ? 28 : 8 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: EASE }}
                        className={`block h-2 rounded-full transition-colors duration-300 ${
                          isActive ? "bg-primary" : "bg-border-strong hover:bg-primary/50"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-text-secondary">
              {t("carousel.counter", { current: current + 1, total: count })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Visible pause/play, only when auto-slide is enabled. */}
            {canAutoPlay ? (
              <button
                type="button"
                onClick={() => setUserPlaying((playing) => !playing)}
                aria-label={userPlaying ? t("carousel.pause") : t("carousel.play")}
                className="flex size-12 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {userPlaying ? (
                  <LuPause aria-hidden="true" className="size-5" />
                ) : (
                  <LuPlay aria-hidden="true" className="size-5 rtl:-scale-x-100" />
                )}
              </button>
            ) : null}

            <button
              type="button"
              onClick={goPrev}
              aria-label={t("carousel.previous")}
              className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-primary transition-[background-color,color,transform,border-color] duration-200 hover:border-primary hover:bg-primary hover:text-surface active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LuArrowLeft aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={t("carousel.next")}
              className="flex size-12 items-center justify-center rounded-full border border-primary bg-primary text-surface transition-[background-color,transform] duration-200 hover:bg-primary-dark active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LuArrowRight aria-hidden="true" className="size-5 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
