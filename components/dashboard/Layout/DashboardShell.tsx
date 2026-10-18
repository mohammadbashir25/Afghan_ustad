"use client";

/**
 * DashboardShell
 *
 * Responsibilities:
 *  - Composes DashboardSidebar + DashboardHeader + the main content area.
 *  - Owns the two pieces of UI state the sidebar needs: the desktop
 *    collapsed flag and the mobile drawer flag.
 *  - Resolves role-specific navigation from `navigation.ts`.
 *
 * Not responsible for: authentication or logout logic. `onLogout` is a
 * callback supplied by the parent layout.
 *
 * Notes:
 *  - Renders no <html> or <body>. Use it inside a route-group layout.
 *  - Props are serializable (strings + children), except `onLogout`. A server
 *    layout can't pass a function, so render this from a small client wrapper
 *    that owns `onLogout` (e.g. calling Auth.js's `signOut`).
 *  - The header renders the page's <h1> from `title`; content passed as
 *    `children` should start at <h2>.
 */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  DASHBOARD_ROLE_CONFIG,
  type DashboardRole,
} from "../navigation";
import DashboardHeader from "./DashboardHeader";
import type { DashboardHeaderProps } from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import type { DashboardSidebarProps } from "./DashboardSidebar";

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export interface DashboardShellProps {
  /* Current user */
  userName: string;
  userEmail?: string;
  role: DashboardRole;
  avatarUrl?: string | null;

  /* Page */
  title: string;
  breadcrumbs?: DashboardHeaderProps["breadcrumbs"];
  children: ReactNode;

  /** Supplied by the parent; wire to Auth.js signOut later. */
  onLogout: () => void | Promise<void>;

  /**
   * Translated role labels. Any role left out falls back to the English
   * default from navigation.ts, so a partial map is fine.
   */
  roleLabels?: Partial<Record<DashboardRole, string>>;

  /** Optional string overrides forwarded to the existing components. */
  sidebarLabels?: DashboardSidebarProps["labels"];
  headerLabels?: DashboardHeaderProps["labels"];
  /** Label for the keyboard "skip to content" link. */
  skipToContentLabel?: string;
}

/** Matches Tailwind's `lg` breakpoint, where the sidebar becomes persistent. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/* ----------------------------------------------------------------------------
 * Shell
 * ------------------------------------------------------------------------- */

export default function DashboardShell({
  userName,
  userEmail,
  role,
  avatarUrl,
  title,
  breadcrumbs,
  children,
  onLogout,
  roleLabels,
  sidebarLabels,
  headerLabels,
  skipToContentLabel = "Skip to main content",
}: DashboardShellProps) {
  const pathname = usePathname();
  const config = DASHBOARD_ROLE_CONFIG[role];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer after navigation. This uses React's "adjust state while
  // rendering" pattern (compare against the previous pathname) instead of an
  // effect, which avoids an extra render pass and a set-state-in-effect lint
  // warning. The sidebar's links also close it on click; this covers
  // navigation from elsewhere (e.g. browser back).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  // If the viewport grows past `lg` while the drawer is open (rotating a
  // tablet, resizing a window), close it so the body-scroll lock and focus
  // trap don't linger behind the now-persistent sidebar.
  useEffect(() => {
    if (!mobileOpen) return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [mobileOpen]);

  const roleLabel = roleLabels?.[role] ?? config.defaultRoleLabel;

  return (
    <div className="flex min-h-dvh bg-[#F8FAFC] text-[#12372E]">
      {/* Visually hidden until focused, so keyboard users can skip the sidebar. */}
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#0B6B4F] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-2"
      >
        {skipToContentLabel}
      </a>

      <DashboardSidebar
        sections={config.sections}
        homeHref={config.homeHref}
        brandSubtitle={config.brandSubtitle}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        labels={sidebarLabels}
      />

      {/* min-w-0 is essential: without it, wide tables or long unbroken text in
          the page content would stretch this flex child and push the layout
          past the viewport instead of scrolling inside their own containers. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          title={title}
          breadcrumbs={breadcrumbs}
          user={{
            name: userName,
            email: userEmail,
            avatarUrl,
            roleLabel,
          }}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={onLogout}
          profileHref={config.profileHref}
          notificationsHref={role === "SUPER_ADMIN" ? "/admin/notifications" : role === "MANAGER" ? "/manager/notifications" : role === "GUIDE" ? "/guide/notifications" : role === "TEACHER" ? "/teacher/notifications" : role === "STAFF" ? "/staff/notifications" : "/student/notifications"}
          labels={headerLabels}
        />

        {/* tabIndex={-1} lets the skip link move focus here without making
            <main> a tab stop. */}
        <main
          id="dashboard-main"
          tabIndex={-1}
          className="flex-1 px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}