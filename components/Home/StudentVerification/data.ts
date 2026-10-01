/**
 * data.ts
 * ---------------------------------------------------------------------------
 * Configuration + contracts for the Student Verification section.
 *
 * Two jobs live here, kept free of JSX:
 *
 * 1. THE API CONTRACT. `VerifyHandler` is the single seam between this UI and
 *    a future backend. The section never fetches anything itself: connect a
 *    real API by passing `onVerify` to <StudentVerification />. Until then the
 *    form honestly reports that verification is not connected.
 *
 * 2. PRESENTATION CONFIG. Steps, trust cues, search modes, result styling
 *    and result fields are data, so copy keys / icons / tones can change
 *    without touching components.
 *
 * No visible copy is stored here: every `...Key` is a next-intl key under the
 * `landing.verification` namespace. No student data is stored or invented.
 */
import type { IconType } from "react-icons";
import {
  LuBadgeCheck,
  LuBookOpen,
  LuCalendarCheck,
  LuFileSearch,
  LuHash,
  LuKeyboard,
  LuLanguages,
  LuLock,
  LuSearchX,
  LuShieldCheck,
  LuTriangleAlert,
  LuUser,
} from "react-icons/lu";

/* ------------------------------ API contract ------------------------------ */

/** How the visitor is searching. */
export type VerificationMode = "id" | "name";

/** What the form hands to the API layer. Value is trimmed, never empty. */
export interface VerificationQuery {
  readonly mode: VerificationMode;
  readonly value: string;
}

/**
 * Fields a backend MAY return for a verified record. Only `studentName` is
 * required; every other field renders only when present.
 */
export interface VerifiedRecord {
  readonly studentName: string;
  readonly verificationId?: string;
  readonly courseTitle?: string;
  readonly issuedOn?: string;
}

/** What a successful API call resolves to. */
export type VerificationOutcome =
  | { readonly status: "verified"; readonly record: VerifiedRecord }
  | { readonly status: "not_found" };

/**
 * The one function a future API must provide.
 * - Resolve with an outcome for "verified" and "not found".
 * - REJECT (throw) for network/server failures: that becomes the error state.
 * - `signal` is aborted when the visitor re-submits, resets or leaves, so the
 *   implementation can pass it straight to `fetch`.
 */
export type VerifyHandler = (
  query: VerificationQuery,
  signal: AbortSignal,
) => Promise<VerificationOutcome>;

/** Every state the section can be in. */
export type VerificationState =
  | { readonly phase: "idle" }
  | { readonly phase: "submitting"; readonly query: VerificationQuery }
  | { readonly phase: "verified"; readonly query: VerificationQuery; readonly record: VerifiedRecord }
  | { readonly phase: "not_found"; readonly query: VerificationQuery }
  | { readonly phase: "error"; readonly query: VerificationQuery };

/** States that render in the result panel (everything except idle). */
export type ActiveVerificationState = Exclude<VerificationState, { phase: "idle" }>;

/* -------------------------------- Routing --------------------------------- */

/** Dedicated verification page (rendered through next-intl's localized Link). */
export const VERIFY_PAGE_HREF = "/verify" as const;

/* ------------------------------- Form config ------------------------------ */

/** Client-side sanity limits only; the real rules belong to the API. */
export const MIN_QUERY_LENGTH: Readonly<Record<VerificationMode, number>> = {
  id: 3,
  name: 2,
};
export const MAX_QUERY_LENGTH = 120 as const;

type ModeLabelKey = "form.modes.id" | "form.modes.name";
type FieldKey =
  | "form.fields.id.label"
  | "form.fields.id.placeholder"
  | "form.fields.id.helper"
  | "form.fields.name.label"
  | "form.fields.name.placeholder"
  | "form.fields.name.helper";

export interface ModeConfig {
  readonly id: VerificationMode;
  readonly icon: IconType;
  readonly tabKey: ModeLabelKey;
  readonly labelKey: FieldKey;
  readonly placeholderKey: FieldKey;
  readonly helperKey: FieldKey;
}

