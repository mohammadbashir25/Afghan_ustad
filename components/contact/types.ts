/**
 * Contact page — types
 * ---------------------------------------------------------------------------
 * Contact details are optional where they are not yet verified; components
 * render a row only when its data exists.
 */

export type Locale = "en" | "fa" | "ps";
export type LocalizedText = Record<Locale, string>;

export interface ContactInfo {
  readonly phone: { readonly display: string; readonly tel: string };
  readonly email: { readonly address: string };
  /** Add only a VERIFIED address. Hidden while undefined. */
  readonly address?: LocalizedText;
  /** Add only VERIFIED opening hours. Hidden while undefined. */
  readonly hours?: LocalizedText;
}

export type SubjectId = "courses" | "enrollment" | "skillCenter" | "other";
export type FieldName = "name" | "contact" | "subject" | "message";

export interface ContactFormValues {
  name: string;
  contact: string;
  /** "" until the visitor picks one. */
  subject: SubjectId | "";
  message: string;
}

export type FormStatus = "idle" | "submitting" | "success" | "error";

/** Keys under `form.errors.*` in the messages. */
export type FieldErrorKey =
  | "required"
  | "nameShort"
  | "contactInvalid"
  | "messageShort"
  | "messageLong";

export type FieldErrors = Partial<Record<FieldName, FieldErrorKey>>;

/**
 * Submit contract. Connect your API by passing a function with this shape to
 * <ContactForm onSubmit={…} />. Reject (throw) to show the error state.
 */
export type ContactSubmitHandler = (values: ContactFormValues) => Promise<void>;
