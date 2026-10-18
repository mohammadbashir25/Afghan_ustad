/**
 * Contact form validation (pure functions, no dependencies).
 * ---------------------------------------------------------------------------
 * Returns error KEYS, not text, so messages stay translated in next-intl.
 * Persian / Arabic-Indic digits are normalised before checking phone numbers.
 * To switch to Zod / React Hook Form later, keep `ContactFormValues` and
 * `FieldErrors` as the contract.
 */
import type { ContactFormValues, FieldErrorKey, FieldErrors, FieldName } from "./types";

export const LIMITS = { nameMin: 2, messageMin: 10, messageMax: 1000 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** ۰-۹ and ٠-٩ → 0-9 */
function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function isPhone(value: string): boolean {
  const digits = normalizeDigits(value).replace(/[\s()\-+.]/g, "");
  return /^\d{7,15}$/.test(digits);
}

export function validateField(name: FieldName, values: ContactFormValues): FieldErrorKey | undefined {
  const value = values[name].trim();

  switch (name) {
    case "name":
      if (!value) return "required";
      return value.length < LIMITS.nameMin ? "nameShort" : undefined;
    case "contact":
      if (!value) return "required";
      return EMAIL.test(value) || isPhone(value) ? undefined : "contactInvalid";
    case "subject":
      return value ? undefined : "required";
    case "message":
      if (!value) return "required";
      if (value.length < LIMITS.messageMin) return "messageShort";
      return value.length > LIMITS.messageMax ? "messageLong" : undefined;
  }
}

export const FIELD_ORDER: readonly FieldName[] = ["name", "contact", "subject", "message"];

export function validateAll(values: ContactFormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELD_ORDER) {
    const error = validateField(field, values);
    if (error) errors[field] = error;
  }
  return errors;
}
