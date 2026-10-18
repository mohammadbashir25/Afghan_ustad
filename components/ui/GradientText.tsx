import type { ReactNode } from "react";
import { cn } from "./utils";

export type GradientTextProps = {
  children: ReactNode;
  /** "brand" for light backgrounds, "onDark" for primary-dark sections. */
  tone?: "brand" | "onDark";
  className?: string;
};

const TONE = {
  brand: "from-primary from-45% to-accent-dark",
  onDark: "from-accent-light to-accent",
} as const;

/** Use sparingly — one phrase per page at most. Direction flips in RTL. */
export function GradientText({ children, tone = "brand", className }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-linear-to-r rtl:bg-linear-to-l box-decoration-clone bg-clip-text py-[0.1em] text-transparent",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
