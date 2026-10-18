"use client";

/**
 * DashboardShellClient
 *
 * Responsibilities:
 *  - Client boundary between the server-side role layouts and DashboardShell.
 *  - Owns the logout callback (Auth.js client `signOut`), because a Server
 *    Component can't pass a function to a Client Component.
 *  - Derives the header title and breadcrumbs from the current pathname by
 *    looking the route up in navigation.ts, so a shared layout doesn't need
 *    to know which page is rendering.
 *
 * Reusable for the other roles later: pass `role` and the matching
 * navigation, home route and subtitle are resolved from DASHBOARD_ROLE_CONFIG.
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { DASHBOARD_ROLE_CONFIG, type DashboardRole } from "../navigation";
import DashboardShell from "./DashboardShell";
import type { DashboardShellProps } from "./DashboardShell";

export interface DashboardShellClientProps {
  userName: string;
  userEmail?: string;
  role: DashboardRole;
  children: ReactNode;
}

/** Unprefixed route where users land after logging out. */
const LOGIN_ROUTE = "/login";

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardShellClient({
  userName,
  userEmail,
  role,
  children,
}: DashboardShellClientProps) {
  const pathname = usePathname();
  const config = DASHBOARD_ROLE_CONFIG[role];

  // Longest matching nav href wins, same rule the sidebar uses for highlighting.
  let currentLabel: string | null = null;
  let currentHref = "";
  for (const section of config.sections) {
    for (const item of section.items) {
      if (matchesPath(pathname, item.href) && item.href.length > currentHref.length) {
        currentHref = item.href;
        currentLabel = item.label;
      }
    }
  }

  // Routes that aren't in the navigation (e.g. a future detail page) fall back
  // to the role's subtitle so the header never renders an empty <h1>.
  const title = currentLabel ?? config.brandSubtitle;

  // No breadcrumb on the role's home page; elsewhere: Home > Current page.
  const breadcrumbs: DashboardShellProps["breadcrumbs"] =
    pathname === config.homeHref || currentLabel === null
      ? undefined
      : [{ label: config.brandSubtitle, href: config.homeHref }, { label: currentLabel }];

  async function handleLogout() {
    // `redirectTo` is the v5 option. signOut handles the CSRF token and the
    // redirect itself; no SessionProvider is required.
    await signOut({ redirectTo: role === "STUDENT" ? "/student/login" : LOGIN_ROUTE });
  }

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      role={role}
      title={title}
      breadcrumbs={breadcrumbs}
      onLogout={handleLogout}
    >
      {children}
    </DashboardShell>
  );
}