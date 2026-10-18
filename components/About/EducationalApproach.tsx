"use client";

/**
 * EducationalApproach
 * ---------------------------------------------------------------------------
 * Responsibility: explain HOW AfghanUstad thinks about education, as an
 * interactive reading experience on the deep-green section.
 *
 *   left  : intro + a vertical list of four beliefs (the "tabs")
 *   right : a large detail panel for the selected belief - a one-line
 *           statement, the reasoning, and "what this looks like"
 *
 * State: `active` is the selected belief id. Selecting swaps the panel with a
 * short cross-fade (AnimatePresence, mode="wait").
 *
 * Accessibility: this is a real tablist (vertical). Up/Down arrows move the
 * selection, Home/End jump to the ends, and focus follows selection via refs.
 *
 * Responsive: on mobile the beliefs stack above the panel as full-width rows,
 * so nothing relies on hover and every belief stays one tap away.
 *
 * The faint lattice is masked and very low opacity so it never competes with
 * the text.
 */
import { useId, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import SectionIntro from "./SectionIntro";
import { EASE, containerStyle, sectionPadding, useReveal } from "../shared/shared";
import { PHILOSOPHY_ITEMS, type PhilosophyId } from "./data";

const LATTICE_MASK =
  "radial-gradient(ellipse 55% 70% at 85% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)";
const latticeStyle: CSSProperties = {
  color: "var(--color-accent)",
  opacity: 0.05,
  maskImage: LATTICE_MASK,
  WebkitMaskImage: LATTICE_MASK,
};

export default function EducationalApproach(): React.JSX.Element {
  const t = useTranslations("pages.about.approach");
  const { container, fromStart, fromEnd, reduced } = useReveal();

  const [active, setActive] = useState<PhilosophyId>(PHILOSOPHY_ITEMS[0].id);
  const uid = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = PHILOSOPHY_ITEMS.findIndex((entry) => entry.id === active);
  const ActiveIcon = PHILOSOPHY_ITEMS[activeIndex].icon;

  /** Select a tab and move focus with it (roving tabindex pattern). */
  const select = (index: number): void => {
    const next = (index + PHILOSOPHY_ITEMS.length) % PHILOSOPHY_ITEMS.length;
    setActive(PHILOSOPHY_ITEMS[next].id);
    tabRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      select(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(PHILOSOPHY_ITEMS.length - 1);
    }
  };

  return (
    <section
      aria-labelledby="about-approach-heading"
      style={{ ...sectionPadding, position: "relative", isolation: "isolate", overflow: "hidden" }}
      className="bg-primary-dark text-surface"
    >
      {/* Decorative: masked lattice + a green glow behind the panel. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 size-full rtl:-scale-x-100"
        style={latticeStyle}
      >
        <defs>
          <pattern id="about-approach-lattice" width="72" height="72" patternUnits="userSpaceOnUse">
            <path
              d="M14 14H58V58H14Z M36 4L68 36L36 68L4 36Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#about-approach-lattice)" />
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(44rem_30rem_at_85%_50%,rgba(11,107,79,0.5),transparent_65%)]"
      />

      <div style={containerStyle}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ------------------------ Intro + belief list ----------------------- */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="lg:col-span-5"
          >
            <motion.div variants={fromStart}>
              <SectionIntro
                tone="dark"
                eyebrow={t("eyebrow")}
                title={t("title")}
                description={t("description")}
                headingId="about-approach-heading"
              />
            </motion.div>

            <motion.div
              variants={fromStart}
              role="tablist"
              aria-orientation="vertical"
              aria-label={t("tabsLabel")}
              className="mt-10 space-y-2"
            >
              {PHILOSOPHY_ITEMS.map(({ id }, index) => {
                const isActive = id === active;
                return (
                  <button
                    key={id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${id}`}
                    aria-selected={isActive}
                    aria-controls={`${uid}-panel`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActive(id)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border-s-4 px-5 py-4 text-start transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      isActive
                        ? "border-accent bg-surface/10"
                        : "border-transparent hover:bg-surface/5"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-7 shrink-0 text-sm font-bold tabular-nums transition-colors ${
                        isActive ? "text-accent" : "text-primary-light/50"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <span
                      className={`text-lg font-bold leading-[1.6] transition-colors ${
                        isActive ? "text-surface" : "text-primary-light/75 group-hover:text-surface"
                      }`}
                    >
                      {t(`items.${id}.title`)}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </motion.div>

          {/* ------------------------------ Detail panel ------------------------ */}
          <motion.div
            variants={fromEnd}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="lg:col-span-7"
          >
            <div
              role="tabpanel"
              id={`${uid}-panel`}
              aria-labelledby={`${uid}-tab-${active}`}
              className="relative overflow-hidden rounded-[2rem] border border-surface/15 bg-surface/5 p-7 text-start sm:p-10 lg:min-h-[28rem]"
            >
              {/* Oversized numeral as quiet decoration. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute end-6 top-2 text-8xl font-bold leading-none text-surface/[0.06] sm:text-9xl"
              >
                0{activeIndex + 1}
              </span>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.12 } }}
                  transition={{ duration: reduced ? 0.01 : 0.4, ease: EASE }}
                  className="relative"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary-dark"
                  >
                    <ActiveIcon className="size-7" strokeWidth={1.75} />
                  </span>

                  <h3 className="mt-6 max-w-xl text-2xl font-bold leading-[1.6] sm:text-3xl sm:leading-[1.55]">
                    {t(`items.${active}.statement`)}
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-[2] text-primary-light/80 sm:text-lg">
                    {t(`items.${active}.detail`)}
                  </p>

                  <div className="mt-8 max-w-xl rounded-2xl border border-surface/15 bg-primary-dark/60 p-5">
                    <p className="flex items-center gap-2 text-xs font-bold text-accent-light">
                      <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
                      {t("exampleLabel")}
                    </p>
                    <p className="mt-2 text-base font-semibold leading-[1.9]">
                      {t(`items.${active}.example`)}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
