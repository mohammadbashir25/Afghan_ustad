"use client";

/**
 * HeroVisual — the hero's focal composition: "Learn → Practice → Build Skills → Progress".
 *
 * Composition (no screenshots, no fake numbers)
 *  1. A faint grid behind everything: a quiet "technology" texture, masked so it
 *     fades out toward the edges.
 *  2. The learning-path card: four stages on a vertical line. On load the line
 *     fills from top to bottom and each stage node "lights up" as it is reached;
 *     the final stage (Progress) resolves in gold. It plays once — nothing loops.
 *  3. A small dark code card overlapping the path's bottom edge. It is purely
 *     decorative (aria-hidden, language-neutral, always LTR) and echoes the
 *     "practice" stage.
 *
 * Motion
 *  - Entrance: card and code card fade/slide in; timings come from HERO_TIMING.
 *  - Parallax: only the code card and the grid drift slightly while scrolling
 *    past the hero, which separates the layers without constant movement.
 *    Entrance and parallax are on separate elements so their `y` values do not
 *    fight each other.
 *  - Reduced motion: no slide, no parallax; content appears with a fade and the
 *    path is shown already completed.
 *
 * Responsive sizing
 *  - Below `md` the visual is a compact phone-width card. From `md` up to (not
 *    including) `lg` the hero is still one column, so the visual is given the
 *    full column (max-w-2xl) and its internals scale up (padding, type, nodes,
 *    code card) instead of sitting small in a wide empty row. From `lg` the
 *    visual lives in a 5/12 column again and returns to the compact sizes.
 *    The `md:max-lg:` variants below are that tablet-only scale-up.
 *
 * RTL
 *  - Everything uses logical properties (start/end). The stage list mirrors
 *    automatically; the code card stays LTR because code is always LTR.
 *  - Stage numbers are formatted with next-intl, so fa/ps get their own digits.
 */

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useFormatter, useTranslations } from "next-intl";
import { useRef } from "react";

import { Divider, cn } from "@/components/ui";
import { EASE_OUT } from "@/components/ui/utils";

import { HERO_CODE, HERO_STAGES, HERO_TIMING, type CodeTone } from "./data";

/** Token colors for the code card (dark surface, palette colors only). */
const TONE_CLASS: Record<CodeTone, string> = {
  keyword: "text-accent",
  name: "text-white",
  punct: "text-white/50",
  call: "text-primary-light",
};

export function HeroVisual() {
  const t = useTranslations("Hero");
  const format = useFormatter();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Scroll progress across the hero: 0 at the top of the page, 1 once it has scrolled away.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const codeY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -24]);

  const lastIndex = HERO_STAGES.length - 1;
  const fillDuration = lastIndex * HERO_TIMING.pathStep;

  return (
    // pb-28 reserves the space the code card overlaps, so it never covers the last stage.
    <div ref={ref} className="relative mx-auto w-full max-w-md pb-28 sm:max-w-lg md:max-w-2xl md:max-lg:pb-36 lg:max-w-none">
      {/* 1. Grid texture */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10"
        style={{
          y: reduceMotion ? undefined : gridY,
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* 2. Learning path card */}
      <motion.div
        className="relative rounded-md border border-border bg-surface px-6 pb-16 pt-6 shadow-[0_24px_60px_-40px_rgb(5_59_46/0.35)] sm:px-8 sm:pt-8 md:max-lg:px-10 md:max-lg:pb-24 md:max-lg:pt-10"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.3 : 0.8, delay: HERO_TIMING.visual, ease: EASE_OUT }}
      >
        {/* Small gold mark on the top edge: the same accent language as the navbar logo. */}
        <span aria-hidden className="absolute -top-px start-8 h-0.5 w-14 bg-accent" />

        <p className="pb-4 text-sm font-semibold text-foreground md:max-lg:pb-5 md:max-lg:text-base">{t("visual.pathLabel")}</p>
        <Divider />

        <ol className="relative pt-2">
          {/* Vertical path: base line + a fill that grows as the stages light up. */}
          <span aria-hidden className="absolute inset-y-[2.625rem] start-[1.125rem] w-px bg-border md:max-lg:inset-y-[2.875rem] md:max-lg:start-[1.375rem]">
            <motion.span
              className="absolute inset-0 origin-top bg-primary"
              initial={{ scaleY: reduceMotion ? 1 : 0 }}
              animate={{ scaleY: 1 }}
              // Linear, so the fill reaches each node exactly when that node activates.
              transition={{ duration: fillDuration, delay: HERO_TIMING.pathStart, ease: "linear" }}
            />
          </span>

          {HERO_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <motion.li
                key={stage.id}
                className="relative flex items-start gap-4 py-4 md:max-lg:gap-5"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0.3 : 0.6,
                  delay: HERO_TIMING.visual + 0.15 + index * 0.1,
                  ease: EASE_OUT,
                }}
              >
                {/* Node: neutral by default, then an overlay fades in when the path reaches it. */}
                <span className="relative z-10 grid size-9 shrink-0 place-items-center md:max-lg:size-11 rounded-md border border-border bg-surface">
                  <motion.span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 rounded-md border",
                      stage.accent ? "border-accent-dark bg-accent-light" : "border-primary bg-primary-light",
                    )}
                    initial={{ opacity: reduceMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, delay: HERO_TIMING.pathStart + index * HERO_TIMING.pathStep }}
                  />
                  <Icon aria-hidden className={cn("relative size-4 md:max-lg:size-5", stage.accent ? "text-primary-dark" : "text-primary")} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[1.0625rem] font-semibold text-foreground md:max-lg:text-xl rtl:leading-snug">{t(stage.titleKey)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary md:max-lg:text-base rtl:leading-loose">{t(stage.textKey)}</p>
                </div>

                {/* Sequence number: this content really is ordered, so numbering carries meaning. */}
                <span className="pt-1 text-xs tabular-nums text-text-muted md:max-lg:text-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </motion.div>

      {/* 3. Code card. Outer element = scroll parallax, inner element = entrance. */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 end-0 z-10 w-[72%] sm:-end-4 sm:w-[64%] md:max-lg:w-[56%] lg:-end-8"
        style={{ y: reduceMotion ? undefined : codeY }}
      >
        <motion.div
          dir="ltr"
          className="rounded-md bg-primary-dark p-5 md:max-lg:p-6 shadow-[0_24px_50px_-28px_rgb(5_59_46/0.6)]"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.3 : 0.8, delay: HERO_TIMING.code, ease: EASE_OUT }}
        >
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-xs text-white/60 md:max-lg:text-sm">
            <span className="size-1.5 bg-accent" />
            {HERO_CODE.filename}
          </div>
          <div className="font-mono text-[0.8125rem] leading-6 md:max-lg:text-sm md:max-lg:leading-7">
            {HERO_CODE.lines.map((line, lineIndex) => (
              <div key={lineIndex} className="flex gap-4">
                <span className="w-3 select-none text-end text-white/30">{lineIndex + 1}</span>
                <span className="whitespace-pre" style={{ paddingInlineStart: `${line.indent * 2}ch` }}>
                  {line.tokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} className={TONE_CLASS[token.tone]}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}