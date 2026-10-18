/**
 * FooterBottom — the thin bar under the main footer: copyright, legal links,
 * the developer credit and the language switcher.
 *
 * Layout
 *  - Mobile: stacked. Copyright/legal first, then the language switcher on its
 *    own row, with its three buttons sharing the full width (easy tap targets).
 *  - md and up: one row. Copyright + legal at the inline-start, switcher at the
 *    inline-end; both flip automatically in RTL.
 *
 * Behaviour
 *  - The language switcher is the same component the Navbar uses (inline variant),
 *    in its "dark" tone, so locale switching behaves identically everywhere.
 *  - Legal links render only when a real route is set in data.ts; until then
 *    the legal list is simply absent (no dead or invented pages).
 *  - A plain server component: no state, so no "use client" needed.
 */

import { useFormatter, useTranslations } from "next-intl";
import { LuLanguages } from "react-icons/lu";

import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "../Navbar/LanguageSwitcher";
import { DEVELOPER_CREDIT, FOOTER_YEAR, LEGAL_LINKS } from "./data";

export function FooterBottom() {
  const t = useTranslations("Footer");
  const format = useFormatter();

  // Locale-aware digits (e.g. Persian numerals in fa), without a thousands separator.
  const year = format.number(FOOTER_YEAR, { useGrouping: false });

  const legalLinks = LEGAL_LINKS.flatMap((link) => (link.href ? [{ ...link, href: link.href }] : []));

  return (
    <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3">
        {/* Copyright + legal share a row from md up. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <p className="text-sm leading-relaxed text-primary-light/70 rtl:leading-loose">
            {t("copyright", { year, name: t("brandName") })}
          </p>

          {legalLinks.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="rounded-sm text-sm text-primary-light/70 underline decoration-white/20 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Developer credit. External link, so it opens in a new tab with noopener. */}
        <p className="text-sm text-primary-light/70 rtl:leading-loose">
          {t("developer.label")}{" "}
          <a
            href={DEVELOPER_CREDIT.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors duration-200 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none"
          >
            {t("developer.name")}
          </a>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <LuLanguages aria-hidden className="size-4 shrink-0 text-white/60" />
        <div className="flex-1 md:flex-none">
          <LanguageSwitcher variant="inline" />
        </div>
      </div>
    </div>
  );
}