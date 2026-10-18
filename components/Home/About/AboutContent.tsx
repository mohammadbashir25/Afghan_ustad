"use client";

/**
 * AboutContent
 * ---------------------------------------------------------------------------
 * The NARRATIVE half: eyebrow, heading, story, pull line, principles, CTA.
 * It owns text + text motion only; the visual half lives in AboutVisual.tsx.
 *
 * RTL: only logical utilities are used (ps/pe/ms/me/border-s/text-start), so
 * the same markup mirrors automatically. Motion offsets flip with the locale
 * so elements always enter from the reading-start side.
 *
 * Arabic-script note: headings use generous line-height (1.5) because Dari
 * and Pashto carry tall ascenders/descenders and dots that clip at 1.2.
 */
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LuArrowRight } from "react-icons/lu";
import { useLocale, useTranslations } from "next-intl";

import { ABOUT_CTA_HREF, ABOUT_PRINCIPLES, isRtlLocale } from "./data";

/** Shared easing: decisive start, soft landing. */
const EASE = [0.22, 1, 0.36, 1] as const;

export default function AboutContent(): React.JSX.Element {
  const t = useTranslations("landing.about");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

  // Content enters from the reading-start side (left in LTR, right in RTL).
  const startOffset = prefersReducedMotion ? 0 : isRtlLocale(locale) ? 28 : -28;

  /** Parent: choreographs the order of everything inside. */
  const column: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: 0.05,
      },
    },
  };

  /** Text blocks: a short slide from the start side plus a fade. */
  const reveal: Variants = {
    hidden: { opacity: 0, x: startOffset },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.7, ease: EASE },
    },
  };

  /** Principles grid: each card lands after the previous one. */
  const grid: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.12 },
    },
  };

  const card: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.6, ease: EASE },
    },
  };

  return (
    <motion.div
      variants={column}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className="min-w-0 text-start"
    >
      {/* Eyebrow: rule + label. The rule leads into the text and mirrors. */}
      <motion.p
        variants={reveal}
        className="flex items-center gap-3 text-sm font-semibold text-primary"
      >
        <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
        {t("eyebrow")}
      </motion.p>

      {/* Heading: the section's one big typographic moment. */}
      <motion.h2
        id="about-heading"
        variants={reveal}
        className="mt-5 max-w-xl text-balance text-3xl font-bold leading-[1.5] text-primary-dark sm:text-4xl xl:text-5xl xl:leading-[1.45]"
      >
        {t("heading")}
      </motion.h2>

      {/* Story: two short paragraphs, capped line length for readability. */}
      <motion.div
        variants={reveal}
        className="mt-6 max-w-xl space-y-4 text-base leading-[2] text-text-secondary sm:text-lg"
      >
        <p>{t("story.p1")}</p>
        <p>{t("story.p2")}</p>
      </motion.div>

      {/* Pull line: the philosophy in one sentence, on a tinted strip with a
          start-side gold rule (logical, so it flips in RTL). */}
      <motion.blockquote
        variants={reveal}
        className="mt-8 max-w-xl rounded-2xl border border-border border-s-4 border-s-accent bg-primary-light px-6 py-5 text-lg font-semibold leading-relaxed text-primary-dark"
      >
        {t("quote")}
      </motion.blockquote>

      {/* Principles: 2 x 2 grid of small cards. Not numbered: the beliefs
          are not a sequence. */}
      <motion.section variants={reveal} aria-labelledby="about-principles" className="mt-10">
        <h3 id="about-principles" className="text-base font-bold text-foreground">
          {t("principlesLabel")}
        </h3>

        <motion.ul variants={grid} className="mt-4 grid gap-4 sm:grid-cols-2">
          {ABOUT_PRINCIPLES.map(({ id, icon: Icon }) => (
            <motion.li
              key={id}
              variants={card}
              // Hover: the card lifts; the icon tile inverts to solid green.
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="group rounded-2xl border border-border bg-surface p-5 transition-shadow duration-300 hover:shadow-[0_18px_40px_-22px_rgba(5,59,46,0.45)]"
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-surface"
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <h4 className="mt-4 text-base font-bold leading-snug text-foreground">
                {t(`principles.${id}.title`)}
              </h4>
              <p className="mt-2 text-sm leading-[1.9] text-text-secondary">
                {t(`principles.${id}.description`)}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>

      {/* CTA: leads to the About page. Arrow mirrors + nudges in RTL. */}
      <motion.div variants={reveal} className="mt-10">
        <Link
          href={ABOUT_CTA_HREF}
          className="group inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-surface shadow-[0_14px_30px_-14px_rgba(11,107,79,0.8)] transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {t("cta")}
          <span
            aria-hidden="true"
            className="flex size-6 items-center justify-center rounded-full bg-accent text-primary-dark"
          >
            <LuArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}