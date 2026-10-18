"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import DashboardShellClient from "./DashboardShellClient";
export default function StudentPortalFrame({ children, userName, userEmail }: { children: ReactNode; userName: string; userEmail?: string }) {
 const pathname = usePathname();
 if (pathname === "/student/login") return <>{children}</>;
 return <DashboardShellClient role="STUDENT" userName={userName} userEmail={userEmail}>{children}</DashboardShellClient>;
}
