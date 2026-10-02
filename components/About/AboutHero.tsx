"use client";

/**
 * AboutHero
 * ---------------------------------------------------------------------------
 * Responsibility: establish identity in one screen.
 *
 *   text side   : eyebrow, large heading, description, two CTAs
 *   visual side : an art-directed composition (arch + rising path + a
 *                 "learn / practice / build" checklist sheet + gold pill)
 *   below       : an identity strip of three plain facts, separated by
 *                 hairlines (deliberately not cards)
 *
 * Layout decisions
 * - The two-column grid uses `auto-fit` in an inline style, so it stacks on
 *   tablet/mobile without breakpoints or locale branching.
 * - On mobile the visual is capped narrower and the sheet overlaps the arch
 *   less, so it reads as a composition rather than a shrunk desktop image.
 * - Direction: logical utilities only; arrows and the dotted path mirror in
 *   RTL.
 *
 * Motion
 * - Text enters from the reading-start side, the visual from the end side.
 * - The path draws once, then its dots pop in; checklist rows tick in order.
 * - The gold pill floats gently (off for reduced motion).
 */
import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { motion } from "framer-motion";
import { LuArrowRight, LuCheck } from "react-icons/lu";
import { useTranslations } from "next-intl";

import { EASE, containerStyle, sectionPadding, useReveal } from "../shared/shared";
import {
  HERO_COURSES_HREF,
  HERO_PATH_DOTS,
  HERO_STEPS,
  HERO_STORY_ANCHOR,
  HERO_STRIP,
} from "./data";

/** Two columns when there is room (>= 2 x 26rem), otherwise stacked. */
const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))",
  alignItems: "center",
  gap: "clamp(2.5rem, 6vw, 6rem)",
};

/** Faint lattice that fades toward the edges (masked, inline, very low opacity). */
const LATTICE_MASK =
  "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)";
const latticeStyle: CSSProperties = {
  color: "var(--color-accent)",
  opacity: 0.08,
  maskImage: LATTICE_MASK,
  WebkitMaskImage: LATTICE_MASK,
};

