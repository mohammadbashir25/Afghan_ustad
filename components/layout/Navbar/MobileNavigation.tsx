"use client";

/**
 * MobileNavigation — side drawer shown below `xl`.
 *
 * Responsibilities
 *  - Renders a dimmed backdrop and a partial-width drawer (max 22rem), so the
 *    page stays visible behind it instead of being covered.
 *  - The drawer is anchored to the inline-END edge (`end-0`) and slides in from
 *    that same edge: right in English, left in Dari/Pashto. That is also the
 *    side the header's toggle button sits on, so it opens from where you tapped.
 *  - Open state, scroll lock and Escape live in Navbar; this file owns the
 *    dialog behaviour: initial focus, a Tab focus trap, and click-outside.
 *
 * Motion
 *  - Backdrop fades; drawer translates on X by its own width, then the rows
 *    stagger in. Exit is a faster reverse.
 *  - Reduced motion: opacity only, no sliding and no row movement.
 */

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { LuArrowRight, LuX } from "react-icons/lu";

import { Button, Eyebrow, IconButton, cn } from "@/components/ui";
import { EASE_OUT } from "@/components/ui/utils";
import { Link } from "@/i18n/navigation";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { LOCALES, NAV_CTA, type NavItem } from "./data";

type MobileNavigationProps = {
  id: string;
  open: boolean;
  items: readonly NavItem[];
  activeId: string;
  /** Close the drawer. Pass true to return focus to the toggle (close button / backdrop). */
  onClose: (returnFocus?: boolean) => void;
};

export function MobileNavigation({ id, open, items, activeId, onClose }: MobileNavigationProps) {
  const tn = useTranslations("Navbar");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Slide in from the inline-end edge: from the right for LTR, from the left for RTL.
  const rtl = LOCALES.find((item) => item.code === locale)?.dir === "rtl";
  const offscreen = rtl ? "-100%" : "100%";

  // Move focus into the dialog when it opens (first focusable = the close button).
  useEffect(() => {
    if (!open) return;
    drawerRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus({ preventScroll: true });
  }, [open]);

  // Keep Tab / Shift+Tab inside the drawer while it is open.
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const drawer: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        hidden: { x: offscreen },
        visible: {
          x: 0,
          transition: { duration: 0.45, ease: EASE_OUT, staggerChildren: 0.05, delayChildren: 0.15 },
        },
        exit: { x: offscreen, transition: { duration: 0.3, ease: EASE_OUT } },
      };

  const row: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.15 : 0.4, ease: EASE_OUT } },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          aria-hidden
          className="fixed inset-0 z-20 bg-primary-dark/40 xl:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
          onClick={() => onClose(true)}
        />
      )}

      {open && (
        <motion.div
          key="drawer"
          ref={drawerRef}
          id={id}
          role="dialog"
          aria-modal="true"
          aria-label={tc("menu")}
          onKeyDown={trapFocus}
          className={cn(
            "fixed inset-y-0 end-0 z-30 flex w-[min(85vw,22rem)] flex-col bg-surface xl:hidden",
            "border-s border-border shadow-[0_0_48px_-12px_rgb(5_59_46/0.35)]",
          )}
          variants={drawer}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            variants={row}
            className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"
          >
            <Eyebrow>{tc("menu")}</Eyebrow>
            <IconButton label={tc("close")} variant="ghost" size="sm" onClick={() => onClose(true)}>
              <LuX />
            </IconButton>
          </motion.div>

          <nav aria-label={tn("mainNavigation")} className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-1">
              {items.map((item) => {
                const active = item.id === activeId;
                return (
                  <motion.li key={item.id} variants={row}>
                    <Link
                      href={item.href}
                      onClick={() => onClose()}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center rounded-md px-4 py-3 text-base font-medium",
                        "transition-colors duration-200 motion-reduce:transition-none",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-dark",
                        active
                          ? "bg-primary-light text-primary-dark"
                          : "text-foreground hover:bg-surface-muted",
                      )}
                    >
                      {/* Gold marker on the inline-start edge marks the current page. */}
                      {active && <span aria-hidden className="absolute inset-y-2 start-0 w-0.5 bg-accent" />}
                      {tc(item.labelKey)}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* Language + CTA stay pinned at the bottom of the drawer, within thumb reach. */}
          <motion.div variants={row} className="flex shrink-0 flex-col gap-4 border-t border-border p-5">
            <LanguageSwitcher variant="inline" onSelect={() => onClose()} />
            <Button
              href={NAV_CTA.href}
              size="md"
              className="w-full"
              icon={<LuArrowRight />}
              iconPosition="end"
              flipIconOnRtl
              onClick={() => onClose()}
            >
              {tc(NAV_CTA.labelKey)}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}