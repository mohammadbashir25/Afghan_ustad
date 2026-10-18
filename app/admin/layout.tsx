/**
 * Admin layout (Server Component).
 *
 * This is a ROOT layout: the project has no app/layout.tsx (the public site's
 * root is app/[locale]/layout.tsx), so routes outside [locale] must render
 * their own <html> and <body>. Pages under /admin must not render them.
 *
 * It also guards every route under /admin and wraps it in the dashboard shell.
 */

import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import DashboardShellClient from "@/components/dashboard/Layout/DashboardShellClient";

// IMPORTANT: use the same global stylesheet import as app/[locale]/layout.tsx.
// Without it Tailwind classes won't load on /admin. Adjust the path if yours differs.
import "../globals.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // Unauthenticated, or authenticated with the wrong role: both go to /login.
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") {
    if (session.user.role === "STUDENT") redirect("/student");
    if (session.user.role === "MANAGER") redirect("/manager");
    if (session.user.role === "GUIDE") redirect("/guide");
    if (session.user.role === "TEACHER") redirect("/teacher");
    if (session.user.role === "STAFF") redirect("/staff");
    redirect("/login");
  }

  const { name, email } = session.user;

  // Safe fallbacks: name -> email -> generic label.
  const userName = name?.trim() || email || "Admin";
  const userEmail = email ?? undefined;

  return (
    <html lang="en" dir="ltr">
      <body>
        <DashboardShellClient userName={userName} userEmail={userEmail} role="SUPER_ADMIN">
          {children}
        </DashboardShellClient>
      </body>
    </html>
  );
}