import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShellClient from "@/components/dashboard/Layout/DashboardShellClient";
import "../globals.css";
export default async function GuideLayout({children}:{children:ReactNode}){const session=await auth();if(!session?.user)redirect("/login");if(session.user.role!=="GUIDE"){if(session.user.role==="STUDENT")redirect("/student");if(session.user.role==="SUPER_ADMIN")redirect("/admin");if(session.user.role==="MANAGER")redirect("/manager");if(session.user.role==="TEACHER")redirect("/teacher");if(session.user.role==="STAFF")redirect("/staff");redirect("/login");}return <html lang="en" dir="ltr"><body><DashboardShellClient userName={session.user.name?.trim()||session.user.email||"Guide"} userEmail={session.user.email??undefined} role="GUIDE">{children}</DashboardShellClient></body></html>}
