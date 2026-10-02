"use client";

/**
 * AboutCTA
 * ---------------------------------------------------------------------------
 * Responsibility: the page's "next step". A large deep-green panel on the
 * light page background (so it never merges with the dark footer below).
 *
 * - One gold primary button (the page's single strong yellow action) and one
 *   quiet outline button.
 * - Buttons give tactile feedback: arrow nudge on hover, press-in on active.
 * - A faint masked lattice and a glow add depth without competing with text.
 *
 * Motion: the panel rises into view once, then its content staggers in.
 */
import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { motion } from "framer-motion";
import { LuArrowRight } from "react-icons/lu";
import { useTranslations } from "next-intl";

import { containerStyle, sectionPadding, useReveal } from "../shared/shared";
import { CTA_PRIMARY_HREF, CTA_SECONDARY_HREF } from "./data";

const LATTICE_MASK =
  "radial-gradient(ellipse 60% 80% at 90% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)";
const latticeStyle: CSSProperties = {
  color: "var(--color-accent)",
  opacity: 0.07,
  maskImage: LATTICE_MASK,
  WebkitMaskImage: LATTICE_MASK,
};

export default function AboutCTA(): React.JSX.Element {
  const t = useTranslations("pages.about.cta");
  const { container, item, reduced } = useReveal();

  return (
    <section
      aria-labelledby="about-cta-heading"
      style={sectionPadding}
      className="bg-background"
    >
      <div style={containerStyle}>
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative isolate overflow-hidden rounded-[2rem] bg-primary-dark px-7 py-14 text-start text-surface sm:px-14 sm:py-20"
        >
          {/* Decorative depth: masked lattice + green glow. */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 size-full rtl:-scale-x-100"
            style={latticeStyle}
          >
            <defs>
              <pattern id="about-cta-lattice" width="72" height="72" patternUnits="userSpaceOnUse">
                <path
                  d="M14 14H58V58H14Z M36 4L68 36L36 68L4 36Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-cta-lattice)" />
          </svg>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(36rem_24rem_at_100%_100%,rgba(11,107,79,0.6),transparent_65%)]"
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-2xl"
          >
            <motion.p
              variants={item}
              className="flex items-center gap-3 text-sm font-semibold text-accent-light"
            >
              <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
              {t("eyebrow")}
            </motion.p>

            <motion.h2
              id="about-cta-heading"
              variants={item}
              className="mt-5 text-balance text-3xl font-bold leading-[1.5] sm:text-4xl xl:text-5xl xl:leading-[1.45]"
            >
              {t("title")}
            </motion.h2>

            <motion.p
              variants={item}
              className="mt-4 max-w-xl text-base leading-[2] text-primary-light/80 sm:text-lg"
            >
              {t("description")}
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={CTA_PRIMARY_HREF}
                className="group inline-flex items-center gap-3 rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-primary-dark transition-[background-color,transform] duration-200 hover:bg-accent-light active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {t("primary")}
                <LuArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                />
              </Link>
              <Link
                href={CTA_SECONDARY_HREF}
                className="inline-flex items-center rounded-xl border border-surface/40 px-6 py-3.5 text-base font-bold text-surface transition-[background-color,color,transform] duration-200 hover:bg-surface hover:text-primary-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {t("secondary")}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
