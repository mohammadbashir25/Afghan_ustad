"use client";

/**
 * DashboardSidebar
 *
 * Responsibilities:
 *  - Renders brand + navigation supplied by the caller (no role logic here).
 *  - Desktop (lg+): sticky rail that can collapse to icons only.
 *  - Mobile (<lg): off-canvas drawer with backdrop, Esc-to-close, focus trap
 *    and body scroll lock.
 *
 * Layout notes:
 *  - Only logical Tailwind properties are used (start/end, ms/me, ps/pe,
 *    border-e) so the sidebar mirrors automatically under dir="rtl".
 *  - Dashboard routes are unprefixed, so we use next/link and
 *    next/navigation, NOT the locale-aware helpers from @/i18n/navigation.
 *  - The active item is the single nav item with the longest matching href,
 *    so "/admin" (overview) is not highlighted while on "/admin/courses".
 */

import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { IconType } from "react-icons";
import { FiChevronsLeft, FiChevronsRight, FiX } from "react-icons/fi";

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export interface DashboardNavItem {
  /** Unprefixed dashboard route, e.g. "/admin/courses". */
  href: string;
  label: string;
  icon: IconType;
  /** Optional count/label. Only shown if you pass real data. */
  badge?: string | number;
}

export interface DashboardNavSection {
  id: string;
  /** Optional heading. Omit for an untitled group. */
  title?: string;
  items: DashboardNavItem[];
}

export interface DashboardSidebarProps {
  sections: DashboardNavSection[];
  /** Where the brand links to, e.g. "/admin". */
  homeHref: string;
  /** Small line under the brand name, e.g. "Administration". */
  brandSubtitle?: string;

  /** Desktop collapsed state (controlled by the parent layout). */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;

  /** Mobile drawer state (controlled by the parent layout). */
  mobileOpen?: boolean;
  onMobileClose?: () => void;

  /** Overridable strings so the shell can be translated later. */
  labels?: Partial<DashboardSidebarLabels>;
}

export interface DashboardSidebarLabels {
  navigation: string;
  collapse: string;
  expand: string;
  closeMenu: string;
}

const DEFAULT_LABELS: DashboardSidebarLabels = {
  navigation: "Dashboard navigation",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  closeMenu: "Close menu",
};

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 72;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B4F] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function matchesPath(pathname: string, href: string): boolean {
  const base = href.endsWith("/") && href.length > 1 ? href.slice(0, -1) : href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Longest matching href wins, so nested routes highlight the right item. */
function getActiveHref(
  pathname: string,
  sections: DashboardNavSection[],
): string | null {
  let best: string | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      if (matchesPath(pathname, item.href) && (!best || item.href.length > best.length)) {
        best = item.href;
      }
    }
  }
  return best;
}

/* ----------------------------------------------------------------------------
 * Brand
 * ------------------------------------------------------------------------- */

