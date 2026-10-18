import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: Parameters<typeof intlMiddleware>[0]) {
  const { pathname } = request.nextUrl;

  // Keep dashboard and API routes outside locale routing.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/manager" ||
    pathname.startsWith("/manager/") ||
    pathname === "/guide" ||
    pathname.startsWith("/guide/") ||
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/api/") ||
        pathname === "/teacher" ||
    pathname.startsWith("/teacher/") ||
    pathname === "/api"
  ) {
    return;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};