"use client";

/**
 * CTAVisual — the section's focal visual: the Hero's learning path arriving at
 * "your next step".
 *
 * Composition (no screenshots, no fake numbers)
 *  1. A faint grid texture behind the card (same idea as the Hero, in white).
 *  2. A card with a four-node path: Learn → Practice → Build → Your next step.
 *     When it scrolls into view the line fills across and each node lights up;
 *     the final node resolves in gold, then a short code snippet lands on the
 *     gold `enroll()` call. It plays once — nothing loops.
 *  3. The snippet is decorative: aria-hidden, language-neutral, always LTR.
 *
 * Motion
 *  - Card entrance uses Reveal. Parallax (a small vertical drift while the
 *    section scrolls past) is on a separate wrapper so it never conflicts with
 *    the entrance transform.
 *  - Reduced motion: no parallax, no slide; the path is shown completed.
 *
 * RTL
 *  - The four-column grid, line and fill mirror automatically (the fill's
 *    transform-origin flips with `rtl:origin-right`), so the path reads
 *    right-to-left in Dari/Pashto. Only the code block is forced LTR.
 *
 * Sizing
 *  - Compact below `md`; scales up between `md` and `lg` when the section is a
 *    single column (`md:max-lg:` variants), and goes compact again in the
 *    narrower desktop column.
 */

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Reveal, cn } from "@/components/ui";

import { CTA_CODE, CTA_STEPS, CTA_TIMING, type CodeTone } from "./data";

/** Token colors on the dark code inset (palette colors only). */
const TONE_CLASS: Record<CodeTone, string> = {
  name: "text-white",
  keyword: "text-primary-light",
  punct: "text-white/50",
  action: "text-accent",
};

export function CTAVisual() {
  const t = useTranslations("landing.FinalCTA");
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const cardY = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const gridY = useTransform(scrollYProgress, [0, 1], [-12, 12]);

  const lastIndex = CTA_STEPS.length - 1;
  const fillDuration = lastIndex * CTA_TIMING.pathStep;
  const codeDelay = CTA_TIMING.pathStart + fillDuration + 0.2;
  const viewport = { once: true, amount: 0.4 } as const;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-none">
      {/* 1. Grid texture */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10"
        style={{
          y: reduceMotion ? undefined : gridY,
          backgroundImage:
            "linear-gradient(to right, rgb(255 255 255 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* 2. Card (outer = parallax, inner Reveal = entrance) */}
      <motion.div style={{ y: reduceMotion ? undefined : cardY }}>
        <Reveal delay={0.1}>
          <div className="relative rounded-md border border-white/15 bg-white/[0.06] p-6 shadow-[0_30px_60px_-36px_rgb(5_59_46/0.8)] sm:p-8 md:max-lg:p-10">
            {/* Small gold mark on the top edge, the same accent as the Hero card and navbar logo. */}
            <span aria-hidden className="absolute -top-px start-8 h-0.5 w-14 bg-accent" />

            {/* Path: four equal columns, so node centers sit at 12.5% / 37.5% / 62.5% / 87.5%. */}
            <ol className="relative grid grid-cols-4">
              <span aria-hidden className="absolute inset-x-[12.5%] top-5 h-px bg-white/15 md:max-lg:top-6">
                <motion.span
                  className="absolute inset-0 origin-left bg-primary-light/60 rtl:origin-right"
                  initial={{ scaleX: reduceMotion ? 1 : 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={viewport}
                  // Linear, so the fill reaches each node exactly when that node lights up.
                  transition={{ duration: fillDuration, delay: CTA_TIMING.pathStart, ease: "linear" }}
                />
              </span>

              {CTA_STEPS.map((step, index) => {
                const Icon = step.icon;
                const activateAt = CTA_TIMING.pathStart + index * CTA_TIMING.pathStep;
                return (
                  <li key={step.id} className="flex flex-col items-center gap-3 text-center">
                    {/* Node: opaque base (hides the line behind it) + an overlay that fades in when reached. */}
                    <span className="relative grid size-10 place-items-center rounded-md border border-white/20 bg-primary md:max-lg:size-12">
                      <Icon
                        aria-hidden
                        className={cn("size-4 text-primary-light md:max-lg:size-5", step.directional && "rtl:-scale-x-100")}
                      />
                      <motion.span
                        aria-hidden
                        className={cn(
                          "absolute inset-0 grid place-items-center rounded-md border",
                          step.final ? "border-accent bg-accent" : "border-white/40 bg-white/10",
                        )}
                        initial={{ opacity: reduceMotion ? 1 : 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={viewport}
                        transition={{ duration: 0.35, delay: activateAt }}
                      >
                        {/* Only the gold node needs its own dark icon; the others keep the base icon. */}
                        {step.final && (
                          <Icon
                            className={cn("size-4 text-primary-dark md:max-lg:size-5", step.directional && "rtl:-scale-x-100")}
                          />
                        )}
                      </motion.span>
                    </span>

                    <span
                      className={cn(
                        "text-xs font-medium md:max-lg:text-sm rtl:leading-snug",
                        step.final ? "text-accent" : "text-primary-light",
                      )}
                    >
                      {t(step.labelKey)}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* 3. Code motif */}
            <div
              dir="ltr"
              aria-hidden
              className="mt-7 rounded-sm bg-primary-dark/70 p-4 font-mono text-[0.8125rem] leading-6 md:max-lg:p-5 md:max-lg:text-sm md:max-lg:leading-7"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-xs text-white/60 md:max-lg:text-sm">
                <span className="size-1.5 bg-accent" />
                {CTA_CODE.filename}
              </div>
              {CTA_CODE.lines.map((line, lineIndex) => (
                <motion.div
                  key={lineIndex}
                  className="flex gap-4"
                  // The last line waits for the path to finish, then lands on the gold action.
                  initial={{ opacity: line.delayed && !reduceMotion ? 0 : 1 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewport}
                  transition={{ duration: 0.5, delay: line.delayed ? codeDelay : 0 }}
                >
                  <span className="w-3 select-none text-end text-white/30">{lineIndex + 1}</span>
                  <span className="whitespace-pre" style={{ paddingInlineStart: `${line.indent * 2}ch` }}>
                    {line.tokens.map((token, tokenIndex) => (
                      <span key={tokenIndex} className={TONE_CLASS[token.tone]}>
                        {token.text}
                      </span>
                    ))}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </motion.div>
    </div>
  );
}
