import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";
import { cn } from "./utils";

export type SectionHeadingProps = {
  eyebrow?: ReactNode;
  /** Can include <GradientText> for a restrained accent. */
  title: ReactNode;
  description?: ReactNode;
  /** "left" means inline-start: it flips to the right in RTL. */
  align?: "left" | "center";
  size?: "default" | "large" | "hero";
  /** Any CSS length, e.g. "40rem". Defaults by size. */
  maxWidth?: string;
  animate?: boolean;
  as?: "h1" | "h2" | "h3";
  tone?: "default" | "onDark";
  className?: string;
};

const TITLE = {
  default: "text-3xl sm:text-4xl lg:text-5xl",
  large: "text-4xl sm:text-5xl lg:text-6xl",
  hero: "text-5xl sm:text-6xl lg:text-7xl",
} as const;

const DESCRIPTION = {
  default: "text-base sm:text-lg",
  large: "text-lg sm:text-xl",
  hero: "text-lg sm:text-xl lg:text-[1.375rem]",
} as const;

const MAX_WIDTH = { default: "40rem", large: "48rem", hero: "56rem" } as const;

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "default",
  maxWidth,
  animate = false,
  as: Heading = "h2",
  tone = "default",
  className,
}: SectionHeadingProps) {
  const dark = tone === "onDark";
  const centered = align === "center";

  const content = (
    <div
      className={cn(
        "flex flex-col gap-5",
        centered ? "mx-auto items-center text-center" : "items-start text-start",
        className,
      )}
      style={{ maxWidth: maxWidth ?? MAX_WIDTH[size] }}
    >
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Heading
        className={cn(
          "text-balance font-semibold leading-[1.1] rtl:leading-[1.45] ltr:tracking-tight",
          TITLE[size],
          dark ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "text-pretty leading-relaxed rtl:leading-loose",
            DESCRIPTION[size],
            dark ? "text-white/75" : "text-text-secondary",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );

  return animate ? <Reveal>{content}</Reveal> : content;
}
