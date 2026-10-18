import type { ReactNode } from "react";
import { cn } from "./utils";

export type BadgeVariant = "default" | "accent" | "success" | "muted";

export type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Optional small leading icon. */
  icon?: ReactNode;
  className?: string;
};

const VARIANT: Record<BadgeVariant, string> = {
  default: "bg-primary-light text-primary-dark",
  accent: "bg-accent-light text-foreground",
  success: "bg-success/10 text-primary-dark",
  muted: "bg-surface-muted text-text-secondary",
};

export function Badge({ children, variant = "default", icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium leading-none rtl:text-[0.8125rem]",
        VARIANT[variant],
        className,
      )}
    >
      {variant === "success" && !icon && <span aria-hidden className="size-1.5 rounded-full bg-success" />}
      {icon && (
        <span aria-hidden className="inline-flex [&_svg]:size-3.5">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
