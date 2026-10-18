import type { ReactNode } from "react";
import "../globals.css";
export default function StudentAuthLayout({ children }: { children: ReactNode }) {
  return <html lang="en" dir="ltr"><body>{children}</body></html>;
}
