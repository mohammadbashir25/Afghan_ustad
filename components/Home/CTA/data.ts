/**
 * FinalCTA configuration. Routes, which labels to use, the visual's steps and
 * its code motif live here; every visible string is a next-intl key
 * ("FinalCTA" namespace, or "Common" for shared CTA labels).
 *
 * There is deliberately no urgency data (deadlines, seat counts, discounts).
 * If real data ever exists, add it here as a typed field and render it from a
 * translated key, rather than hardcoding it in JSX.
 */

import type { IconType } from "react-icons";
import { LuBookOpen, LuLayers, LuPlay, LuTerminal } from "react-icons/lu";

/** Shared between <section aria-labelledby> and the <h2>. */
export const FINAL_CTA_HEADING_ID = "final-cta-heading";

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export type CTAAction = {
  id: string;
  /** Key in the shared "Common" namespace. */
  labelKey: "enrollNow" | "exploreCourses";
  /** Locale-aware route. */
  href: string;
  /** "primary" renders a Button; "secondary" renders a quieter text link. */
  emphasis: "primary" | "secondary";
};

/**
 * Enrollment currently goes through the contact page (same target as the navbar
 * CTA). Point `href` at a dedicated route here if that changes.
 */
export const CTA_ACTIONS: readonly CTAAction[] = [
  { id: "enroll", labelKey: "enrollNow", href: "/contact", emphasis: "primary" },
  { id: "courses", labelKey: "exploreCourses", href: "/courses", emphasis: "secondary" },
];

/* -------------------------------------------------------------------------- */
/* Visual: the Hero's path, arriving at "your next step"                      */
/* -------------------------------------------------------------------------- */

export type CTAStepId = "learn" | "practice" | "build" | "next";

export type CTAStep = {
  id: CTAStepId;
  icon: IconType;
  /** Key inside the "FinalCTA" namespace. */
  labelKey: `visual.steps.${CTAStepId}`;
  /** The last step is the call to action: it resolves in gold. */
  final?: boolean;
  /** Mirror the icon in RTL (it points in the reading direction). */
  directional?: boolean;
};

export const CTA_STEPS: readonly CTAStep[] = [
  { id: "learn", icon: LuBookOpen, labelKey: "visual.steps.learn" },
  { id: "practice", icon: LuTerminal, labelKey: "visual.steps.practice" },
  { id: "build", icon: LuLayers, labelKey: "visual.steps.build" },
  { id: "next", icon: LuPlay, labelKey: "visual.steps.next", final: true, directional: true },
];

/* Decorative code motif — language-neutral, never translated. It continues the
   Hero's path.py: once the skills are ready, the next call is enroll(). */

export type CodeTone = "name" | "keyword" | "punct" | "action";
export type CodeToken = { text: string; tone: CodeTone };
export type CodeLine = {
  indent: number;
  tokens: readonly CodeToken[];
  /** Fades in after the path animation finishes, to land on the action. */
  delayed?: boolean;
};

export const CTA_CODE: { filename: string; lines: readonly CodeLine[] } = {
  filename: "next.py",
  lines: [
    {
      indent: 0,
      tokens: [
        { text: "skills", tone: "name" },
        { text: " = ", tone: "punct" },
        { text: "grow", tone: "keyword" },
        { text: "(", tone: "punct" },
        { text: "path", tone: "name" },
        { text: ")", tone: "punct" },
      ],
    },
    {
      indent: 0,
      tokens: [
        { text: "if", tone: "keyword" },
        { text: " skills", tone: "name" },
        { text: ".", tone: "punct" },
        { text: "ready", tone: "name" },
        { text: ":", tone: "punct" },
      ],
    },
    {
      indent: 1,
      delayed: true,
      tokens: [
        { text: "enroll", tone: "action" },
        { text: "()", tone: "punct" },
      ],
    },
  ],
};

/** Motion timing (seconds) for the path animation. */
export const CTA_TIMING = {
  pathStart: 0.35,
  pathStep: 0.4,
} as const;
