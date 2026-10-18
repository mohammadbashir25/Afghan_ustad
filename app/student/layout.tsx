import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import StudentPortalFrame from "@/components/dashboard/Layout/StudentPortalFrame";
import { DASHBOARD_HOME } from "@/lib/users/roles";
import "../globals.css";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/student/login");
  if (session.user.role !== "STUDENT") {
    const role = session.user.role;
    redirect(role && role in DASHBOARD_HOME ? DASHBOARD_HOME[role as keyof typeof DASHBOARD_HOME] : "/login");
  }
  return <html lang="en" dir="ltr"><body><StudentPortalFrame userName={session.user.name?.trim() || session.user.email || "Student"} userEmail={session.user.email ?? undefined}>{children}</StudentPortalFrame></body></html>;
}
