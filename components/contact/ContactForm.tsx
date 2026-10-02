"use client";

/**
 * ContactForm
 * ---------------------------------------------------------------------------
 * Complete front-end form, no backend.
 *
 * State machine:  idle → submitting → success | error  (error → submitting …)
 *  - Validation: on blur (once a field was touched) and on submit. On a failed
 *    submit focus jumps to the first invalid field.
 *  - Accessibility: real <label>s, aria-invalid, aria-describedby pointing at
 *    hint/error text, errors announced via aria-live, native keyboard order,
 *    visible focus rings, `noValidate` so OUR translated messages are used.
 *  - Connect an API with the `onSubmit` prop (see ContactSubmitHandler).
 *  - Success replaces the form (AnimatePresence, mode="wait") and receives
 *    focus so screen-reader users hear it. Error keeps every typed value and
 *    shows a banner above the form.
 *  - RTL: contact field is dir="ltr" (emails / digits); everything else is
 *    dir="auto"; layout uses logical CSS properties.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LuCheck, LuTriangleAlert } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { useFormatNumber } from "@/components/shared/format-number";
import { CONTACT_NAMESPACE, SUBJECT_IDS } from "./data";
import { submitContactMessage } from "./submit";
import { FIELD_ORDER, LIMITS, validateAll, validateField } from "./validation";
import type {
  ContactFormValues,
  ContactSubmitHandler,
  FieldErrors,
  FieldName,
  FormStatus,
} from "./types";
import s from "./contact.module.css";

const EMPTY: ContactFormValues = { name: "", contact: "", subject: "", message: "" };

interface FieldProps {
  readonly name: FieldName;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  /** Receives the accessibility props to spread on the control. */
  readonly children: (a11y: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
    "aria-required": boolean;
  }) => ReactNode;
}

/** Label + control + hint/error wiring, shared by all four fields. */
function Field({ name, label, hint, error, children }: FieldProps) {
  const id = `contact-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy, "aria-required": true })}
      {hint && !error && (
        <p id={hintId} className={s.hint}>
          {hint}
        </p>
      )}
      {/* aria-live so the message is announced when it appears */}
      <div aria-live="polite">
        {error && (
          <motion.p
            id={errorId}
            className={s.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}

export function ContactForm({ onSubmit = submitContactMessage }: { readonly onSubmit?: ContactSubmitHandler }) {
  const t = useTranslations(CONTACT_NAMESPACE);
  const formatNumber = useFormatNumber();
  const reduce = useReducedMotion();

  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const successRef = useRef<HTMLDivElement>(null);

  // Move focus to the success message so it is announced.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  /** Translated message for a field's current error key. */
  const message = (field: FieldName): string | undefined => {
    const key = errors[field];
    return key
      ? t(`form.errors.${key}`, {
          min: formatNumber(key === "nameShort" ? LIMITS.nameMin : LIMITS.messageMin),
          max: formatNumber(LIMITS.messageMax),
        })
      : undefined;
  };

  const update =
    (field: FieldName) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const next = { ...values, [field]: e.target.value } as ContactFormValues;
      setValues(next);
      // Re-validate live only after the field has been touched.
      if (touched[field]) setErrors((prev) => ({ ...prev, [field]: validateField(field, next) }));
    };

  const blur = (field: FieldName) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;

    const found = validateAll(values);
    setErrors(found);
    setTouched({ name: true, contact: true, subject: true, message: true });

    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      await onSubmit(values);
      setStatus("success");
      setValues(EMPTY);
      setTouched({});
    } catch {
      setStatus("error"); // values are kept so nothing has to be retyped
    }
  };

  const messageLength = values.message.length;
  const pop = reduce ? { opacity: 0 } : { opacity: 0, y: 14 };

  return (
    <div className={s.formPanel}>
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" ? (
          <motion.div
            key="success"
            ref={successRef}
            tabIndex={-1}
            className={s.success}
            initial={pop}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={s.successIcon}>
              <LuCheck aria-hidden="true" />
            </span>
            <h2 className={s.formTitle}>{t("form.success.title")}</h2>
            <p className={s.formDescription}>{t("form.success.text")}</p>
            <Button variant="outline" size="md" onClick={() => setStatus("idle")}>
              {t("form.success.again")}
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={handleSubmit}
            initial={pop}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className={s.formTitle}>{t("form.title")}</h2>
            <p className={s.formDescription}>{t("form.description")}</p>

            {/* Error banner: designed state, keeps the form filled in */}
            <AnimatePresence>
              {status === "error" && (
                <motion.div
                  role="alert"
                  className={s.alert}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <LuTriangleAlert aria-hidden="true" />
                  <div>
                    <strong>{t("form.error.title")}</strong>
                    <p>{t("form.error.text")}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={s.fields}>
              <Field name="name" label={t("form.fields.name.label")} error={message("name")}>
                {(a11y) => (
                  <input
                    {...a11y}
                    type="text"
                    name="name"
                    dir="auto"
                    autoComplete="name"
                    className={s.input}
                    placeholder={t("form.fields.name.placeholder")}
                    value={values.name}
                    onChange={update("name")}
                    onBlur={blur("name")}
                  />
                )}
              </Field>

              <Field
                name="contact"
                label={t("form.fields.contact.label")}
                hint={t("form.fields.contact.hint")}
                error={message("contact")}
              >
                {(a11y) => (
                  <input
                    {...a11y}
                    type="text"
                    name="contact"
                    dir="ltr"
                    inputMode="email"
                    autoComplete="email"
                    className={`${s.input} ${s.inputLtr}`}
                    placeholder={t("form.fields.contact.placeholder")}
                    value={values.contact}
                    onChange={update("contact")}
                    onBlur={blur("contact")}
                  />
                )}
              </Field>

              <Field name="subject" label={t("form.fields.subject.label")} error={message("subject")}>
                {(a11y) => (
                  <select
                    {...a11y}
                    name="subject"
                    className={`${s.input} ${s.select}`}
                    value={values.subject}
                    onChange={update("subject")}
                    onBlur={blur("subject")}
                  >
                    <option value="">{t("form.fields.subject.placeholder")}</option>
                    {SUBJECT_IDS.map((id) => (
                      <option key={id} value={id}>
                        {t(`form.subjects.${id}`)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field name="message" label={t("form.fields.message.label")} error={message("message")}>
                {(a11y) => (
                  <>
                    <textarea
                      {...a11y}
                      name="message"
                      dir="auto"
                      rows={6}
                      className={`${s.input} ${s.textarea}`}
                      placeholder={t("form.fields.message.placeholder")}
                      value={values.message}
                      onChange={update("message")}
                      onBlur={blur("message")}
                    />
                    <p className={s.counter}>
                      {t("form.counter", {
                        count: formatNumber(messageLength),
                        max: formatNumber(LIMITS.messageMax),
                      })}
                    </p>
                  </>
                )}
              </Field>
            </div>

            {/* Button defaults to a submit button inside a form */}
            <Button variant="primary" size="lg" loading={status === "submitting"}>
              {status === "submitting" ? t("form.submitting") : t("form.submit")}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
