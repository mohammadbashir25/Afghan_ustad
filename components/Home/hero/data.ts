/**
 * Hero configuration. Content structure lives here (which stages exist, which
 * icons they use, where the CTAs point); every visible string is a next-intl
 * key in the "Hero" namespace (or "Common" for shared CTA labels).
 *
 * Keeping the section data-driven means a future CMS can supply the same shapes
 * (ordered stages, actions, snippet lines) without touching the components.
 */

import type { IconType } from "react-icons";
import { LuBookOpen, LuLayers, LuTerminal, LuTrendingUp } from "react-icons/lu";

/* -------------------------------------------------------------------------- */
/* Learning path (the visual's main card)                                     */
/* -------------------------------------------------------------------------- */

export type HeroStageId = "learn" | "practice" | "build" | "progress";

export type HeroStage = {
  id: HeroStageId;
  icon: IconType;
  /** Keys inside the "Hero" namespace. */
  titleKey: `stages.${HeroStageId}.title`;
  textKey: `stages.${HeroStageId}.text`;
  /** The final stage is marked with the gold accent instead of green. */
  accent?: boolean;
};

/** Order matters: it is the Learn → Practice → Build Skills → Progress sequence. */
export const HERO_STAGES: readonly HeroStage[] = [
  { id: "learn", icon: LuBookOpen, titleKey: "stages.learn.title", textKey: "stages.learn.text" },
  { id: "practice", icon: LuTerminal, titleKey: "stages.practice.title", textKey: "stages.practice.text" },
  { id: "build", icon: LuLayers, titleKey: "stages.build.title", textKey: "stages.build.text" },
  {
    id: "progress",
    icon: LuTrendingUp,
    titleKey: "stages.progress.title",
    textKey: "stages.progress.text",
    accent: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Code motif (decorative, language-neutral — never translated)               */
/* -------------------------------------------------------------------------- */

export type CodeTone = "keyword" | "name" | "punct" | "call";

export type CodeToken = { text: string; tone: CodeTone };
export type CodeLine = { indent: number; tokens: readonly CodeToken[] };

/** A tiny snippet that mirrors the path: loop over the steps, build skills, measure progress. */
export const HERO_CODE: { filename: string; lines: readonly CodeLine[] } = {
  filename: "path.py",
  lines: [
    {
      indent: 0,
      tokens: [
        { text: "path", tone: "name" },
        { text: " = [", tone: "punct" },
        { text: "learn", tone: "call" },
        { text: ", ", tone: "punct" },
        { text: "practice", tone: "call" },
        { text: ", ", tone: "punct" },
        { text: "build", tone: "call" },
        { text: "]", tone: "punct" },
      ],
    },
    {
      indent: 0,
      tokens: [
        { text: "for", tone: "keyword" },
        { text: " step ", tone: "name" },
        { text: "in", tone: "keyword" },
        { text: " path", tone: "name" },
        { text: ":", tone: "punct" },
      ],
    },
    {
      indent: 1,
      tokens: [
        { text: "skills", tone: "name" },
        { text: ".", tone: "punct" },
        { text: "append", tone: "call" },
        { text: "(", tone: "punct" },
        { text: "step", tone: "name" },
        { text: ")", tone: "punct" },
      ],
    },
    {
      indent: 0,
      tokens: [
        { text: "progress", tone: "name" },
        { text: " = ", tone: "punct" },
        { text: "grow", tone: "call" },
        { text: "(", tone: "punct" },
        { text: "skills", tone: "name" },
        { text: ")", tone: "punct" },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Calls to action                                                            */
/* -------------------------------------------------------------------------- */

export type HeroAction = {
  id: string;
  /** Key in the shared "Common" namespace. */
  labelKey: "exploreCourses" | "learnMore";
  /** Locale-aware route. */
  href: string;
  variant: "primary" | "outline";
  /** Show the (RTL-flipped) arrow icon. */
  withArrow?: boolean;
  /** Wrap in MagneticButton — reserved for the single most important CTA. */
  magnetic?: boolean;
};

export const HERO_ACTIONS: readonly HeroAction[] = [
  { id: "courses", labelKey: "exploreCourses", href: "/courses", variant: "primary", withArrow: true, magnetic: true },
  { id: "about", labelKey: "learnMore", href: "/about", variant: "outline" },
];

/* -------------------------------------------------------------------------- */
/* Motion timeline (seconds) — one place to retime the whole entrance         */
/* -------------------------------------------------------------------------- */

export const HERO_TIMING = {
  eyebrow: 0.1,
  headline: 0.2,
  /** Delay between headline words. */
  headlineStep: 0.07,
  description: 0.6,
  actions: 0.8,
  visual: 0.3,
  /** When the path starts lighting up, and the gap between stages. */
  pathStart: 0.9,
  pathStep: 0.45,
  code: 1.1,
} as const;
