/**
 * shared.ts
 * ---------------------------------------------------------------------------
 * Tiny helpers shared by every About-page section: layout metrics, easing and
 * one motion hook. Nothing here renders UI.
 *
 * Why inline layout metrics: container width, side padding and vertical
 * rhythm are applied as inline styles so they can never be lost to a Tailwind
 * scan miss or stale cache. All decoration still uses theme tokens.
 *
 * `useReveal` gives every section the same choreography:
 * - `container` staggers its children
 * - `item` is a quiet fade-up
 * - `fromStart` / `fromEnd` slide in from the reading-start / reading-end
 *   side, so RTL pages mirror their motion automatically
 * - with prefers-reduced-motion, travel distance is zero and durations
 *   collapse to near-instant
 */
import type { CSSProperties } from "react";
import { useReducedMotion, type Variants } from "framer-motion";
import { useLocale } from "next-intl";

/** Shared easing: decisive start, soft landing. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Locales that read right-to-left. */
export const isRtlLocale = (locale: string): boolean => locale === "fa" || locale === "ps";

/** Centered container matching the rest of the site (~80rem). */
export const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "80rem",
  marginInline: "auto",
  paddingInline: "clamp(1.5rem, 4vw, 2rem)",
};

/** Vertical rhythm for a full section. */
export const sectionPadding: CSSProperties = {
  paddingBlock: "clamp(4.5rem, 9vw, 8rem)",
};

export interface RevealSet {
  readonly container: Variants;
  readonly item: Variants;
  readonly fromStart: Variants;
  readonly fromEnd: Variants;
  readonly reduced: boolean;
  readonly isRtl: boolean;
}

/** Locale- and motion-preference-aware reveal variants. */
export function useReveal(): RevealSet {
  const reduced = Boolean(useReducedMotion());
  const isRtl = isRtlLocale(useLocale());

  // Content travels 32px toward its resting place; flipped for RTL.
  const startX = reduced ? 0 : isRtl ? 32 : -32;
  const duration = reduced ? 0.01 : 0.7;

  return {
    reduced,
    isRtl,
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: reduced ? 0 : 0.1, delayChildren: 0.05 } },
    },
    item: {
      hidden: { opacity: 0, y: reduced ? 0 : 20 },
      visible: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
    },
    fromStart: {
      hidden: { opacity: 0, x: startX },
      visible: { opacity: 1, x: 0, transition: { duration, ease: EASE } },
    },
    fromEnd: {
      hidden: { opacity: 0, x: -startX },
      visible: { opacity: 1, x: 0, transition: { duration, ease: EASE, delay: reduced ? 0 : 0.15 } },
    },
  };
}
