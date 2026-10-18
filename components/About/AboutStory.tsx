"use client";

/**
 * AboutStory
 * ---------------------------------------------------------------------------
 * Responsibility: say WHY AfghanUstad exists, as an editorial read rather
 * than a card.
 *
 * Layout decisions
 * - Desktop: a sticky left column (heading + pull line) stays in view while
 *   the story scrolls on the right, so the heading "holds" the narrative.
 *   Sticky applies only from `lg` up; on mobile it is a normal stack.
 * - The first paragraph is set larger as a lead; the rest are quieter.
 * - A hairline rule runs down the start edge of the story column, giving the
 *   text a spine without boxing it in.
 * - Ends with a short "in short" note on a gold start rule.
 *
 * Motion: paragraphs reveal one at a time as they enter the viewport
 * (each has its own `whileInView`), which paces the reading.
 */
import { motion } from "framer-motion";
import { LuQuote } from "react-icons/lu";
import { useTranslations } from "next-intl";

import SectionIntro from "./SectionIntro";
import { containerStyle, sectionPadding, useReveal } from "../shared/shared";

/** Story paragraphs, in reading order. The first is the lead. */
const PARAGRAPHS = ["p1", "p2", "p3"] as const;

export default function AboutStory(): React.JSX.Element {
  const t = useTranslations("pages.about.story");
  const { container, item, fromStart } = useReveal();

  return (
    <section
      id="story"
      aria-labelledby="about-story-heading"
      style={{ ...sectionPadding, scrollMarginTop: "5rem" }}
      className="bg-surface"
    >
      <div style={containerStyle}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Sticky intro + pull line */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start"
          >
            <motion.div variants={fromStart}>
              <SectionIntro
                eyebrow={t("eyebrow")}
                title={t("title")}
                headingId="about-story-heading"
              />
            </motion.div>

            <motion.figure variants={fromStart} className="mt-10 text-start">
              <LuQuote
                aria-hidden="true"
                className="size-10 text-accent rtl:-scale-x-100"
                strokeWidth={1.5}
              />
              <blockquote className="mt-4 max-w-md text-xl font-semibold leading-[1.9] text-primary-dark sm:text-2xl">
                {t("quote")}
              </blockquote>
            </motion.figure>
          </motion.div>

          {/* Story column */}
          <div className="border-primary-light lg:col-span-7 lg:border-s lg:ps-12">
            <div className="space-y-8 text-start">
              {PARAGRAPHS.map((key, index) => (
                <motion.p
                  key={key}
                  variants={item}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  className={
                    index === 0
                      ? "text-xl font-medium leading-[2] text-foreground sm:text-2xl sm:leading-[1.95]"
                      : "text-lg leading-[2] text-text-secondary"
                  }
                >
                  {t(key)}
                </motion.p>
              ))}

              <motion.div
                variants={item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.6 }}
                className="rounded-2xl border border-border border-s-4 border-s-accent bg-primary-light p-6"
              >
                <p className="text-xs font-bold text-primary">{t("noteLabel")}</p>
                <p className="mt-2 text-lg font-bold leading-[1.8] text-primary-dark">{t("note")}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
