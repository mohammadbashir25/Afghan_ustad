"use client";

/**
 * AboutValues
 * ---------------------------------------------------------------------------
 * Responsibility: state what AfghanUstad stands for, in the voice of a
 * manifesto rather than a feature grid.
 *
 * Layout decisions
 * - Desktop: sticky intro on the start side, a single ruled list on the end
 *   side. Five values, one column, generous space - deliberately NOT a
 *   three-column card grid.
 * - Each value is a hairline-separated row: icon tile, bold title, one-line
 *   description. On mobile the rows simply stack at full width.
 *
 * Interaction: hovering/focusing a row nudges it toward the reading-end side
 * and inverts its icon tile to solid green. Pure CSS, so it costs nothing and
 * switches off under reduced motion.
 *
 * Motion: rows stagger in once as the list enters the viewport.
 */
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import SectionIntro from "./SectionIntro";
import { containerStyle, sectionPadding, useReveal } from "../shared/shared";
import { VALUES } from "./data";

export default function AboutValues(): React.JSX.Element {
  const t = useTranslations("pages.about.values");
  const { container, item, fromStart } = useReveal();

  return (
    <section
      aria-labelledby="about-values-heading"
      style={sectionPadding}
      className="bg-surface-muted"
    >
      <div style={containerStyle}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
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
                description={t("description")}
                headingId="about-values-heading"
              />
            </motion.div>
          </motion.div>

          <motion.ul
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="border-t border-border-strong text-start lg:col-span-7"
          >
            {VALUES.map(({ id, icon: Icon }) => (
              <motion.li
                key={id}
                variants={item}
                className="group flex gap-5 border-b border-border-strong py-7 transition-transform duration-300 hover:translate-x-1 rtl:hover:-translate-x-1 motion-reduce:transition-none motion-reduce:hover:translate-x-0 sm:gap-7 sm:py-9"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface text-primary shadow-[0_8px_20px_-12px_rgba(5,59,46,0.5)] transition-colors duration-300 group-hover:bg-primary group-hover:text-surface"
                >
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold leading-[1.6] text-primary-dark sm:text-2xl">
                    {t(`items.${id}.title`)}
                  </h3>
                  <p className="mt-1.5 max-w-xl text-base leading-[2] text-text-secondary sm:text-lg">
                    {t(`items.${id}.description`)}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
