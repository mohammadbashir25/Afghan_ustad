"use client";

/**
 * StoryArt
 * ---------------------------------------------------------------------------
 * Decorative illustration used by the hero and the empty state. It carries no
 * information (aria-hidden) and contains no people, quotes or numbers.
 *
 * Concept: a doorway of two overlapping arches with a rising sun and four
 * ascending steps — "a new start, built step by step".
 *   back arch  → lattice pattern (same motif as the homepage)
 *   front arch → deep green with ring texture, amber sun, stepped bars
 *   chips      → a quote icon and a three-dot path, floating gently
 * Layout uses logical insets, so the whole composition mirrors in RTL.
 * `onWhite` fixes the cut-out gap colour when placed on a white section.
 */
import { LuQuote } from "react-icons/lu";
import s from "./success-stories.module.css";

export function StoryArt({ onWhite = false }: { readonly onWhite?: boolean }) {
  return (
    <div className={`${s.art} ${onWhite ? s.artOnWhite : ""}`} aria-hidden="true">
      <div className={s.artBack}>
        <span className={s.pattern} />
      </div>

      <div className={s.artFront}>
        <span className={s.artSun} />
        <span className={s.artSteps}>
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>

      <span className={s.artQuote}>
        <LuQuote />
      </span>
      <span className={s.artTag}>
        <span className={s.artDots}>
          <i />
          <i />
          <i className={s.artDotLast} />
        </span>
      </span>
    </div>
  );
}