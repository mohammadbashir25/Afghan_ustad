/**
 * data.ts
 * ---------------------------------------------------------------------------
 * Single source of truth for the About AfghanUstad section.
 *
 * - NO visible copy lives here. Every user-facing string is a next-intl key
 *   (namespace: `landing.about`). This file only holds structure, icons,
 *   identifiers and client-supplied facts.
 * - Anything the client has not verified is `CLIENT_INPUT_REQUIRED`.
 *   The UI silently hides placeholder values (see `isProvided`), so an
 *   unverified fact can never leak onto the public page.
 */
import type { IconType } from "react-icons";
import {
  LuBookOpenCheck,
  LuHammer,
  LuLanguages,
  LuLightbulb,
  LuSprout,
} from "react-icons/lu"; // Lucide-style glyphs, served through react-icons

/** Marker for facts the client must supply and verify. */
export const CLIENT_INPUT_REQUIRED = "[CLIENT INPUT REQUIRED]" as const;

/** True when a client-supplied value is real (not the placeholder marker). */
export const isProvided = (value: string): boolean =>
  value !== CLIENT_INPUT_REQUIRED && value.trim().length > 0;

/** Locales whose script is right-to-left. */
const RTL_LOCALES: readonly string[] = ["fa", "ps"];

/** Locale -> writing direction. Used for motion offsets and mixed-script rows. */
export const isRtlLocale = (locale: string): boolean =>
  RTL_LOCALES.includes(locale);

/* ------------------------------ Principles ------------------------------ */

export type PrincipleId = "language" | "understanding" | "practice" | "everyone";

export interface AboutPrinciple {
  /** Used to build translation keys: `principles.<id>.title|description` */
  readonly id: PrincipleId;
  readonly icon: IconType;
}

/** Four beliefs that describe the teaching philosophy (not a sequence). */
export const ABOUT_PRINCIPLES: readonly AboutPrinciple[] = [
  { id: "language", icon: LuLanguages },
  { id: "understanding", icon: LuLightbulb },
  { id: "practice", icon: LuHammer },
  { id: "everyone", icon: LuSprout },
] as const;

/* ------------------------------- Languages ------------------------------ */

export type SupportedLocale = "en" | "fa" | "ps";

export interface AboutLanguage {
  readonly code: SupportedLocale;
  /**
   * Endonym: a language's name in its own script. Intentionally NOT
   * translated, so each language is always recognisable to its speakers.
   */
  readonly endonym: string;
  readonly dir: "ltr" | "rtl";
}

/** Rows shown in the "one lesson, three languages" card. */
export const ABOUT_LANGUAGES: readonly AboutLanguage[] = [
  { code: "en", endonym: "English", dir: "ltr" },
  { code: "fa", endonym: "دری", dir: "rtl" },
  { code: "ps", endonym: "پښتو", dir: "rtl" },
] as const;

/* ----------------------------- Client inputs ---------------------------- */

/** Optional real photograph of the learning environment. */
export const ABOUT_IMAGE = {
  src: CLIENT_INPUT_REQUIRED as string,
  width: 960,
  height: 1200,
} as const;

export type AboutFactId = "founded" | "location";

export interface AboutFact {
  readonly id: AboutFactId;
  /** Verified value, or CLIENT_INPUT_REQUIRED (hidden in the UI). */
  readonly value: string;
}

/** Secondary facts for the image caption strip. Never invent these. */
export const ABOUT_FACTS: readonly AboutFact[] = [
  { id: "founded", value: CLIENT_INPUT_REQUIRED },
  { id: "location", value: CLIENT_INPUT_REQUIRED },
] as const;

/* --------------------------------- Links -------------------------------- */

/** Locale-agnostic path; rendered through next-intl's localized `Link`. */
export const ABOUT_CTA_HREF = "/about" as const;

/** Icon for the small leading badge on the visual. */
export const ABOUT_BADGE_ICON: IconType = LuBookOpenCheck;