// Shared helpers. No "use client" here so server components can import `cn`.
// Note: there is no tailwind-merge — avoid passing className overrides that
// conflict with a component's own utilities (e.g. a different padding).

export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

/** One easing + timing language for every animated component. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const MOTION = {
  duration: 0.7,
  distance: 24,
  stagger: 0.08,
} as const;
