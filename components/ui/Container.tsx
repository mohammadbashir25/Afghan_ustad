import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./utils";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  size?: ContainerSize;
  as?: "div" | "section" | "header" | "footer" | "nav" | "main";
};

export function Container({ size = "xl", as: Tag = "div", className, ...props }: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12", SIZE[size], className)}
      {...props}
    />
  );
}
