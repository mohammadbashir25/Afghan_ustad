"use client";

/**
 * AboutVisual
 * ---------------------------------------------------------------------------
 * The VISUAL half: a controlled editorial collage. No marketing copy is
 * decided here; it only reads translated labels and data.ts.
 *
 * Layers (back to front):
 *   1. Gold-tint plate            -> depth, offset toward the end edge
 *   2. Arch photo frame           -> the anchor. Shows a designed PLACEHOLDER
 *                                    until the client supplies a real photo
 *   3. Dark "learning path" tile  -> top-start, a rising dotted curve
 *   4. Language card              -> bottom-end, one lesson in 3 scripts
 *   5. "Learn by doing" pill      -> start side, gently floating
 *
 * RTL: every offset is logical (start/end) and the path SVG is mirrored with
 * `rtl:-scale-x-100`, so the collage is a true mirror image. The container
 * carries role="img" + a translated label; its children are decorative.
 */
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LuImage } from "react-icons/lu";
import { useLocale, useTranslations } from "next-intl";

import {
  ABOUT_BADGE_ICON as BadgeIcon,
  ABOUT_FACTS,
  ABOUT_IMAGE,
  ABOUT_LANGUAGES,
  isProvided,
  isRtlLocale,
} from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Dots on the mini learning path (viewBox 144 x 144). Last one is the goal. */
const PATH_DOTS: ReadonlyArray<{ cx: number; cy: number }> = [
  { cx: 24, cy: 116 },
  { cx: 56, cy: 82 },
  { cx: 88, cy: 60 },
  { cx: 116, cy: 28 },
];

interface PhotoSlotProps {
  readonly src: string;
  readonly alt: string;
  readonly placeholderLabel: string;
}

/**
 * PhotoSlot
 * Renders the real photo when provided, otherwise a deliberate placeholder:
 * lattice pattern + dashed inner arch + icon + label, so the empty state
 * looks designed rather than broken.
 */
function PhotoSlot({ src, alt, placeholderLabel }: PhotoSlotProps): React.JSX.Element {
  if (isProvided(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={ABOUT_IMAGE.width}
        height={ABOUT_IMAGE.height}
        sizes="(min-width: 1024px) 40vw, 90vw"
        className="absolute inset-0 size-full object-cover"
      />
    );
  }

  return (
    <div className="absolute inset-0 text-primary">
      {/* Lattice of interlaced squares (eight-point-star rhythm). */}
      <svg aria-hidden="true" className="absolute inset-0 size-full opacity-[0.14]">
        <defs>
          <pattern id="about-lattice" width="64" height="64" patternUnits="userSpaceOnUse">
            <path
              d="M13 13H51V51H13Z M32 4L60 32L32 60L4 32Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#about-lattice)" />
      </svg>

      {/* Dashed inner arch marks exactly where the photo will sit. */}
      <div
        aria-hidden="true"
        className="absolute inset-4 rounded-t-full rounded-b-2xl border-2 border-dashed border-primary/30"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-surface shadow-[0_12px_30px_-12px_rgba(5,59,46,0.5)]">
          <LuImage aria-hidden="true" className="size-7" strokeWidth={1.5} />
        </span>
        <span className="text-sm font-medium leading-relaxed text-text-secondary">
          {placeholderLabel}
        </span>
      </div>
    </div>
  );
}