/** The two ways to search. Add a mode here and the form renders it. */
export const MODES: readonly ModeConfig[] = [
  {
    id: "id",
    icon: LuHash,
    tabKey: "form.modes.id",
    labelKey: "form.fields.id.label",
    placeholderKey: "form.fields.id.placeholder",
    helperKey: "form.fields.id.helper",
  },
  {
    id: "name",
    icon: LuUser,
    tabKey: "form.modes.name",
    labelKey: "form.fields.name.label",
    placeholderKey: "form.fields.name.placeholder",
    helperKey: "form.fields.name.helper",
  },
] as const;

/* ---------------------------- Explanatory content ------------------------- */

type StepKey = "steps.enter" | "steps.check" | "steps.result";

export interface VerificationStep {
  readonly id: "enter" | "check" | "result";
  readonly icon: IconType;
  /** Translation key prefix; `.title` and `.description` are appended. */
  readonly key: StepKey;
}

/** The three-step explanation of the process. */
export const STEPS: readonly VerificationStep[] = [
  { id: "enter", icon: LuKeyboard, key: "steps.enter" },
  { id: "check", icon: LuFileSearch, key: "steps.check" },
  { id: "result", icon: LuBadgeCheck, key: "steps.result" },
] as const;

export interface TrustCue {
  readonly id: "lookup" | "language" | "privacy";
  readonly icon: IconType;
  readonly labelKey: "trust.lookup" | "trust.language" | "trust.privacy";
}

/** Short trust signals shown under the explanation. */
export const TRUST_CUES: readonly TrustCue[] = [
  { id: "lookup", icon: LuShieldCheck, labelKey: "trust.lookup" },
  { id: "language", icon: LuLanguages, labelKey: "trust.language" },
  { id: "privacy", icon: LuLock, labelKey: "trust.privacy" },
] as const;

/* ---------------------------- Result presentation ------------------------- */

/** The three terminal outcomes (idle and submitting have no result card). */
export type ResultKind = "verified" | "not_found" | "error";

export type ResultTone = "success" | "neutral" | "danger";

export interface ResultPresentation {
  readonly icon: IconType;
  readonly tone: ResultTone;
  readonly titleKey: `result.${"verified" | "notFound" | "error"}.title`;
  readonly descriptionKey: `result.${"verified" | "notFound" | "error"}.description`;
}

/** Icon, tone and copy keys per outcome. */
export const RESULT_PRESENTATION: Readonly<Record<ResultKind, ResultPresentation>> = {
  verified: {
    icon: LuBadgeCheck,
    tone: "success",
    titleKey: "result.verified.title",
    descriptionKey: "result.verified.description",
  },
  not_found: {
    icon: LuSearchX,
    tone: "neutral",
    titleKey: "result.notFound.title",
    descriptionKey: "result.notFound.description",
  },
  error: {
    icon: LuTriangleAlert,
    tone: "danger",
    titleKey: "result.error.title",
    descriptionKey: "result.error.description",
  },
} as const;

/** Tailwind classes per tone, using theme tokens only. */
export const TONE_STYLES: Readonly<
  Record<ResultTone, { readonly badge: string; readonly panel: string }>
> = {
  success: {
    badge: "bg-primary text-surface",
    panel: "border-primary/25 bg-primary-light",
  },
  neutral: {
    badge: "bg-accent text-primary-dark",
    panel: "border-accent/50 bg-accent-light",
  },
  danger: {
    badge: "bg-error text-surface",
    panel: "border-error/30 bg-error/5",
  },
} as const;

type FieldLabelKey =
  | "result.fields.studentName"
  | "result.fields.verificationId"
  | "result.fields.courseTitle"
  | "result.fields.issuedOn";

export interface VerifiedFieldConfig {
  readonly id: keyof VerifiedRecord;
  readonly icon: IconType;
  readonly labelKey: FieldLabelKey;
}

/** Rows of the verified record, in display order. Missing values are skipped. */
export const VERIFIED_FIELDS: readonly VerifiedFieldConfig[] = [
  { id: "studentName", icon: LuUser, labelKey: "result.fields.studentName" },
  { id: "verificationId", icon: LuHash, labelKey: "result.fields.verificationId" },
  { id: "courseTitle", icon: LuBookOpen, labelKey: "result.fields.courseTitle" },
  { id: "issuedOn", icon: LuCalendarCheck, labelKey: "result.fields.issuedOn" },
] as const;

/** Suggestions listed in the "not found" state. */
export const NOT_FOUND_TIP_KEYS = ["result.tips.spelling", "result.tips.otherMode"] as const;
