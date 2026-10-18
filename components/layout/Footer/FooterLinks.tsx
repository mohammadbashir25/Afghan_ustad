"use client";

/**
 * FooterLinks — the three information lists in the footer, all driven by data.ts:
 *  - FooterNav     : grouped page links (two compact columns side by side).
 *  - FooterContact : contact rows (email / phone / address / hours).
 *  - FooterSocial  : social icon links (renders nothing until real URLs exist).
 *
 * They share a file because they share the same link/heading styling. This is a
 * client component only because FooterNav needs usePathname to mark the current page.
 *
 * Interaction details
 *  - Links: a gold hairline underline draws in from the inline-start edge on
 *    hover/focus (it starts on the right in RTL). The current page keeps it.
 *  - Social icons: border + icon turn gold and lift 2px; CSS only, and the lift
 *    is removed with reduced motion. No Framer Motion here — it would add nothing.
 *
 * RTL
 *  - Logical utilities only. Email and phone values are forced `dir="ltr"` so
 *    "@", "+" and digits never reorder inside an RTL layout.
 */

import { useTranslations } from "next-intl";

import { cn } from "@/components/ui";
import { Link, usePathname } from "@/i18n/navigation";

import {
  CLIENT_INPUT_REQUIRED,
  CONTACT_ITEMS,
  FOOTER_LINK_GROUPS,
  SOCIAL_LINKS,
  getContactHref,
  type FooterLink,
} from "./data";

/** Column heading style, shared by nav groups and the contact block. */
const HEADING = "text-xs font-semibold text-white/60 rtl:text-sm ltr:uppercase ltr:tracking-[0.16em]";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

type VisibleLink = Omit<FooterLink, "href"> & { href: string };

export function FooterNav() {
  const t = useTranslations("Footer");
  const tc = useTranslations("Common");
  const pathname = usePathname();

  // "/" matches only the exact root; other routes also match nested pages.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    // Two columns at every size: the lists are short, so this stays compact on mobile too.
    <nav aria-label={t("navigation")} className="grid grid-cols-2 gap-8">
      {FOOTER_LINK_GROUPS.map((group) => {
        // Links with `href: null` are pages that are not confirmed yet — skip them.
        const links = group.links.flatMap((link): VisibleLink[] =>
          link.href ? [{ ...link, href: link.href }] : [],
        );
        if (links.length === 0) return null;

        return (
          <div key={group.id}>
            <h2 className={HEADING}>{t(group.titleKey)}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {links.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative inline-block rounded-sm text-[0.9375rem] transition-colors duration-200 motion-reduce:transition-none",
                        "after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-accent",
                        "after:transition-transform after:duration-300 rtl:after:origin-right motion-reduce:after:transition-none",
                        "hover:text-white hover:after:scale-x-100 focus-visible:after:scale-x-100",
                        FOCUS_RING,
                        active ? "text-white after:scale-x-100" : "text-primary-light/80 after:scale-x-0",
                      )}
                    >
                      {tc(link.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function FooterContact() {
  const t = useTranslations("Footer");

  return (
    <div>
      <h2 className={HEADING}>{t("contact.title")}</h2>
      <ul className="mt-5 flex flex-col gap-4">
        {CONTACT_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = getContactHref(item);
          const pending = item.value === CLIENT_INPUT_REQUIRED;
          // Email/phone are always LTR text; address/hours follow the page direction.
          const valueDir = item.kind === "text" ? undefined : "ltr";

          return (
            <li key={item.id} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-white/15 text-accent"
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white/60 rtl:text-sm">{t(item.labelKey)}</p>
                {href ? (
                  <a
                    href={href}
                    dir={valueDir}
                    className={cn(
                      "mt-0.5 inline-block break-words rounded-sm text-[0.9375rem] text-white underline decoration-white/30 underline-offset-4",
                      "transition-colors duration-200 hover:decoration-accent motion-reduce:transition-none",
                      FOCUS_RING,
                    )}
                  >
                    {item.value}
                  </a>
                ) : (
                  <p
                    dir={valueDir}
                    className={cn(
                      "mt-0.5 break-words text-[0.9375rem] rtl:leading-relaxed",
                      // Placeholders are visibly provisional so they cannot be mistaken for real data.
                      pending ? "italic text-white/50" : "text-white",
                    )}
                  >
                    {item.value}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FooterSocial() {
  const t = useTranslations("Footer");

  // Only platforms with a real URL are shown; with none supplied, the whole block disappears.
  const links = SOCIAL_LINKS.flatMap((link) => (link.url ? [{ ...link, url: link.url }] : []));
  if (links.length === 0) return null;

  return (
    <ul aria-label={t("social")} className="mt-8 flex flex-wrap gap-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={cn(
                "grid size-10 place-items-center rounded-md border border-white/15 text-primary-light",
                "transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent",
                "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                FOCUS_RING,
              )}
            >
              <Icon aria-hidden className="size-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
