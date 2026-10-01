/**
 * Footer — the site's closing section.
 *
 * Role
 *  - Composes the brand block, link groups, contact details and the bottom bar.
 *    Content comes from data.ts; this file only decides layout.
 *  - A server component. The only animation is a light, one-time stagger of
 *    the three columns as the footer scrolls into view (opacity + 16px rise);
 *    the rest of the footer is static on purpose.
 *
 * Responsive layout (deliberately not a generic 5-column footer)
 *  - Mobile: one column — brand, then the link groups (two compact columns),
 *    then contact.
 *  - md: two columns — brand spans the full row; links and contact sit side by side.
 *  - lg+: a 12-column grid: brand 5 / links 4 / contact 3. The brand column gets
 *    the most space because it carries the identity; links and contact are short lists.
 *
 * Surface
 *  - bg-primary-dark, continuing from the green FinalCTA above it. Gold appears
 *    only in the logo corner, link underlines, contact icons and hover states.
 */

import { useTranslations } from "next-intl";
import { LuGraduationCap } from "react-icons/lu";

import { Container, Stagger, StaggerItem } from "@/components/ui";
import { Link } from "@/i18n/navigation";

import { FooterBottom } from "./FooterBottom";
import { FooterContact, FooterNav, FooterSocial } from "./FooterLinks";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-primary-dark text-primary-light">
      <Container className="pb-8 pt-16 sm:pt-20 lg:pt-24">
        <Stagger className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10 xl:gap-16" amount={0.1}>
          {/* Brand: same mark as the navbar, so the site opens and closes with one identity. */}
          <StaggerItem className="min-w-0 md:col-span-2 lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span
                aria-hidden
                className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white"
              >
                <LuGraduationCap className="size-[55%]" aria-hidden />
                <span className="absolute -bottom-px -end-px size-2.5 rounded-ss-sm bg-accent" />
              </span>
              <span className="text-lg font-semibold text-white ltr:tracking-tight">{t("brandName")}</span>
            </Link>

            <p className="mt-5 max-w-sm text-pretty text-base leading-relaxed text-primary-light/80 rtl:leading-loose">
              {t("tagline")}
            </p>

            <FooterSocial />
          </StaggerItem>

          <StaggerItem className="min-w-0 lg:col-span-4">
            <FooterNav />
          </StaggerItem>

          <StaggerItem className="min-w-0 lg:col-span-3">
            <FooterContact />
          </StaggerItem>
        </Stagger>

        <FooterBottom />
      </Container>
    </footer>
  );
}