export default function AboutVisual(): React.JSX.Element {
  const t = useTranslations("landing.about");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

  // The visual enters from the reading-END side, opposite the text.
  const endOffset = prefersReducedMotion ? 0 : isRtlLocale(locale) ? -36 : 36;

  // Only client-verified facts are ever rendered.
  const verifiedFacts = ABOUT_FACTS.filter((fact) => isProvided(fact.value));

  /** Arch frame "unveils" with a clip-path wipe from the bottom. */
  const arch: Variants = {
    hidden: {
      opacity: 0,
      x: endOffset,
      clipPath: prefersReducedMotion ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
    },
    visible: {
      opacity: 1,
      x: 0,
      clipPath: "inset(0% 0% 0% 0%)",
      transition: { duration: prefersReducedMotion ? 0.01 : 1.1, ease: EASE },
    },
  };

  /** Secondary pieces pop in after the arch, each with its own delay. */
  const piece = (delay: number): Variants => ({
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 24,
      scale: prefersReducedMotion ? 1 : 0.94,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.7,
        ease: EASE,
        delay: prefersReducedMotion ? 0 : delay,
      },
    },
  });

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      role="img"
      aria-label={t("visual.ariaLabel")}
      // Padding reserves room for the pieces that overhang the arch.
      className="relative mx-auto w-full max-w-md px-6 pb-14 pt-10 lg:max-w-lg"
    >
      {/* 1. Plate: gold tint offset toward the end edge for layered depth. */}
      <motion.div
        variants={piece(0.3)}
        aria-hidden="true"
        className="absolute bottom-8 end-0 top-16 w-[78%] rounded-[2.5rem] bg-accent-light"
      />

      {/* 2. Arch frame: the main anchor (photo or designed placeholder). */}
      <motion.div
        variants={arch}
        className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] border border-border bg-primary-light shadow-[0_40px_80px_-34px_rgba(5,59,46,0.55)]"
      >
        <PhotoSlot
          src={ABOUT_IMAGE.src}
          alt={t("visual.imageAlt")}
          placeholderLabel={t("visual.imagePlaceholder")}
        />

        {/* Facts strip: rendered ONLY for client-verified facts. */}
        {verifiedFacts.length > 0 ? (
          <dl className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-8 gap-y-2 bg-primary-dark/90 px-7 py-5 text-start backdrop-blur-sm">
            {verifiedFacts.map((fact) => (
              <div key={fact.id}>
                <dt className="text-xs text-accent-light/80">{t(`facts.${fact.id}`)}</dt>
                <dd className="text-sm font-semibold text-surface">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </motion.div>

      {/* 3. Learning-path tile: a dotted curve that climbs to a gold goal.
          Mirrored in RTL so it rises toward the reading-start side. */}
      <motion.div
        variants={piece(0.8)}
        whileHover={prefersReducedMotion ? undefined : { rotate: -3, scale: 1.04 }}
        className="absolute start-0 top-2 size-36 overflow-hidden rounded-3xl bg-primary-dark shadow-[0_24px_50px_-20px_rgba(5,59,46,0.7)] sm:size-40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 144 144"
          className="size-full rtl:-scale-x-100"
        >
          <motion.path
            d="M24 116 C24 98 56 100 56 82 S88 78 88 60 S116 46 116 28"
            fill="none"
            stroke="#FFF4C2"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 7"
            variants={{
              hidden: { pathLength: prefersReducedMotion ? 1 : 0 },
              visible: {
                pathLength: 1,
                transition: {
                  duration: prefersReducedMotion ? 0.01 : 1.4,
                  ease: "easeInOut",
                  delay: prefersReducedMotion ? 0 : 1,
                },
              },
            }}
          />
          {PATH_DOTS.map((dot, index) => {
            const isGoal = index === PATH_DOTS.length - 1;
            return (
              <motion.circle
                key={`${dot.cx}-${dot.cy}`}
                cx={dot.cx}
                cy={dot.cy}
                r={isGoal ? 8 : 5}
                fill={isGoal ? "#F4C430" : "#E6F4EE"}
                variants={{
                  hidden: {
                    scale: prefersReducedMotion ? 1 : 0,
                    opacity: prefersReducedMotion ? 1 : 0,
                  },
                  visible: {
                    scale: 1,
                    opacity: 1,
                    transition: {
                      duration: prefersReducedMotion ? 0.01 : 0.4,
                      delay: prefersReducedMotion ? 0 : 1.1 + index * 0.28,
                      ease: EASE,
                    },
                  },
                }}
                // Scale around each dot's own center, not the SVG origin.
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* 4. Language card: concrete proof of "your language comes first".
          Each row sets its own `dir` so mixed-script lines always render
          correctly regardless of page direction. */}
      <motion.div
        variants={piece(1.2)}
        whileHover={prefersReducedMotion ? undefined : { y: -6 }}
        className="absolute bottom-0 end-0 w-64 rounded-2xl border border-border bg-surface p-5 text-start shadow-[0_24px_50px_-20px_rgba(5,59,46,0.45)] sm:w-72"
      >
        <p className="text-sm font-bold text-foreground">{t("visual.cardTitle")}</p>
        <ul className="mt-3 divide-y divide-border">
          {ABOUT_LANGUAGES.map((language) => (
            <li
              key={language.code}
              dir={language.dir}
              className="flex items-baseline justify-between gap-4 py-2.5"
            >
              <span className="text-xs font-bold text-primary">{language.endonym}</span>
              <span className="text-sm text-foreground">
                {t(`visual.samples.${language.code}`)}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* 5. Pill: gold accent that floats gently (static under reduced
          motion). */}
      <motion.div variants={piece(1.4)} className="absolute bottom-24 start-0 sm:start-1">
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-primary-dark shadow-[0_14px_30px_-12px_rgba(5,59,46,0.55)]"
        >
          <BadgeIcon aria-hidden="true" className="size-4" />
          {t("visual.badge")}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}