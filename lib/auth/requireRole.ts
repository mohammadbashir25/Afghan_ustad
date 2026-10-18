/**
 * Server-side role check for pages. Layouts are not a complete guard (they
 * don't re-run on every client navigation), so each page that reads or writes
 * sensitive data calls this itself.
 *
 * It redirects, which suits Server Components. API routes (step 3) will use a
 * variant that returns 401/403 instead.
 */

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { UserRole } from "@/lib/users/roles";

export async function requireRole(allowed: readonly UserRole[]) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!allowed.includes(session.user.role)) redirect("/login");

  return session;
}