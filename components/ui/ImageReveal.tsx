"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import { useRef } from "react";
import { cn, EASE_OUT } from "./utils";

export type ImageRevealProps = Pick<
  ImageProps,
  "src" | "alt" | "priority" | "sizes" | "quality" | "placeholder" | "blurDataURL"
> & {
  /** CSS aspect-ratio, e.g. "4 / 5", "16 / 10". */
  aspectRatio?: string;
  objectPosition?: string;
  /** Subtle vertical drift while scrolling. */
  parallax?: boolean;
  /** Gentle settle from a slightly zoomed image. */
  zoom?: boolean;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
};

/**
 * Clip-path reveal (bottom to top). With reduced motion it becomes a plain fade:
 * no clipping, zoom or parallax. Avoid on above-the-fold LCP images.
 */
export function ImageReveal({
  src,
  alt,
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  quality,
  placeholder,
  blurDataURL,
  aspectRatio = "4 / 3",
  objectPosition = "center",
  parallax = false,
  zoom = true,
  delay = 0,
  duration = 1.1,
  once = true,
  className,
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const animated = !reduce;
  const drift = animated && parallax;
  const viewport = { once, amount: 0.25 };

  return (
    <motion.div
      ref={ref}
      className={cn("relative w-full overflow-hidden rounded-sm bg-surface-muted", className)}
      style={{ aspectRatio }}
      initial={animated ? { clipPath: "inset(100% 0% 0% 0%)" } : { opacity: 0 }}
      whileInView={animated ? { clipPath: "inset(0% 0% 0% 0%)" } : { opacity: 1 }}
      viewport={viewport}
      transition={{ duration: animated ? duration : 0.4, delay, ease: EASE_OUT }}
    >
      {/* Parallax layer: scaled past the frame so the drift never exposes an edge. */}
      <motion.div className="absolute inset-0" style={drift ? { y, scale: 1.14 } : undefined}>
        <motion.div
          className="absolute inset-0"
          initial={{ scale: animated && zoom ? 1.12 : 1 }}
          whileInView={{ scale: 1 }}
          viewport={viewport}
          transition={{ duration: animated ? duration * 1.4 : 0, delay, ease: EASE_OUT }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            className="object-cover"
            style={{ objectPosition }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
