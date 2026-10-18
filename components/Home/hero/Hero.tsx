"use client";

/**
 * Hero — the landing page's opening section.
 *
 * Role
 *  - Left column (inline-start): eyebrow → headline → description → CTAs.
 *    Right column (inline-end): HeroVisual. The grid follows the text direction,
 *    so in Dari/Pashto the text sits on the right and the visual on the left.
 *  - A tinted full-bleed panel behind the visual (desktop only) splits the
 *    section into two zones without adding cards or gradients. It is anchored
 *    with `end-0`, so it moves to the correct side in RTL.
 *
 * Implementation choices
 *  - The section uses bg-background, the same surface as the unscrolled navbar,
 *    and pt-28+ to clear the fixed 80px header.
 *  - The headline is revealed word by word from a clipped line box. Words (not
 *    letters) are the unit on purpose: splitting letters would break Arabic-script
 *    joining in Dari/Pashto.
 *  - RTL headlines: script glyphs run larger, so RTL steps the size down one
 *    notch and uses a taller line-height; `min-w-0` + `text-balance` keep long
 *    headlines from overflowing the grid column.
 *  - Reduced motion: words fade instead of sliding; other elements fade only.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Container, Eyebrow } from "@/components/ui";
import { EASE_OUT } from "@/components/ui/utils";

import { HERO_TIMING } from "./data";
import { HeroActions } from "./HeroActions";
import { HeroVisual } from "./HeroVisual";

const HEADING_ID = "hero-heading";

/**
 * The <h1>. Each word sits in an overflow-hidden wrapper and slides up into view.
 * Regular spaces are kept between wrappers, so the text still wraps naturally and
 * screen readers read it as a normal sentence.
 */
function HeroHeading({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  return (
    <h1
      id={HEADING_ID}
      className={[
        "max-w-3xl text-balance font-semibold text-foreground",
        "text-4xl leading-[1.08] ltr:tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl",
        "rtl:leading-[1.45] rtl:lg:text-5xl rtl:xl:text-6xl",
      ].join(" ")}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          {/* Vertical padding + negative margin give diacritics/descenders room inside the clip. */}
          <span className="-my-[0.15em] inline-block overflow-hidden py-[0.15em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: reduceMotion ? 0 : "110%", opacity: reduceMotion ? 0 : 1 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0.4 : 0.8,
                delay: HERO_TIMING.headline + index * HERO_TIMING.headlineStep,
                ease: EASE_OUT,
              }}
            >
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </h1>
  );
}

export function Hero() {
  const t = useTranslations("Hero");
  const reduceMotion = useReducedMotion();

  /** Shared fade-up used by the eyebrow and description. */
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.3 : 0.7, delay, ease: EASE_OUT },
  });

  return (
    <section
      aria-labelledby={HEADING_ID}
      className="relative isolate overflow-hidden bg-background pb-20 pt-20 sm:pt-20 lg:pb-32 lg:pt-25"
    >
      {/* Tinted panel behind the visual (desktop). Purely decorative. */}
      <div
        aria-hidden
        className="absolute inset-y-0 end-0 -z-10 hidden w-[36%] border-s border-border bg-primary-light/60 lg:block"
      />

      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-10 xl:gap-16">
          <div className="flex min-w-0 flex-col items-start gap-7 lg:col-span-7">
            <motion.div {...fadeUp(HERO_TIMING.eyebrow)}>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
            </motion.div>

            <HeroHeading text={t("headline")} />

            <motion.p
              {...fadeUp(HERO_TIMING.description)}
              className="max-w-xl text-pretty text-lg leading-relaxed text-text-secondary sm:text-xl rtl:leading-loose"
            >
              {t("description")}
            </motion.p>

            <div className="w-full pt-2 sm:w-auto">
              <HeroActions />
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
