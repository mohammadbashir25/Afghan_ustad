/**
 * ValueProposition — data layer
 * ---------------------------------------------------------------------------
 * Single source of truth for the learning loop shown in this section.
 * No visible copy lives here: every string is a next-intl KEY, resolved
 * relative to the `landing.valueProposition` namespace.
 *
 * The Hero already lists Learn → Practice → Apply → Progress as a plain path.
 * This section goes one level deeper: it follows ONE example lesson through
 * those stages, so each pillar carries a concrete `exampleKey`.
 */
import type { IconType } from "react-icons";
import {
  LuBookOpenText,
  LuTerminal,
  LuHammer,
  LuTrendingUp,
} from "react-icons/lu";

/** next-intl namespace used by every component in this section. */
export const VALUE_NAMESPACE = "landing.valueProposition" as const;

export type PillarId = "learn" | "practice" | "apply" | "progress";

export interface ValuePillar {
  /** Stable identifier (React key, analytics, anchors). */
  readonly id: PillarId;
  /** 1-based position in the loop; also drives display order + indentation. */
  readonly order: number;
  /** One icon per stage. */
  readonly icon: IconType;
  /** Short stage name. */
  readonly labelKey: string;
  /** Card headline. */
  readonly titleKey: string;
  /** Card body copy. */
  readonly descriptionKey: string;
  /** What this stage looks like inside the example lesson. */
  readonly exampleKey: string;
  /** "accent" is reserved for the destination of the loop (Progress). */
  readonly tone: "default" | "accent";
}

/** Ordered pillars. `as const` + readonly keeps the sequence immutable. */
export const VALUE_PILLARS: readonly ValuePillar[] = [
  {
    id: "learn",
    order: 1,
    icon: LuBookOpenText,
    labelKey: "pillars.learn.label",
    titleKey: "pillars.learn.title",
    descriptionKey: "pillars.learn.description",
    exampleKey: "pillars.learn.example",
    tone: "default",
  },
  {
    id: "practice",
    order: 2,
    icon: LuTerminal,
    labelKey: "pillars.practice.label",
    titleKey: "pillars.practice.title",
    descriptionKey: "pillars.practice.description",
    exampleKey: "pillars.practice.example",
    tone: "default",
  },
  {
    id: "apply",
    order: 3,
    icon: LuHammer,
    labelKey: "pillars.apply.label",
    titleKey: "pillars.apply.title",
    descriptionKey: "pillars.apply.description",
    exampleKey: "pillars.apply.example",
    tone: "default",
  },
  {
    id: "progress",
    order: 4,
    icon: LuTrendingUp,
    labelKey: "pillars.progress.label",
    titleKey: "pillars.progress.title",
    descriptionKey: "pillars.progress.description",
    exampleKey: "pillars.progress.example",
    tone: "accent",
  },
] as const;

/** Section-level translation keys. */
export const VALUE_SECTION_KEYS = {
  heading: "heading",
  intro: "intro",
  note: "note",
  exampleLabel: "exampleLabel",
  exampleTitle: "exampleTitle",
  exampleLead: "exampleLead",
} as const;