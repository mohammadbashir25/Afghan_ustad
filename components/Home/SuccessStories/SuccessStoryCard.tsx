"use client";

/**
 * SuccessStoryCard
 * ---------------------------------------------------------------------------
 * Role: presents ONE story as an editorial spread, not a generic quote box.
 *
 *   image side : tall rounded frame, offset gold plate, optional category chip
 *   story side : large quote glyph, the story in generous type, name + role,
 *                and an "outcome" strip with a gold start-edge rule
 *
 * It is purely presentational and data-agnostic:
 * - real photo, name, story, outcome, role and category are all optional
 *   except name + story; missing fields are skipped, so the layout never
 *   needs to change when a different story arrives.
 * - If a field still holds the placeholder marker (only possible in preview
 *   mode) it is shown as an obvious dashed "placeholder" chip, never as if it
 *   were real content.
 *
 * Also exports `StoryImageFrame`, the shared frame the section's empty state
 * reuses so that real stories later drop into an identical composition.
 *
 * RTL: logical utilities only (start/end, border-s, text-start); the plate
 * offset and the quote glyph are mirrored with `rtl:`.
 */
import { useId, type ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { LuImage, LuQuote, LuTarget, LuUser } from "react-icons/lu";

import {
  isPending,
  resolveText,
  type ResolvedText,
  type SuccessStory,
} from "./data";

/* ----------------------------- Shared pieces ------------------------------ */

interface StoryImageFrameProps {
  /** Frame content (photo or placeholder). Must fill its parent. */
  readonly children: ReactNode;
  /** Draw the dashed outline used by empty/placeholder states. */
  readonly dashed?: boolean;
}

/**
 * StoryImageFrame
 * The visual anchor: a tall rounded frame with a gold-tint plate offset
 * behind it. The plate is the section's "subtle accent treatment".
 */
export function StoryImageFrame({
  children,
  dashed = false,
}: StoryImageFrameProps): React.JSX.Element {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Offset plate; mirrored so it always peeks out on the end side. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] bg-accent-light rtl:-translate-x-3"
      />
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-primary-light ${
          dashed ? "border-2 border-dashed border-primary/30" : "border border-border"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Lattice + icon shown when there is no real photo.
 * With a `label` it reads as a placeholder (image icon + text); without one
 * it is a calm, finished-looking portrait frame (person icon only), used for
 * real stories that simply have no photo yet.
 */
export function PhotoPlaceholder({ label }: { readonly label?: string }): React.JSX.Element {
  const patternId = useId();
  return (
    <div className="absolute inset-0 text-primary">
      <svg aria-hidden="true" className="absolute inset-0 size-full opacity-[0.12]">
        <defs>
          <pattern id={patternId} width="64" height="64" patternUnits="userSpaceOnUse">
            <path
              d="M13 13H51V51H13Z M32 4L60 32L32 60L4 32Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-surface shadow-[0_12px_30px_-12px_rgba(5,59,46,0.5)]">
          {label ? (
            <LuImage aria-hidden="true" className="size-7" strokeWidth={1.5} />
          ) : (
            <LuUser aria-hidden="true" className="size-7" strokeWidth={1.5} />
          )}
        </span>
        {label ? (
          <span className="text-sm font-medium leading-relaxed text-text-secondary">{label}</span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * StoryText
 * Renders resolved text. Real text is plain; the placeholder marker becomes
 * an unmistakable dashed chip so it can never pass as real content.
 */
function StoryText({ resolved }: { readonly resolved: ResolvedText }): React.JSX.Element {
  if (resolved.isPending) {
    return (
      <span className="rounded-md border border-dashed border-border-strong bg-surface-muted px-2 py-0.5 text-[0.85em] font-medium text-text-secondary">
        {resolved.value}
      </span>
    );
  }
  return <>{resolved.value}</>;
}

/* ---------------------------------- Card ---------------------------------- */

interface SuccessStoryCardProps {
  readonly story: SuccessStory;
}

export default function SuccessStoryCard({ story }: SuccessStoryCardProps): React.JSX.Element {
  const t = useTranslations("landing.successStories");
  const locale = useLocale();

  // Resolve every field for the active locale; absent fields become null.
  const name = resolveText(story.studentName, locale);
  const body = resolveText(story.story, locale);
  const outcome = resolveText(story.outcome, locale);
  const role = resolveText(story.role, locale);
  const category = resolveText(story.category, locale);
  const imageAlt = resolveText(story.image?.alt, locale);

  // A real photo needs a real src; otherwise the designed frame is drawn.
  const hasPhoto = story.image !== undefined && !isPending(story.image.src);

  // Any placeholder marker in name/story means preview mode: label the frame
  // as a placeholder. Real stories without a photo get a quiet portrait frame.
  const isPlaceholderStory = Boolean(name?.isPending || body?.isPending);

  return (
    <article className="grid items-center gap-10 text-start md:grid-cols-12 md:gap-14">
      {/* ------------------------------ Image side ----------------------------- */}
      <div className="md:col-span-5">
        <StoryImageFrame dashed={!hasPhoto && isPlaceholderStory}>
          {hasPhoto && story.image ? (
            <>
              <Image
                src={story.image.src}
                alt={imageAlt && !imageAlt.isPending ? imageAlt.value : (name?.value ?? "")}
                width={story.image.width}
                height={story.image.height}
                sizes="(min-width: 768px) 32vw, 90vw"
                className="absolute inset-0 size-full object-cover"
              />
              {/* Soft fade so the category chip stays readable on any photo. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary-dark/55 to-transparent"
              />
            </>
          ) : (
            <PhotoPlaceholder
              label={isPlaceholderStory ? t("card.imagePlaceholder") : undefined}
            />
          )}

          {category ? (
            <span className="absolute bottom-4 start-4 rounded-full bg-surface px-3.5 py-1.5 text-xs font-bold text-primary shadow-[0_8px_20px_-10px_rgba(5,59,46,0.6)]">
              <StoryText resolved={category} />
            </span>
          ) : null}
        </StoryImageFrame>
      </div>

      {/* ------------------------------ Story side ----------------------------- */}
      <div className="min-w-0 md:col-span-7">
        {/* The single gold touch: the quote glyph. Mirrors in RTL. */}
        <LuQuote
          aria-hidden="true"
          className="size-12 text-accent rtl:-scale-x-100"
          strokeWidth={1.5}
        />

        <blockquote className="mt-5">
          <p className="text-xl font-medium leading-[2] text-primary-dark sm:text-2xl sm:leading-[1.95]">
            {body ? <StoryText resolved={body} /> : null}
          </p>

          <footer className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6">
            {name ? (
              <cite className="text-lg font-bold not-italic text-foreground">
                <StoryText resolved={name} />
              </cite>
            ) : null}
            {role ? (
              <span className="text-sm text-text-secondary">
                <StoryText resolved={role} />
              </span>
            ) : null}
          </footer>
        </blockquote>

        {/* Outcome strip: gold rule on the start edge (logical, so it flips). */}
        {outcome ? (
          <div className="mt-7 flex gap-4 rounded-2xl border border-border border-s-4 border-s-accent bg-primary-light p-5">
            <LuTarget aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary">{t("card.outcomeLabel")}</p>
              <p className="mt-1 text-base font-semibold leading-[1.9] text-primary-dark">
                <StoryText resolved={outcome} />
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}