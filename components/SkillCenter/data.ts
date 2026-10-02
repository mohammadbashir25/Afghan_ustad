/**
 * Skill Center — data layer
 * ---------------------------------------------------------------------------
 * Structure only: ids, icons, ordering and translation KEYS. No visible copy.
 * Keys resolve inside the `skillCenter` next-intl namespace.
 *
 * The page tells one story:
 *   Learn → Practice → Guidance → Assignment → Feedback → Progress → Skill
 */
import type { IconType } from "react-icons";
import {
  LuBookOpenText,
  LuTerminal,
  LuUsers,
  LuClipboardList,
  LuMessageSquare,
  LuTrendingUp,
  LuFlag,
  LuListChecks,
  LuLifeBuoy,
  LuTarget,
} from "react-icons/lu";

export const SKILL_NAMESPACE = "skillCenter" as const;

/**
 * Locale-aware paths (no /[locale] prefix — the shared Button is expected to
 * add it, as in `<Button href="/courses">`).
 */
export const SKILL_ROUTES = {
  courses: "/courses",
  contact: "/contact",
  journey: "/skill-center#journey",
} as const;

/** One stage of the journey (also reused by the hero ribbon). */
export interface JourneyStage {
  readonly id: string;
  readonly icon: IconType;
  readonly titleKey: string;
  readonly descriptionKey: string;
}

export const JOURNEY_STAGES: readonly JourneyStage[] = [
  { id: "learn", icon: LuBookOpenText, titleKey: "journey.items.learn.title", descriptionKey: "journey.items.learn.description" },
  { id: "practice", icon: LuTerminal, titleKey: "journey.items.practice.title", descriptionKey: "journey.items.practice.description" },
  { id: "guidance", icon: LuUsers, titleKey: "journey.items.guidance.title", descriptionKey: "journey.items.guidance.description" },
  { id: "assignment", icon: LuClipboardList, titleKey: "journey.items.assignment.title", descriptionKey: "journey.items.assignment.description" },
  { id: "feedback", icon: LuMessageSquare, titleKey: "journey.items.feedback.title", descriptionKey: "journey.items.feedback.description" },
  { id: "progress", icon: LuTrendingUp, titleKey: "journey.items.progress.title", descriptionKey: "journey.items.progress.description" },
] as const;

/** The destination of the journey, styled differently (accent). */
export const JOURNEY_GOAL: JourneyStage = {
  id: "goal",
  icon: LuFlag,
  titleKey: "journey.items.goal.title",
  descriptionKey: "journey.items.goal.description",
};

/** "More than a computer lab" — four qualities of the Skill Center. */
export const OVERVIEW_POINTS = [
  { id: "structured", icon: LuListChecks, titleKey: "overview.points.structured.title", descriptionKey: "overview.points.structured.description" },
  { id: "help", icon: LuLifeBuoy, titleKey: "overview.points.help.title", descriptionKey: "overview.points.help.description" },
  { id: "goals", icon: LuTarget, titleKey: "overview.points.goals.title", descriptionKey: "overview.points.goals.description" },
  { id: "progress", icon: LuTrendingUp, titleKey: "overview.points.progress.title", descriptionKey: "overview.points.progress.description" },
] as const;

/** Why practice matters — three principles. */
export const PRACTICE_PRINCIPLES = [
  { id: "doing", titleKey: "practice.principles.doing.title", descriptionKey: "practice.principles.doing.description" },
  { id: "mistakes", titleKey: "practice.principles.mistakes.title", descriptionKey: "practice.principles.mistakes.description" },
  { id: "repetition", titleKey: "practice.principles.repetition.title", descriptionKey: "practice.principles.repetition.description" },
] as const;

export type GuidanceTabId = "guided" | "assignments" | "feedback";

export interface GuidanceTab {
  readonly id: GuidanceTabId;
  readonly icon: IconType;
  readonly labelKey: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly pointKeys: readonly string[];
  /** Label of the NEXT stage, shown as "Leads to …". */
  readonly nextKey: string;
}

/** Tabs of the guidance explorer. */
export const GUIDANCE_TABS: readonly GuidanceTab[] = [
  {
    id: "guided",
    icon: LuUsers,
    labelKey: "guidance.tabs.guided.label",
    titleKey: "guidance.tabs.guided.title",
    descriptionKey: "guidance.tabs.guided.description",
    pointKeys: ["guidance.tabs.guided.points.one", "guidance.tabs.guided.points.two", "guidance.tabs.guided.points.three"],
    nextKey: "guidance.tabs.guided.next",
  },
  {
    id: "assignments",
    icon: LuClipboardList,
    labelKey: "guidance.tabs.assignments.label",
    titleKey: "guidance.tabs.assignments.title",
    descriptionKey: "guidance.tabs.assignments.description",
    pointKeys: ["guidance.tabs.assignments.points.one", "guidance.tabs.assignments.points.two", "guidance.tabs.assignments.points.three"],
    nextKey: "guidance.tabs.assignments.next",
  },
  {
    id: "feedback",
    icon: LuMessageSquare,
    labelKey: "guidance.tabs.feedback.label",
    titleKey: "guidance.tabs.feedback.title",
    descriptionKey: "guidance.tabs.feedback.description",
    pointKeys: ["guidance.tabs.feedback.points.one", "guidance.tabs.feedback.points.two", "guidance.tabs.feedback.points.three"],
    nextKey: "guidance.tabs.feedback.next",
  },
] as const;

/** Course ⇄ Skill Center mapping rows. */
export const COURSE_SKILL_PAIRS = [
  { id: "lesson", courseKey: "courseToSkill.pairs.lesson.course", skillKey: "courseToSkill.pairs.lesson.skill" },
  { id: "exercise", courseKey: "courseToSkill.pairs.exercise.course", skillKey: "courseToSkill.pairs.exercise.skill" },
  { id: "project", courseKey: "courseToSkill.pairs.project.course", skillKey: "courseToSkill.pairs.project.skill" },
  { id: "milestone", courseKey: "courseToSkill.pairs.milestone.course", skillKey: "courseToSkill.pairs.milestone.skill" },
] as const;
