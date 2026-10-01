"use client";

/**
 * VerificationForm
 * ---------------------------------------------------------------------------
 * Role: the input half of the card. It collects ONE query (ID or name),
 * validates it locally, and hands it to the parent through `onSubmit`.
 * It knows nothing about APIs, results or the network.
 *
 * Local state
 * - `mode`    which field is active (data-driven from MODES)
 * - `value`   the current text (kept per mode so switching doesn't lose it)
 * - `errorKey` validation message key; only shown after a submit attempt and
 *             cleared as soon as the visitor edits
 * - `isFocused` drives the focus-ring animation
 *
 * Interaction decisions
 * - Segmented control uses role="radiogroup"; arrow keys toggle in either
 *   direction, so it behaves the same in LTR and RTL.
 * - Editing after a result calls `onEdit` so the parent clears stale results.
 * - When no API is connected (`isAvailable=false`) the form stays usable for
 *   typing but the submit button is disabled and a clear notice explains why:
 *   the UI never implies a live check that cannot happen.
 * - Inputs use `dir="auto"` so Latin IDs and Arabic-script names both render
 *   correctly inside an RTL page.
 */
import { useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import { motion, useReducedMotion } from "framer-motion";
import { LuArrowRight, LuInfo, LuLoaderCircle } from "react-icons/lu";
import { useTranslations } from "next-intl";

import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  MODES,
  VERIFY_PAGE_HREF,
  type VerificationMode,
  type VerificationQuery,
} from "./data";

interface VerificationFormProps {
  /** True when a real `onVerify` handler is connected. */
  readonly isAvailable: boolean;
  /** True while a request is in flight; locks the controls. */
  readonly isSubmitting: boolean;
  /** Receives a validated, trimmed query. */
  readonly onSubmit: (query: VerificationQuery) => void;
  /** Fired when the visitor changes the mode or the text. */
  readonly onEdit: () => void;
  /** Where the "unavailable" notice sends the visitor. */
  readonly verifyHref?: string;
}

type ValidationKey = "form.errors.required" | "form.errors.tooShort";

export default function VerificationForm({
  isAvailable,
  isSubmitting,
  onSubmit,
  onEdit,
  verifyHref = VERIFY_PAGE_HREF,
}: VerificationFormProps): React.JSX.Element {
  const t = useTranslations("landing.verification");
  const prefersReducedMotion = useReducedMotion();

  const [mode, setMode] = useState<VerificationMode>("id");
  const [values, setValues] = useState<Readonly<Record<VerificationMode, string>>>({
    id: "",
    name: "",
  });
  const [errorKey, setErrorKey] = useState<ValidationKey | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const inputId = `${uid}-input`;
  const helperId = `${uid}-helper`;
  const errorId = `${uid}-error`;
  const pillId = `${uid}-pill`;

  const activeMode = MODES.find((candidate) => candidate.id === mode) ?? MODES[0];
  const value = values[mode];
  const ActiveIcon = activeMode.icon;
  const minLength = MIN_QUERY_LENGTH[mode];

  /** Switch search type and put the cursor straight into the field. */
  const changeMode = (next: VerificationMode): void => {
    if (next === mode) return;
    setMode(next);
    setErrorKey(null);
    onEdit();
    // Wait a tick so the input exists with its new label before focusing.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  /** Arrow keys toggle between the two modes (direction-agnostic). */
  const handleRadioKey = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      changeMode(mode === "id" ? "name" : "id");
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setValues((previous) => ({ ...previous, [mode]: event.target.value }));
    if (errorKey) setErrorKey(null);
    onEdit();
  };

  /** Validate locally, then delegate. The API decides the real outcome. */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!isAvailable || isSubmitting) return;

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setErrorKey("form.errors.required");
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length < minLength) {
      setErrorKey("form.errors.tooShort");
      inputRef.current?.focus();
      return;
    }
    onSubmit({ mode, value: trimmed });
  };

  const canSubmit = isAvailable && !isSubmitting;

  return (
    <form onSubmit={handleSubmit} noValidate className="text-start">
      {/* Mode switch: one pill glides under the active option. */}
      <div
        role="radiogroup"
        aria-label={t("form.modeLabel")}
        className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1"
      >
        {MODES.map((option) => {
          const isActive = option.id === mode;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={isSubmitting}
              onClick={() => changeMode(option.id)}
              onKeyDown={handleRadioKey}
              className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${
                isActive ? "text-primary-dark" : "text-text-secondary hover:text-foreground"
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId={pillId}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-surface shadow-[0_6px_16px_-8px_rgba(5,59,46,0.45)]"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 36 }
                  }
                />
              ) : null}
              <span className="relative flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4" />
                {t(option.tabKey)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Field */}
      <label htmlFor={inputId} className="mt-6 block text-sm font-bold text-foreground">
        {t(activeMode.labelKey)}
      </label>

      <motion.div
        // Focus feedback: a soft green halo that eases in and out.
        animate={{
          boxShadow: isFocused
            ? "0 0 0 4px rgba(11,107,79,0.16)"
            : "0 0 0 0px rgba(11,107,79,0)",
        }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className={`mt-2 flex items-center gap-3 rounded-2xl border bg-surface px-4 transition-colors duration-200 ${
          errorKey ? "border-error" : isFocused ? "border-primary" : "border-border"
        }`}
      >
        <ActiveIcon
          aria-hidden="true"
          className={`size-5 shrink-0 transition-colors duration-200 ${
            isFocused ? "text-primary" : "text-text-muted"
          }`}
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          dir="auto"
          value={value}
          maxLength={MAX_QUERY_LENGTH}
          disabled={isSubmitting}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t(activeMode.placeholderKey)}
          aria-invalid={errorKey ? true : undefined}
          aria-describedby={errorKey ? `${helperId} ${errorId}` : helperId}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-60"
        />
      </motion.div>

      <p id={helperId} className="mt-2 text-sm leading-[1.9] text-text-secondary">
        {t(activeMode.helperKey)}
      </p>

      {/* Validation message: slides in rather than popping. */}
      {errorKey ? (
        <motion.p
          id={errorId}
          role="alert"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm font-semibold text-error"
        >
          {errorKey === "form.errors.tooShort"
            ? t("form.errors.tooShort", { min: minLength })
            : t("form.errors.required")}
        </motion.p>
      ) : null}

      {/* Honest availability notice: shown only when no API is connected. */}
      {!isAvailable ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-accent/50 bg-accent-light p-4">
          <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-dark" />
          <div className="text-sm leading-[1.9] text-primary-dark">
            <p className="font-bold">{t("form.unavailable.title")}</p>
            <p>{t("form.unavailable.description")}</p>
            <Link
              href={verifyHref}
              className="group mt-1 inline-flex items-center gap-1.5 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("cta.page")}
              <LuArrowRight
                aria-hidden="true"
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Submit: spinner swaps in while the request is in flight. */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-base font-bold text-surface shadow-[0_14px_30px_-14px_rgba(11,107,79,0.8)] transition-[background-color,transform,opacity] duration-200 hover:bg-primary-dark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-primary"
      >
        {isSubmitting ? (
          <>
            <motion.span
              aria-hidden="true"
              animate={prefersReducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="flex"
            >
              <LuLoaderCircle className="size-5" />
            </motion.span>
            {t("form.submitting")}
          </>
        ) : (
          t("form.submit")
        )}
      </button>
    </form>
  );
}
