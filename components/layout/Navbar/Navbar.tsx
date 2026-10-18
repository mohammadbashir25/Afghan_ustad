"use client";

/**
 * Navbar — fixed site header.
 *
 * Responsibilities
 *  - Owns the state shared by desktop and mobile: scrolled (compact) and menu open.
 *  - Computes the active nav item from the current route.
 *  - Composes DesktopNavigation, LanguageSwitcher, the CTA and MobileNavigation.
 *
 * Responsive model (one breakpoint: `xl`, 1280px)
 *  - xl and up : full link list + language menu + CTA, short brand name.
 *  - below xl  : brand (full name) + menu toggle. The links, language and CTA
 *                live in a side drawer (MobileNavigation).
 *
 * Integration notes
 *  - Imports i18n helpers from "@/i18n/navigation" (next-intl's createNavigation).
 *  - The header is `fixed`. Give pages a top padding of at least 80px and use the
 *    same background as the unscrolled header (bg-background) on the first
 *    section so it reads as one surface.
 */

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LuArrowRight, LuGraduationCap, LuMenu } from "react-icons/lu";

import { Button, Container, IconButton, cn } from "@/components/ui";
import { EASE_OUT } from "@/components/ui/utils";
import { Link, usePathname } from "@/i18n/navigation";

import { DesktopNavigation } from "./DesktopNavigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNavigation } from "./MobileNavigation";
import { NAVBAR, NAV_CTA, NAV_ITEMS } from "./data";

/**
 * Active item = the nav item whose route matches the current path.
 * "/" matches only the exact root; other items also match nested routes
 * (e.g. /courses/web-development keeps "Courses" active).
 * Returns "" on unlisted pages so nothing is highlighted.
 * (usePathname from next-intl already strips the locale prefix.)
 */
function useActiveNavId(): string {
  const pathname = usePathname();
  const match = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.id ?? "";
}

export function Navbar() {
  const tn = useTranslations("Navbar");
  const tc = useTranslations("Common");
  const reduceMotion = useReducedMotion();
  const activeId = useActiveNavId();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Only flips a boolean when the threshold is crossed, so scrolling does not re-render every frame.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > NAVBAR.scrollThreshold));

  /** Closes the drawer. Pass true to send focus back to the toggle (close button, backdrop). */
  function closeMenu(returnFocus = false) {
    setMenuOpen(false);
    if (returnFocus) document.getElementById(NAVBAR.mobileToggleId)?.focus();
  }

  /**
   * While the drawer is open: lock page scroll, close on Escape (returning focus
   * to the toggle) and close automatically if the viewport grows to the desktop
   * layout. Everything is restored on cleanup. Focus trapping lives in the drawer.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      document.getElementById(NAVBAR.mobileToggleId)?.focus();
    };
    const desktop = window.matchMedia(NAVBAR.desktopQuery);
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen]);

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b",
        "transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none",
        scrolled
          ? "border-border bg-surface shadow-[0_10px_30px_-24px_rgb(5_59_46/0.35)]"
          : "border-transparent bg-background",
      )}
      // Height is animated by Framer Motion (the compact state). Colors/shadow use CSS transitions
      // because Framer cannot interpolate CSS variables.
      initial={false}
      animate={{ height: scrolled ? NAVBAR.height.compact : NAVBAR.height.default }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT }}
    >
      {/* z-10 keeps the bar in its own layer; the drawer's backdrop (z-20) dims it when open. */}
      <Container className="relative z-10 flex h-full items-center gap-6">
        {/* Brand. Swap the mark for the real logo asset when available. */}
        <div className="flex flex-1 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark"
          >
            <span
              aria-hidden
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-md bg-primary text-white",
                "transition-[width,height] duration-300 motion-reduce:transition-none",
                scrolled ? "size-8" : "size-9",
              )}
            >
              <LuGraduationCap className="size-[55%]" aria-hidden />
              {/* Small gold corner: the only accent in the mark. */}
              <span className="absolute -bottom-px -end-px size-2.5 rounded-ss-sm bg-accent" />
            </span>

            {/*
              Below xl there is room for the full name; at xl the link list needs the
              space, so the short name is used. The hidden variant is display:none,
              so assistive tech only reads the visible one.
            */}
            <span className="max-w-[11rem] text-sm font-semibold leading-tight text-foreground ltr:tracking-tight sm:max-w-none sm:text-lg">
              <span className="xl:hidden">{tn("brandFullName")}</span>
              <span className="hidden xl:inline">{tn("brandName")}</span>
            </span>
          </Link>
        </div>

        {/* Centered links (xl and up). The flex-1 groups on both sides keep this truly centered. */}
        <DesktopNavigation items={NAV_ITEMS} activeId={activeId} />

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden items-center gap-3 xl:flex">
            <LanguageSwitcher variant="menu" />
            <Button
              href={NAV_CTA.href}
              size="sm"
              icon={<LuArrowRight />}
              iconPosition="end"
              flipIconOnRtl
            >
              {tc(NAV_CTA.labelKey)}
            </Button>
          </div>

          {/* Toggle (below xl). The drawer has its own close button. */}
          <div className="xl:hidden">
            <IconButton
              id={NAVBAR.mobileToggleId}
              label={tc("menu")}
              variant="outline"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls={NAVBAR.mobilePanelId}
              onClick={() => setMenuOpen(true)}
            >
              <LuMenu />
            </IconButton>
          </div>
        </div>
      </Container>

      <MobileNavigation
        id={NAVBAR.mobilePanelId}
        open={menuOpen}
        items={NAV_ITEMS}
        activeId={activeId}
        onClose={closeMenu}
      />
    </motion.header>
  );
}