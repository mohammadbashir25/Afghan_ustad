/**
 * Root layout for /login. The project has no app/layout.tsx, so routes
 * outside [locale] and the dashboards must render their own <html> and <body>.
 */

import type { ReactNode } from "react";

// Use the same global stylesheet import as app/admin/layout.tsx.
import "../globals.css";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}