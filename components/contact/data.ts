/**
 * Contact page — data layer
 * ---------------------------------------------------------------------------
 * Edit contact details HERE only. Components read from this file.
 */
import type { ContactInfo, SubjectId } from "./types";

export const CONTACT_NAMESPACE = "contactPage" as const;

/**
 * Verified details only.
 * NOTE: a second number (0779775725) was supplied earlier but its purpose is
 * not labelled, so it is intentionally NOT shown. If it is, e.g., a WhatsApp
 * or admissions line, add it as a labelled field in ContactInfo first.
 * No address, hours, social links or WhatsApp URL are shown until verified.
 */
export const CONTACT: ContactInfo = {
  phone: { display: "+93 78 825 8920", tel: "+93788258920" },
  email: { address: "info@afghanustad.com" },
};

/** Locale-free routes; the shared Button adds the locale prefix. */
export const CONTACT_ROUTES = {
  courses: "/courses",
  skillCenter: "/skill-center",
} as const;

/** Options of the Subject field (labels: `form.subjects.<id>`). */
export const SUBJECT_IDS: readonly SubjectId[] = [
  "courses",
  "enrollment",
  "skillCenter",
  "other",
];
