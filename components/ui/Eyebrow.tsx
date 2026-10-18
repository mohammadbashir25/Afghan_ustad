import type { ReactNode } from "react";
import { cn } from "./utils";

export type EyebrowProps = {
  children: ReactNode;
  tone?: "default" | "onDark";
  /** Short gold rule before the label. It sits on the inline-start side automatically. */
  rule?: boolean;
  className?: string;
};

/**
 * Uppercase + letter-spacing are applied to LTR only: tracking breaks the
 * letter joining in Persian/Pashto script, so RTL keeps normal spacing.
 */
export function Eyebrow({ children, tone = "default", rule = true, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-xs font-semibold rtl:text-sm ltr:uppercase ltr:tracking-[0.16em]",
        tone === "default" ? "text-primary" : "text-accent",
        className,
      )}
    >
      {rule && (
        <span
          aria-hidden
          className={cn("h-px w-8 shrink-0", tone === "default" ? "bg-accent-dark" : "bg-accent")}
        />
      )}
      {children}
    </span>
  );
}