export default function AboutHero(): React.JSX.Element {
  const t = useTranslations("pages.about");
  const { container, item, fromStart, fromEnd, reduced } = useReveal();

  return (
    <section
      aria-labelledby="about-hero-heading"
      style={{ ...sectionPadding, position: "relative", isolation: "isolate", overflow: "hidden" }}
      className="bg-background"
    >
      {/* Decorative: a green wash at the end edge and a gold glow low-start. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(52rem_34rem_at_100%_0%,rgba(230,244,238,0.95),transparent_62%),radial-gradient(34rem_24rem_at_0%_100%,rgba(255,244,194,0.5),transparent_65%)]"
      />

      <div style={containerStyle}>
        <div style={gridStyle}>
          {/* ------------------------------ Text ------------------------------ */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="min-w-0 text-start"
          >
            <motion.p
              variants={fromStart}
              className="flex items-center gap-3 text-sm font-semibold text-primary"
            >
              <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
              {t("hero.eyebrow")}
            </motion.p>

            <motion.h1
              id="about-hero-heading"
              variants={fromStart}
              className="mt-6 max-w-2xl text-balance text-4xl font-bold leading-[1.45] text-primary-dark sm:text-5xl lg:text-6xl lg:leading-[1.4]"
            >
              {t("hero.title")}
            </motion.h1>

            <motion.p
              variants={fromStart}
              className="mt-6 max-w-xl text-base leading-[2] text-text-secondary sm:text-lg"
            >
              {t("hero.description")}
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={HERO_COURSES_HREF}
                className="group inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-surface shadow-[0_14px_30px_-14px_rgba(11,107,79,0.8)] transition-[background-color,transform] duration-200 hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {t("hero.primaryCta")}
                <LuArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                />
              </Link>
              {/* In-page anchor: a plain <a> is correct for #story. */}
              <a
                href={HERO_STORY_ANCHOR}
                className="inline-flex items-center rounded-xl border border-border-strong bg-surface px-6 py-3.5 text-base font-semibold text-foreground transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              >
                {t("hero.secondaryCta")}
              </a>
            </motion.div>
          </motion.div>

          {/* ----------------------------- Visual ----------------------------- */}
          <motion.div
            variants={fromEnd}
            initial="hidden"
            animate="visible"
            role="img"
            aria-label={t("hero.visual.ariaLabel")}
            className="relative mx-auto w-full max-w-sm px-3 pb-12  sm:max-w-md sm:px-6"
          >
            {/* Arch: deep green frame with faint lattice, glow and the path. */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] bg-primary-dark shadow-[0_40px_80px_-34px_rgba(5,59,46,0.6)]">
              <svg
                aria-hidden="true"
                className="absolute inset-0 size-full rtl:-scale-x-100"
                style={latticeStyle}
              >
                <defs>
                  <pattern id="about-hero-lattice" width="72" height="72" patternUnits="userSpaceOnUse">
                    <path
                      d="M14 14H58V58H14Z M36 4L68 36L36 68L4 36Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#about-hero-lattice)" />
              </svg>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(11,107,79,0.9),transparent_65%)]"
              />

              {/* Rising path: the "progress" motif used across the site. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 320 400"
                className="absolute inset-0 size-full rtl:-scale-x-100"
                preserveAspectRatio="xMidYMid meet"
              >
                <motion.path
                  d="M60 340 C60 290 130 300 130 250 S210 220 210 170 S260 120 260 70"
                  fill="none"
                  stroke="#FFF4C2"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="1 9"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduced ? 0.01 : 1.6, ease: "easeInOut", delay: reduced ? 0 : 0.6 }}
                />
                {HERO_PATH_DOTS.map((dot, index) => {
                  const isGoal = index === HERO_PATH_DOTS.length - 1;
                  return (
                    <motion.circle
                      key={`${dot.cx}-${dot.cy}`}
                      cx={dot.cx}
                      cy={dot.cy}
                      r={isGoal ? 11 : 7}
                      fill={isGoal ? "#F4C430" : "#E6F4EE"}
                      initial={{ scale: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: reduced ? 0.01 : 0.4,
                        ease: EASE,
                        delay: reduced ? 0 : 0.8 + index * 0.3,
                      }}
                      // Scale around each dot's own centre, not the SVG origin.
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Checklist sheet: understanding -> practice -> building. */}
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 24, rotate: reduced ? 0 : 2 }}
              animate={{ opacity: 1, y: 0, rotate: reduced ? 0 : -2 }}
              transition={{ duration: reduced ? 0.01 : 0.8, ease: EASE, delay: reduced ? 0 : 1 }}
              className="absolute bottom-0 start-0 w-[82%] rounded-2xl border border-border bg-surface p-5 text-start shadow-[0_24px_50px_-20px_rgba(5,59,46,0.5)] sm:w-[76%]"
            >
              <p className="text-sm font-bold text-foreground">{t("hero.visual.sheetTitle")}</p>
              <ul className="mt-3 space-y-2.5">
                {HERO_STEPS.map((step, index) => (
                  <li key={step.id} className="flex items-center gap-3 text-sm text-foreground">
                    <motion.span
                      aria-hidden="true"
                      initial={{ scale: reduced ? 1 : 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 18,
                        delay: reduced ? 0 : 1.3 + index * 0.25,
                      }}
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                        step.state === "done"
                          ? "bg-primary text-surface"
                          : "border-2 border-accent bg-accent-light"
                      }`}
                    >
                      {step.state === "done" ? <LuCheck className="size-3.5" strokeWidth={3} /> : null}
                    </motion.span>
                    {t(`hero.visual.${step.id}`)}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Gold pill: the single bright accent in the composition. */}
            <div className="absolute end-0 top-24 sm:end-1">
              <motion.div
                animate={reduced ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-primary-dark shadow-[0_14px_30px_-12px_rgba(5,59,46,0.55)]"
              >
                {t("hero.visual.pill")}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ------------------------- Identity strip ------------------------- */}
        <motion.dl
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 grid gap-8 border-t border-border pt-10 text-start sm:grid-cols-3 sm:gap-0"
        >
          {HERO_STRIP.map(({ id, icon: Icon }) => (
            <motion.div
              key={id}
              variants={item}
              className="flex items-start gap-4 sm:border-s sm:border-border sm:ps-8 sm:first:border-s-0 sm:first:ps-0"
            >
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary"
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <dt className="text-sm font-semibold text-text-secondary">{t(`hero.strip.${id}.label`)}</dt>
                <dd className="mt-1 text-base font-bold leading-[1.7] text-foreground">
                  {t(`hero.strip.${id}.value`)}
                </dd>
              </div>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
