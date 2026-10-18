"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { cn } from "./utils";

// Internal navigation: swap the import above for next-intl's Link
// (from your i18n navigation file) to get locale-aware hrefs.
// Interaction is CSS-driven (transition + active scale) so native button/link
// behaviour and accessibility are untouched; Framer Motion is used in MagneticButton.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonBase = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  /** Mirror the icon in RTL (arrows, chevrons). */
  flipIconOnRtl?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidthOnMobile?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonAsButton = ButtonBase &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonBase> & {
    href?: undefined;
  };

export type ButtonAsLink = ButtonBase &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonBase | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE =
  "group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-md font-medium whitespace-nowrap " +
  "transition-[background-color,color,border-color,transform] duration-300 ease-out active:scale-[0.98] " +
  "motion-reduce:transition-none motion-reduce:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  // Deep green with a thin gold line that draws in from the inline-start edge on hover.
  primary:
    "bg-primary text-white hover:bg-primary-dark " +
    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent " +
    "after:transition-transform after:duration-500 after:ease-out rtl:after:origin-right hover:after:scale-x-100 " +
    "motion-reduce:after:transition-none",
  secondary: "bg-primary-light text-primary-dark hover:bg-accent-light",
  outline:
    "border border-border-strong text-foreground hover:border-primary hover:bg-primary-light/50",
  ghost: "text-primary-dark hover:bg-primary-light",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

function Spinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 animate-spin motion-reduce:animate-none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "start",
    flipIconOnRtl = false,
    loading = false,
    disabled = false,
    fullWidthOnMobile = false,
    className,
    children,
    ...rest
  } = props;

  const isDisabled = disabled || loading;
  const classes = cn(
    BASE,
    VARIANT[variant],
    SIZE[size],
    "[&_svg]:size-[1.1em]",
    fullWidthOnMobile && "w-full sm:w-auto",
    className,
  );

  const iconSlot = icon ? (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0",
        flipIconOnRtl && "rtl:-scale-x-100",
        iconPosition === "end" &&
          "transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0",
      )}
    >
      {icon}
    </span>
  ) : null;

  const content = (
    <>
      {loading ? <Spinner /> : iconPosition === "start" && iconSlot}
      {children != null && <span>{children}</span>}
      {!loading && iconPosition === "end" && iconSlot}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <Link
        {...rest}
        className={classes}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        tabIndex={isDisabled ? -1 : rest.tabIndex}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          rest.onClick?.(event);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      {...rest}
      type={rest.type ?? "button"}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}
