"use client";

/**
 * LearningPhilosophy
 * ---------------------------------------------------------------------------
 * Responsibility: show WHAT students learn and HOW learning and practice fit
 * together, then hand off to the Skill Center.
 *
 * Three beats, top to bottom:
 *   1. FocusAreas   a ruled list of the three areas (links to courses) - a
 *                   deliberate contrast to card grids
 *   2. LearningLoop an interactive Learn -> Practice -> Build -> Progress loop
 *   3. SkillCenterBand (own file) the destination of the loop
 *
 * LearningLoop state: `active` is the selected step. A track connects the
 * four nodes and a green fill grows to the active node; nodes before it are
 * marked "reached". It is a real tablist (Left/Right arrows follow reading
 * direction, so RTL is correct), with Home/End.
 *
 * Responsive: on mobile the four nodes sit in a 2x2 grid and the connector is
 * hidden (it only makes sense in one row); the detail card below carries the
 * story on every size.
 *
 * Direction: nodes order, track fill and arrows all mirror via logical
 * utilities; the return arc is a symmetric SVG, mirrored with `rtl:`.
 */
import { useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { AnimatePresence, motion } from "framer-motion";
import { LuArrowRight } from "react-icons/lu";
import { useTranslations } from "next-intl";

import SectionIntro from "./SectionIntro";
import { EASE, containerStyle, sectionPadding, useReveal } from "../shared/shared";
import SkillCenterBand from "./SkillCenterBand";
import { FOCUS_AREAS, LOOP_STEPS, type LoopStepId } from "./data";

export default function LearningPhilosophy(): React.JSX.Element {
  return (
    <section
      aria-labelledby="about-focus-heading"
      style={sectionPadding}
      className="bg-background"
    >
      <div style={containerStyle}>
        <FocusAreas />
        <LearningLoop />
        <SkillCenterBand />
      </div>
    </section>
  );
}

/* ------------------------------- Focus areas ------------------------------- */

/**
 * FocusAreas
 * A ruled list: number, icon, title + one line, and an arrow. Each row is one
 * link; hover tints the row and nudges the arrow toward the reading
 * direction.
 */
function FocusAreas(): React.JSX.Element {
  const t = useTranslations("pages.about.learning.focus");
  const { container, item, fromStart } = useReveal();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.div variants={fromStart}>
        <SectionIntro
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          headingId="about-focus-heading"
        />
      </motion.div>

      <ul className="mt-12 border-t border-border text-start">
        {FOCUS_AREAS.map(({ id, icon: Icon, href }, index) => (
          <motion.li key={id} variants={item} className="border-b border-border">
            <Link
              href={href}
              className="group flex items-center gap-4 px-2 py-6 transition-colors duration-300 hover:bg-primary-light/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:gap-8 sm:px-6 sm:py-8"
            >
              <span
                aria-hidden="true"
                className="hidden w-10 shrink-0 text-sm font-bold tabular-nums text-text-muted sm:block"
              >
                0{index + 1}
              </span>
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-surface"
              >
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-bold leading-[1.6] text-primary-dark sm:text-2xl">
                  {t(`items.${id}.title`)}
                </span>
                <span className="mt-1 block max-w-2xl text-base leading-[1.9] text-text-secondary">
                  {t(`items.${id}.description`)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-surface"
              >
                <LuArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" />
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ------------------------------- Learning loop ------------------------------ */

/**
 * LearningLoop
 * Interactive four-step loop with a connecting track, a growing fill, a
 * "back to learning" return arc and a detail card for the selected step.
 */
function LearningLoop(): React.JSX.Element {
  const t = useTranslations("pages.about.learning.loop");
  const { container, item, fromStart, isRtl, reduced } = useReveal();

  const [active, setActive] = useState<LoopStepId>(LOOP_STEPS[0].id);
  const uid = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = LOOP_STEPS.findIndex((step) => step.id === active);
  const ActiveIcon = LOOP_STEPS[activeIndex].icon;
  // Fill spans first-node centre to last-node centre (0% .. 100% of the track).
  const fillPercent = (activeIndex / (LOOP_STEPS.length - 1)) * 100;

  const select = (index: number): void => {
    const next = (index + LOOP_STEPS.length) % LOOP_STEPS.length;
    setActive(LOOP_STEPS[next].id);
    tabRefs.current[next]?.focus();
  };

  /** Left/Right follow READING direction; Home/End jump to the ends. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    const back = isRtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === back) {
      event.preventDefault();
      select(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(LOOP_STEPS.length - 1);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="mt-24"
    >
      <motion.div variants={fromStart}>
        <SectionIntro eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      </motion.div>

      {/* Nodes + track */}
      <motion.div variants={item} className="relative mt-14">
        {/* Track (md+): runs between the first and last node centres. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[12.5%] top-7 hidden h-0.5 rounded-full bg-border md:block"
        >
          <motion.div
            className="absolute inset-y-0 start-0 rounded-full bg-primary"
            initial={false}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: reduced ? 0.01 : 0.6, ease: EASE }}
          />
        </div>

        <div
          role="tablist"
          aria-label={t("tabsLabel")}
          className="relative grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4"
        >
          {LOOP_STEPS.map(({ id, icon: Icon }, index) => {
            const isActive = id === active;
            const isReached = index < activeIndex;
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
                className="group flex flex-col items-center gap-3 rounded-2xl px-2 py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 flex size-14 items-center justify-center rounded-2xl border-2 transition-[background-color,border-color,color,transform] duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none ${
                    isActive
                      ? "border-primary bg-primary text-surface shadow-[0_14px_30px_-12px_rgba(11,107,79,0.8)]"
                      : isReached
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border bg-surface text-text-secondary group-hover:border-primary/50"
                  }`}
                >
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <span
                  className={`text-base font-bold transition-colors ${
                    isActive ? "text-primary-dark" : "text-text-secondary group-hover:text-foreground"
                  }`}
                >
                  {t(`steps.${id}.title`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Return arc (md+): progress feeds back into learning. */}
        <div aria-hidden="true" className="mt-4 hidden md:block">
          <svg
            viewBox="0 0 100 14"
            preserveAspectRatio="none"
            className="h-10 w-full rtl:-scale-x-100"
          >
            <path
              d="M87.5 0 C87.5 14 12.5 14 12.5 0"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <p className="-mt-1 text-center text-sm font-semibold text-text-secondary">
            {t("returnLabel")}
          </p>
        </div>
      </motion.div>

      {/* Detail card for the selected step */}
      <motion.div variants={item} className="mt-12">
        <div
          role="tabpanel"
          id={`${uid}-panel`}
          aria-labelledby={`${uid}-tab-${active}`}
          aria-live="polite"
          className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-7 text-start shadow-[0_30px_60px_-40px_rgba(5,59,46,0.4)] sm:p-9"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.12 } }}
              transition={{ duration: reduced ? 0.01 : 0.35, ease: EASE }}
              className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7"
            >
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary"
              >
                <ActiveIcon className="size-7" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="text-xl font-bold leading-[1.6] text-primary-dark sm:text-2xl">
                  {t(`steps.${active}.title`)}
                </h3>
                <p className="mt-2 text-base leading-[2] text-text-secondary sm:text-lg">
                  {t(`steps.${active}.description`)}
                </p>
                <p className="mt-5 border-s-4 border-accent ps-4 text-base font-semibold leading-[1.9] text-foreground">
                  <span className="block text-xs font-bold text-primary">{t("connectsLabel")}</span>
                  {t(`steps.${active}.link`)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
