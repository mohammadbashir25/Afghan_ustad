import { cn } from "./utils";

export type DividerProps = {
  orientation?: "horizontal" | "vertical";
  tone?: "default" | "strong";
  /** Fade out toward the inline-end edge (flips in RTL). Horizontal only. */
  fade?: boolean;
  /** Decorative dividers are hidden from assistive tech. Set false for a meaningful separator. */
  decorative?: boolean;
  className?: string;
};

export function Divider({
  orientation = "horizontal",
  tone = "default",
  fade = false,
  decorative = true,
  className,
}: DividerProps) {
  const horizontal = orientation === "horizontal";
  const color = tone === "strong" ? "bg-border-strong" : "bg-border";
  const fadeColor =
    tone === "strong"
      ? "bg-linear-to-r rtl:bg-linear-to-l from-border-strong to-transparent"
      : "bg-linear-to-r rtl:bg-linear-to-l from-border to-transparent";

  return (
    <div
      {...(decorative ? { "aria-hidden": true } : { role: "separator", "aria-orientation": orientation })}
      className={cn(
        "shrink-0",
        horizontal ? "h-px w-full" : "w-px self-stretch",
        horizontal && fade ? fadeColor : color,
        className,
      )}
    />
  );
}
