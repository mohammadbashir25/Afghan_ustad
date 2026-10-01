"use client";

/**
 * LanguageSwitcher — en / fa / ps.
 *
 * Kept as its own file because both the desktop header and the mobile panel
 * need it, and the locale-switching logic must not be duplicated.
 *  - "menu"   : compact dropdown for the light desktop header.
 *  - "inline" : three full-width buttons for the mobile drawer.
 *
 * Switching keeps the current path and hash and only changes the locale
 * (next-intl's router.replace). The root layout is responsible for updating
 * <html lang dir>.
 *
 * The dropdown is a simple disclosure (button + list of buttons), which keeps
 * native Tab order: closes on Escape (focus returns to the trigger) and on
 * outside click.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { LuCheck, LuChevronDown, LuLanguages } from "react-icons/lu";

import { cn } from "@/components/ui";
import { usePathname, useRouter } from "@/i18n/navigation";

import { LOCALES, type AppLocale } from "./data";

/** Shared logic: current locale + a function that swaps it on the current URL. */
function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: AppLocale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(`${pathname}${window.location.hash}`, { locale: next });
    });
  }

  return { locale, isPending, switchTo };
}

function LanguageMenu() {
  const t = useTranslations("Common");
  const reduceMotion = useReducedMotion();
  const listId = useId();
  const { locale, isPending, switchTo } = useLocaleSwitch();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Outside click / Escape handling only while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" aria-busy={isPending || undefined}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("language")}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground",
          "transition-colors duration-200 hover:bg-primary-light motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark",
        )}
      >
        <LuLanguages aria-hidden className="size-[1.1rem]" />
        {/* Locale codes are identifiers, not translated copy. */}
        <span className="uppercase">{locale}</span>
        <LuChevronDown
          aria-hidden
          className={cn(
            "size-4 text-text-muted transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            // end-0 anchors to the inline-end edge, so the list opens correctly in RTL too.
            className="absolute end-0 top-full z-20 mt-2 min-w-44 rounded-md border border-border bg-surface p-1 shadow-[0_12px_32px_-16px_rgb(5_59_46/0.3)]"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2, ease: "easeOut" }}
          >
            {LOCALES.map(({ code, labelKey }) => {
              const active = code === locale;
              return (
                <li key={code}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setOpen(false);
                      switchTo(code);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-6 rounded-sm px-3 py-2 text-start text-sm",
                      "transition-colors duration-150 hover:bg-primary-light motion-reduce:transition-none",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-dark",
                      active ? "font-semibold text-primary-dark" : "text-foreground",
                    )}
                  >
                    {t(labelKey)}
                    {active && <LuCheck aria-hidden className="size-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function LanguageInline({ onSelect }: { onSelect?: () => void }) {
  const t = useTranslations("Common");
  const { locale, isPending, switchTo } = useLocaleSwitch();

  return (
    <div role="group" aria-label={t("language")} aria-busy={isPending || undefined} className="flex gap-2">
      {LOCALES.map(({ code, labelKey }) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => {
              switchTo(code);
              onSelect?.();
            }}
            className={cn(
              "flex-1 rounded-md border px-3 py-3 text-sm font-medium",
              "transition-colors duration-200 motion-reduce:transition-none",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark",
              active
                ? "border-primary bg-primary text-white"
                : "border-border-strong text-foreground hover:border-primary hover:bg-primary-light/50",
            )}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export type LanguageSwitcherProps = {
  variant: "menu" | "inline";
  /** Inline variant only: called after a language is picked (e.g. to close the drawer). */
  onSelect?: () => void;
};

export function LanguageSwitcher({ variant, onSelect }: LanguageSwitcherProps) {
  return variant === "menu" ? <LanguageMenu /> : <LanguageInline onSelect={onSelect} />;
}