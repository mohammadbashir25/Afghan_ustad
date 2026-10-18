/**
 * data.ts  (About page)
 * ---------------------------------------------------------------------------
 * The single source of structure for the whole About page: icons, ids, order
 * and routes for every section. Order here = order on screen.
 *
 * No visible text lives here. All copy is in next-intl under `pages.about.*`
 * (see the en / fa / ps message files). To change wording, edit the messages;
 * to change a route, add an item or reorder a list, edit this file.
 *
 * Sections in this file, in page order:
 *   1. Hero                 4. Learning loop
 *   2. Educational approach 5. Skill Center
 *   3. Focus areas          6. Values + closing CTA
 */
import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuDoorOpen,
  LuEye,
  LuFootprints,
  LuGlobe,
  LuHammer,
  LuHeartHandshake,
  LuHourglass,
  LuLanguages,
  LuLayers,
  LuLightbulb,
  LuMonitor,
  LuShieldCheck,
  LuTerminal,
  LuTrendingUp,
} from "react-icons/lu";

/* -------------------------------------------------------------------------- */
/* 1. Hero                                                                     */
/* -------------------------------------------------------------------------- */

export interface HeroStripItem {
  readonly id: "teach" | "method" | "language";
  readonly icon: IconType;
}

/** Three plain facts about AfghanUstad shown under the hero (no numbers). */
export const HERO_STRIP: readonly HeroStripItem[] = [
  { id: "teach", icon: LuMonitor },
  { id: "method", icon: LuHammer },
  { id: "language", icon: LuLanguages },
] as const;

export interface HeroStep {
  readonly id: "step1" | "step2" | "step3";
  /** done = checked, active = the step in progress. */
  readonly state: "done" | "active";
}

/** The checklist on the hero visual: understand, practice, build. */
export const HERO_STEPS: readonly HeroStep[] = [
  { id: "step1", state: "done" },
  { id: "step2", state: "done" },
  { id: "step3", state: "active" },
] as const;

export const HERO_COURSES_HREF = "/courses" as const;
export const HERO_STORY_ANCHOR = "#story" as const;

/** Dots along the rising path (viewBox 320 x 400). The last is the goal. */
export const HERO_PATH_DOTS: ReadonlyArray<{ readonly cx: number; readonly cy: number }> = [
  { cx: 60, cy: 340 },
  { cx: 130, cy: 250 },
  { cx: 210, cy: 170 },
  { cx: 260, cy: 70 },
] as const;

/* -------------------------------------------------------------------------- */
/* 2. Educational approach                                                     */
/* -------------------------------------------------------------------------- */

export type PhilosophyId = "understanding" | "practice" | "steps" | "language";

export interface PhilosophyItem {
  readonly id: PhilosophyId;
  readonly icon: IconType;
}

/** The four beliefs of the educational philosophy. */
export const PHILOSOPHY_ITEMS: readonly PhilosophyItem[] = [
  { id: "understanding", icon: LuLightbulb },
  { id: "practice", icon: LuHammer },
  { id: "steps", icon: LuFootprints },
  { id: "language", icon: LuLanguages },
] as const;

/* -------------------------------------------------------------------------- */
/* 3. Focus areas                                                              */
/* -------------------------------------------------------------------------- */

export type FocusId = "fundamentals" | "programming" | "web";

export interface FocusArea {
  readonly id: FocusId;
  readonly icon: IconType;
  /** Where the row leads (localized Link). */
  readonly href: string;
}

/** The three areas AfghanUstad courses grow through, in learning order. */
export const FOCUS_AREAS: readonly FocusArea[] = [
  { id: "fundamentals", icon: LuMonitor, href: "/courses" },
  { id: "programming", icon: LuTerminal, href: "/courses" },
  { id: "web", icon: LuGlobe, href: "/courses" },
] as const;

/* -------------------------------------------------------------------------- */
/* 4. Learning loop                                                            */
/* -------------------------------------------------------------------------- */

export type LoopStepId = "learn" | "practice" | "build" | "progress";

export interface LoopStep {
  readonly id: LoopStepId;
  readonly icon: IconType;
}

/** The loop: each step feeds the next, and progress returns to learning. */
export const LOOP_STEPS: readonly LoopStep[] = [
  { id: "learn", icon: LuBookOpen },
  { id: "practice", icon: LuTerminal },
  { id: "build", icon: LuLayers },
  { id: "progress", icon: LuTrendingUp },
] as const;

/* -------------------------------------------------------------------------- */
/* 5. Skill Center                                                             */
/* -------------------------------------------------------------------------- */

/** Where the Skill Center CTA leads. Change if the route differs. */
export const SKILL_CENTER_HREF = "/skill-center" as const;

export type SkillPointId = "tasks" | "retry" | "progress";
export const SKILL_POINTS: readonly SkillPointId[] = ["tasks", "retry", "progress"] as const;

export type PracticeRowId = "review" | "try" | "check" | "next";

export interface PracticeRow {
  readonly id: PracticeRowId;
  /** done = ticked, active = current step, upcoming = not yet reached. */
  readonly state: "done" | "active" | "upcoming";
}

/** Rows of the illustrative practice card (an example flow, not real data). */
export const PRACTICE_ROWS: readonly PracticeRow[] = [
  { id: "review", state: "done" },
  { id: "try", state: "done" },
  { id: "check", state: "active" },
  { id: "next", state: "upcoming" },
] as const;

/* -------------------------------------------------------------------------- */
/* 6. Values + closing CTA                                                     */
/* -------------------------------------------------------------------------- */

export type ValueId = "clarity" | "respect" | "honesty" | "patience" | "access";

export interface ValueItem {
  readonly id: ValueId;
  readonly icon: IconType;
}

/** The five values, in display order. */
export const VALUES: readonly ValueItem[] = [
  { id: "clarity", icon: LuEye },
  { id: "respect", icon: LuHeartHandshake },
  { id: "honesty", icon: LuShieldCheck },
  { id: "patience", icon: LuHourglass },
  { id: "access", icon: LuDoorOpen },
] as const;

export const CTA_PRIMARY_HREF = "/courses" as const;
export const CTA_SECONDARY_HREF = "/contact" as const;
