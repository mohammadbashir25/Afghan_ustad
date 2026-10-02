/**
 * Navbar configuration. Everything the Navbar renders (routes, labels, locales,
 * sizing) is driven from here so new pages are a one-line change.
 * Labels are next-intl keys in the shared "Common" namespace — never visible text.
 */

/** Keys from the "Common" namespace that the navbar uses as labels. */
export type NavLabelKey =
  | "home"
  | "about"
  | "courses"
  | "skillCenter"
  | "faq"
  | "successStories"
  | "contact"
  | "enrollNow";

export type NavItem = {
  /** Stable identifier used for active-state matching. */
  id: string;
  labelKey: NavLabelKey;
  /** Locale-aware route (rendered with next-intl's Link). */
  href: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", labelKey: "home", href: "/" },
  { id: "about", labelKey: "about", href: "/about" },
  { id: "courses", labelKey: "courses", href: "/courses" },
  { id: "skill-center", labelKey: "skillCenter", href: "/skill-center" },
  {
    id: "success-stories",
    labelKey: "successStories",
    href: "/success-stories",
  },
  { id: "contact", labelKey: "contact", href: "/contact" },
];

/** Primary call-to-action: a real route, rendered with the locale-aware Link. */
export const NAV_CTA = { labelKey: "enrollNow", href: "/contact" } as const satisfies {
  labelKey: NavLabelKey;
  href: string;
};

/**
 * Supported locales. labelKey points at Common.english / dari / pashto.
 * `dir` decides which edge the mobile drawer slides in from.
 */
export const LOCALES = [
  { code: "en", labelKey: "english", dir: "ltr" },
  { code: "fa", labelKey: "dari", dir: "rtl" },
  { code: "ps", labelKey: "pashto", dir: "rtl" },
] as const;

export type AppLocale = (typeof LOCALES)[number]["code"];
export type LocaleLabelKey = (typeof LOCALES)[number]["labelKey"];

/** Header behaviour. Heights are px because Framer Motion animates them. */
export const NAVBAR = {
  height: { default: 80, compact: 64 },
  /** Scroll distance (px) after which the header condenses. */
  scrollThreshold: 24,
  /** Matches Tailwind's `xl` breakpoint: the full desktop nav starts here. */
  desktopQuery: "(min-width: 1280px)",
  mobilePanelId: "mobile-navigation",
  mobileToggleId: "mobile-navigation-toggle",
} as const;