function Brand({
  href,
  subtitle,
  collapsed,
  onNavigate,
}: {
  href: string;
  subtitle?: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label="AfghanUstad"
      className={`group flex min-w-0 items-center gap-3 rounded-lg ${FOCUS_RING}`}
    >
      {/* Simple mark: letter on primary with a thin accent underline. */}
      <span
        aria-hidden
        className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0B6B4F] text-base font-semibold text-white"
      >
        A
        <span className="absolute bottom-1.5 start-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full bg-[#F4C430] rtl:translate-x-1/2" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-tight text-[#053B2E]">
            AfghanUstad
          </span>
          {subtitle && (
            <span className="block truncate text-xs leading-tight text-[#64748B]">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

/* ----------------------------------------------------------------------------
 * Navigation list (shared by desktop rail and mobile drawer)
 * ------------------------------------------------------------------------- */

function SidebarNav({
  sections,
  activeHref,
  collapsed,
  ariaLabel,
  onNavigate,
}: {
  sections: DashboardNavSection[];
  activeHref: string | null;
  collapsed: boolean;
  ariaLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      <div className="space-y-5">
        {sections.map((section, sectionIndex) => (
          <section key={section.id} aria-label={section.title}>
            {section.title &&
              (collapsed ? (
                // Collapsed rail: a hairline replaces the heading.
                sectionIndex > 0 && <div aria-hidden className="mx-2 mb-3 h-px bg-[#DCE7E2]" />
              ) : (
                <h2 className="mb-1.5 truncate px-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  {section.title}
                </h2>
              ))}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                const hasBadge = item.badge !== undefined && item.badge !== "";

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      // When labels are hidden, keep an accessible name + tooltip.
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={[
                        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                        collapsed ? "justify-center px-0" : "",
                        active
                          ? "bg-[#E6F4EE] font-medium text-[#053B2E]"
                          : "text-[#64748B] hover:bg-[#F1F5F3] hover:text-[#12372E]",
                        FOCUS_RING,
                      ].join(" ")}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-[#0B6B4F]"
                        />
                      )}
                      <Icon aria-hidden className="size-[18px] shrink-0" />

                      {!collapsed && (
                        <>
                          {/* min-w-0 + truncate keeps long labels from breaking the row. */}
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {hasBadge && (
                            <span className="shrink-0 rounded-full bg-[#FFF4C2] px-2 py-0.5 text-[11px] font-semibold text-[#12372E]">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {collapsed && hasBadge && (
                        <span
                          aria-hidden
                          className="absolute end-2 top-2 size-2 rounded-full bg-[#F4C430]"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}

/* ----------------------------------------------------------------------------
 * Sidebar
 * ------------------------------------------------------------------------- */

export default function DashboardSidebar({
  sections,
  homeHref,
  brandSubtitle,
  collapsed = false,
  onToggleCollapsed,
  mobileOpen = false,
  onMobileClose,
  labels,
}: DashboardSidebarProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const activeHref = getActiveHref(pathname, sections);

  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);


  // Read direction once on mount so the drawer slides in from the correct edge.
// Read the document direction without triggering a state update.
// The guard keeps server rendering safe.
const isRtl =
  typeof document !== "undefined" &&
  document.documentElement.dir === "rtl";
  // While the drawer is open: lock page scroll, move focus in, restore on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [mobileOpen]);

  // Esc closes; Tab is trapped inside the drawer.
  function handleDrawerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onMobileClose?.();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    if (!focusable || focusable.length === 0) return;

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

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.2, ease: "easeOut" as const };

  const CollapseIcon = collapsed ? FiChevronsRight : FiChevronsLeft;

  const collapseToggle: ReactNode = onToggleCollapsed ? (
    <div className="border-t border-[#DCE7E2] p-3">
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? t.expand : t.collapse}
        aria-expanded={!collapsed}
        title={collapsed ? t.expand : t.collapse}
        className={[
          "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E]",
          collapsed ? "justify-center px-0" : "",
          FOCUS_RING,
        ].join(" ")}
      >
        {/* Chevrons are directional, so flip them in RTL. */}
        <CollapseIcon aria-hidden className="size-[18px] shrink-0 rtl:rotate-180" />
        {!collapsed && <span className="truncate">{t.collapse}</span>}
      </button>
    </div>
  ) : null;

  return (
    <>
      {/* Desktop rail */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={transition}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-e border-[#DCE7E2] bg-white lg:flex"
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-[#DCE7E2] ${collapsed ? "justify-center px-0" : "px-5"}`}>
          <Brand href={homeHref} subtitle={brandSubtitle} collapsed={collapsed} />
        </div>
        <SidebarNav
          sections={sections}
          activeHref={activeHref}
          collapsed={collapsed}
          ariaLabel={t.navigation}
        />
        {collapseToggle}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-[#12372E]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              onClick={onMobileClose}
            />
            <motion.aside
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t.navigation}
              onKeyDown={handleDrawerKeyDown}
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={transition}
              // min() keeps a visible backdrop strip on very narrow phones.
              className="absolute inset-y-0 start-0 flex w-[min(18rem,85vw)] flex-col border-e border-[#DCE7E2] bg-white shadow-xl"
            >
              <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#DCE7E2] ps-5 pe-3">
                <Brand
                  href={homeHref}
                  subtitle={brandSubtitle}
                  collapsed={false}
                  onNavigate={onMobileClose}
                />
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onMobileClose}
                  aria-label={t.closeMenu}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F3] hover:text-[#12372E] ${FOCUS_RING}`}
                >
                  <FiX aria-hidden className="size-5" />
                </button>
              </div>
              <SidebarNav
                sections={sections}
                activeHref={activeHref}
                collapsed={false}
                ariaLabel={t.navigation}
                onNavigate={onMobileClose}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}