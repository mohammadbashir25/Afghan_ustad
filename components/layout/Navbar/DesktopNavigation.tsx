"use client";

/**
 * DesktopNavigation — the centered link list shown from the `lg` breakpoint up.
 *
 * Interaction design
 *  - Active item: a gold underline that *slides* between items via a shared
 *    Framer Motion `layoutId`. This is the one deliberate motion moment here.
 *  - Inactive items: a hairline underline draws in from the inline-start edge
 *    on hover (CSS only; it starts on the right in RTL).
 *  - Active state is exposed with aria-current, not just color.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/components/ui";
import { Link } from "@/i18n/navigation";

import type { NavItem } from "./data";

type DesktopNavigationProps = {
  items: readonly NavItem[];
  activeId: string;
};

export function DesktopNavigation({ items, activeId }: DesktopNavigationProps) {
  const tn = useTranslations("Navbar");
  const tc = useTranslations("Common");
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label={tn("mainNavigation")} className="hidden xl:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "group relative block rounded-md px-3.5 py-2 text-[0.9375rem] font-medium",
                  "transition-colors duration-200 motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark",
                  active ? "text-primary-dark" : "text-text-secondary hover:text-foreground",
                )}
              >
                {tc(item.labelKey)}

                {active ? (
                  <motion.span
                    layoutId="navbar-active-indicator"
                    aria-hidden
                    className="absolute inset-x-3.5 -bottom-0.5 h-0.5 bg-accent"
                    transition={
                      reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 42 }
                    }
                  />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3.5 -bottom-0.5 h-px origin-left rtl:origin-right scale-x-0 bg-border-strong",
                      "transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none",
                    )}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
