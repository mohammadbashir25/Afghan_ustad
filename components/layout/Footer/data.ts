/**
 * Footer configuration. Link groups, contact details, social links and legal
 * links all live here, so updating content never requires touching JSX.
 *
 * CONTENT RULE
 *  Nothing below is invented. Anything the client has not supplied is either
 *  `CLIENT_INPUT_REQUIRED` (contact values) or `null` (social URLs, legal
 *  routes, unconfirmed pages). The components behave like this:
 *   - contact value === CLIENT_INPUT_REQUIRED → the placeholder text is shown, unlinked
 *   - social `url: null`                      → that icon is not rendered
 *   - legal / page `href: null`               → that link is not rendered
 *  To go live, replace the placeholder / null with the real value. When this
 *  data later comes from a CMS, keep these types and map the CMS fields onto them.
 */

import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaTelegram, FaWhatsapp, FaYoutube } from "react-icons/fa6";
import { LuClock, LuMail, LuMapPin, LuPhone } from "react-icons/lu";

import { NAV_ITEMS, type NavLabelKey } from "../Navbar/data";

/** Marker for information that has not been supplied yet. */
export const CLIENT_INPUT_REQUIRED = "[CLIENT INPUT REQUIRED]";

/**
 * Year shown in the copyright line. Evaluated once at build/server start, so it
 * needs no `new Date()` during render; it refreshes on each deploy.
 */
export const FOOTER_YEAR = new Date().getFullYear();

/* -------------------------------------------------------------------------- */
/* Link groups                                                                */
/* -------------------------------------------------------------------------- */

/** Labels come from the shared "Common" namespace. */
export type FooterLabelKey = NavLabelKey | "studentVerification";

export type FooterLink = {
  id: string;
  labelKey: FooterLabelKey;
  /** `null` = page not confirmed yet; the link is hidden. */
  href: string | null;
};

export type FooterLinkGroup = {
  id: string;
  /** Key inside the "Footer" namespace. */
  titleKey: "groups.explore" | "groups.academy";
  links: readonly FooterLink[];
};

/**
 * Reuse the navbar's routes so the two can never drift apart.
 * Throws at startup if a navbar id is renamed, which is easier to catch than a dead link.
 */
function fromNav(id: string): FooterLink {
  const item = NAV_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`Footer: no navbar item with id "${id}"`);
  return { id: item.id, labelKey: item.labelKey, href: item.href };
}

export const FOOTER_LINK_GROUPS: readonly FooterLinkGroup[] = [
  {
    id: "explore",
    titleKey: "groups.explore",
    links: [fromNav("home"), fromNav("courses"), fromNav("skill-center")],
  },
  {
    id: "academy",
    titleKey: "groups.academy",
    links: [
      fromNav("about"),
      fromNav("success-stories"),
      fromNav("contact"),
      // [CLIENT INPUT REQUIRED] Confirm the student-verification page route, then set href.
      { id: "verification", labelKey: "studentVerification", href: null },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export type ContactKind = "email" | "phone" | "text";

export type ContactItem = {
  id: "email" | "phone" | "address" | "hours";
  icon: IconType;
  /** Key inside the "Footer" namespace. */
  labelKey: `contact.${"email" | "phone" | "address" | "hours"}`;
  kind: ContactKind;
  /** The real value, or CLIENT_INPUT_REQUIRED until supplied. */
  value: string;
};

export const CONTACT_ITEMS: readonly ContactItem[] = [
  { id: "email", icon: LuMail, labelKey: "contact.email", kind: "email", value: CLIENT_INPUT_REQUIRED },
  { id: "phone", icon: LuPhone, labelKey: "contact.phone", kind: "phone", value: CLIENT_INPUT_REQUIRED },
  { id: "address", icon: LuMapPin, labelKey: "contact.address", kind: "text", value: CLIENT_INPUT_REQUIRED },
  { id: "hours", icon: LuClock, labelKey: "contact.hours", kind: "text", value: CLIENT_INPUT_REQUIRED },
];

/** mailto:/tel: target for a contact item, or null when it should not be a link. */
export function getContactHref(item: ContactItem): string | null {
  if (item.value === CLIENT_INPUT_REQUIRED) return null;
  if (item.kind === "email") return `mailto:${item.value}`;
  if (item.kind === "phone") return `tel:${item.value.replace(/[^\d+]/g, "")}`;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

export type SocialLink = {
  id: string;
  /** Platform name (a proper noun, used as the accessible label). */
  label: string;
  icon: IconType;
  /** `null` = no real URL supplied yet; the icon is not rendered. */
  url: string | null;
};

/** [CLIENT INPUT REQUIRED] Provide the real profile URL for each platform AfghanUstad actually uses. */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: "facebook", label: "Facebook", icon: FaFacebookF, url: null },
  { id: "instagram", label: "Instagram", icon: FaInstagram, url: null },
  { id: "youtube", label: "YouTube", icon: FaYoutube, url: null },
  { id: "telegram", label: "Telegram", icon: FaTelegram, url: null },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, url: null },
];

/* -------------------------------------------------------------------------- */
/* Developer credit                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Credit shown in the bottom bar. The visible texts are translation keys
 * ("Footer.developer.label" and "Footer.developer.name"); only the link lives here.
 */
export const DEVELOPER_CREDIT = {
  url: "https://www.facebook.com/mohammad.bashir.740608/",
} as const;

/* -------------------------------------------------------------------------- */
/* Legal                                                                      */
/* -------------------------------------------------------------------------- */

export type LegalLink = {
  id: string;
  /** Key inside the "Footer" namespace. */
  labelKey: "legal.privacy" | "legal.terms";
  /** `null` = the page does not exist yet; the link is hidden. */
  href: string | null;
};

/** [CLIENT INPUT REQUIRED] Set href only once the policy pages actually exist. */
export const LEGAL_LINKS: readonly LegalLink[] = [
  { id: "privacy", labelKey: "legal.privacy", href: null },
  { id: "terms", labelKey: "legal.terms", href: null },
];