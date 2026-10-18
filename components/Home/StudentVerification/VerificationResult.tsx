"use client";

/**
 * VerificationResult
 * ---------------------------------------------------------------------------
 * Role: renders every non-idle state of the check in one place:
 *   submitting -> a quiet progress panel (indeterminate bar)
 *   verified   -> record details, only the fields the API actually returned
 *   not_found  -> neutral explanation + two practical tips
 *   error      -> calm failure message with a retry
 *
 * It is purely presentational: it receives the state and two callbacks
 * (`onReset`, `onRetry`) and owns no data logic. Icon, tone and copy keys per
 * outcome come from RESULT_PRESENTATION in data.ts.
 *
 * Interaction decisions
 * - Announced to assistive tech: `role="status"` (polite) for normal results,
 *   `role="alert"` for errors.
 * - Motion is intentionally small: the badge springs in, the error badge gives
 *   one gentle nudge (not a shake loop), details fade in. All of it collapses
 *   to near-instant when the visitor prefers reduced motion.
 * - Values from the record use `dir="auto"` so Arabic-script and Latin text
 *   never get mangled inside an RTL layout.
 * - Nothing here fabricates data: if a field is missing it is skipped.
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LuRotateCcw } from "react-icons/lu";
import { useTranslations } from "next-intl";

import {
  NOT_FOUND_TIP_KEYS,
  RESULT_PRESENTATION,
  TONE_STYLES,
  VERIFIED_FIELDS,
  type ActiveVerificationState,
  type VerifiedRecord,
} from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

interface VerificationResultProps {
  readonly state: ActiveVerificationState;
  /** Clear the result and return to the empty form. */
  readonly onReset: () => void;
  /** Re-run the last query (used by the error state). */
  readonly onRetry: () => void;
}

export default function VerificationResult({
  state,
  onReset,
  onRetry,
}: VerificationResultProps): React.JSX.Element {
  const t = useTranslations("landing.verification");
  const prefersReducedMotion = useReducedMotion();

  /** Details fade in one after another, a short beat after the badge. */
  const list: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.07,
        delayChildren: prefersReducedMotion ? 0 : 0.18,
      },
    },
  };
  const row: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.4, ease: EASE },
    },
  };

  /* ------------------------------- Submitting ------------------------------ */
  if (state.phase === "submitting") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-border bg-surface-muted p-5 text-start"
      >
        <p className="text-sm font-semibold text-foreground">{t("result.checking")}</p>
        {/* Indeterminate bar: scales from the reading-start edge. */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full origin-left rounded-full bg-primary rtl:origin-right"
            initial={{ scaleX: 0.15 }}
            animate={prefersReducedMotion ? { scaleX: 0.6 } : { scaleX: [0.15, 1, 0.15] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  /* ----------------------------- Terminal outcomes -------------------------- */
  const presentation = RESULT_PRESENTATION[state.phase];
  const tone = TONE_STYLES[presentation.tone];
  const Icon = presentation.icon;
  const isError = state.phase === "error";

  return (
    <motion.div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      variants={list}
      initial="hidden"
      animate="visible"
      className={`rounded-2xl border p-5 text-start sm:p-6 ${tone.panel}`}
    >
      {/* Badge + title */}
      <div className="flex items-start gap-4">
        <motion.span
          aria-hidden="true"
          initial={{ scale: prefersReducedMotion ? 1 : 0.6, opacity: 0 }}
          animate={
            // The error badge gets one soft nudge; others simply spring in.
            isError && !prefersReducedMotion
              ? { scale: 1, opacity: 1, x: [0, -4, 4, -2, 0] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            isError
              ? { duration: 0.5, ease: EASE }
              : { type: "spring", stiffness: 380, damping: 20 }
          }
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone.badge}`}
        >
          <Icon className="size-6" />
        </motion.span>

        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-[1.6] text-primary-dark">
            {t(presentation.titleKey)}
          </h3>
          <p className="mt-1 text-sm leading-[1.9] text-foreground/80">
            {state.phase === "not_found"
              ? t("result.notFound.description", { query: state.query.value })
              : t(presentation.descriptionKey)}
          </p>
        </div>
      </div>

      {/* Verified: only fields that exist on the record are shown. */}
      {state.phase === "verified" ? <RecordDetails record={state.record} rowVariants={row} /> : null}

      {/* Not found: practical next steps. */}
      {state.phase === "not_found" ? (
        <motion.ul variants={row} className="mt-4 space-y-2 text-sm leading-[1.9] text-foreground/80">
          {NOT_FOUND_TIP_KEYS.map((key) => (
            <li key={key} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary-dark" />
              {t(key)}
            </li>
          ))}
        </motion.ul>
      ) : null}

      {/* Actions */}
      <motion.div variants={row} className="mt-5 flex flex-wrap gap-3">
        {isError ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-surface transition-colors hover:bg-primary-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <LuRotateCcw aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            {t("result.actions.retry")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-surface px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {state.phase === "verified" ? t("result.actions.another") : t("result.actions.edit")}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ Record details ----------------------------- */

interface RecordDetailsProps {
  readonly record: VerifiedRecord;
  readonly rowVariants: Variants;
}

/**
 * RecordDetails
 * Data-driven definition list. VERIFIED_FIELDS decides order and labels; a
 * row renders only when the record has a non-empty value for it.
 */
function RecordDetails({ record, rowVariants }: RecordDetailsProps): React.JSX.Element {
  const t = useTranslations("landing.verification");

  return (
    <dl className="mt-5 divide-y divide-primary/15 rounded-xl bg-surface px-4">
      {VERIFIED_FIELDS.map(({ id, icon: Icon, labelKey }) => {
        const value = record[id];
        if (value === undefined || value.trim().length === 0) return null;
        return (
          <motion.div key={id} variants={rowVariants} className="flex items-start gap-3 py-3">
            <Icon aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-text-secondary">{t(labelKey)}</dt>
              <dd dir="auto" className="mt-0.5 break-words text-base font-bold text-foreground">
                {value}
              </dd>
            </div>
          </motion.div>
        );
      })}
    </dl>
  );
}
