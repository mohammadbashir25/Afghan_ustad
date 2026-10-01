import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./utils";

export type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label" | "children"> & {
  /** Required accessible name. */
  label: string;
  /** The icon. */
  children: ReactNode;
  variant?: "ghost" | "outline" | "solid";
  size?: "sm" | "md" | "lg";
  /** Mirror directional icons (chevrons, arrows) in RTL. */
  flipOnRtl?: boolean;
  /** Shows `label` as a visual tooltip on hover/focus (the aria-label still names the button). */
  tooltip?: boolean;
};

const VARIANT = {
  ghost: "text-foreground hover:bg-primary-light",
  outline: "border border-border-strong text-foreground hover:border-primary hover:bg-primary-light/50",
  solid: "bg-primary text-white hover:bg-primary-dark",
} as const;

const SIZE = { sm: "size-9 text-base", md: "size-11 text-lg", lg: "size-14 text-xl" } as const;

export function IconButton({
  label,
  children,
  variant = "ghost",
  size = "md",
  flipOnRtl = false,
  tooltip = false,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center rounded-md",
        "transition-[background-color,color,border-color,transform] duration-300 ease-out active:scale-95",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      <span aria-hidden className={cn("inline-flex", flipOnRtl && "rtl:-scale-x-100")}>
        {children}
      </span>
      {tooltip && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-full z-10 mt-2 whitespace-nowrap rounded-sm bg-primary-dark px-2 py-1 text-xs font-normal text-white",
            "start-1/2 -translate-x-1/2 rtl:translate-x-1/2 opacity-0 transition-opacity duration-200",
            "group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
}
