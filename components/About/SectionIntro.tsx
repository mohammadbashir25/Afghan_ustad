/**
 * SectionIntro
 * ---------------------------------------------------------------------------
 * Eyebrow + heading + optional description, shared by every About section so
 * the page keeps one typographic voice.
 *
 * It is plain markup: the parent wraps it in a motion element, so reveal
 * timing stays a section-level decision.
 *
 * Arabic-script note: headings use line-height 1.5 because Dari and Pashto
 * have tall ascenders/descenders and dots that clip at tighter values.
 *
 * (Written locally because the existing SectionHeading/Eyebrow props aren't
 * visible to the generator; swap them in here, in one place.)
 */
interface SectionIntroProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  /** "dark" is for use on the deep-green sections. */
  readonly tone?: "light" | "dark";
  /** Id for aria-labelledby on the parent section. */
  readonly headingId?: string;
}

export default function SectionIntro({
  eyebrow,
  title,
  description,
  tone = "light",
  headingId,
}: SectionIntroProps): React.JSX.Element {
  const isDark = tone === "dark";

  return (
    <div className="text-start">
      <p
        className={`flex items-center gap-3 text-sm font-semibold ${
          isDark ? "text-accent-light" : "text-primary"
        }`}
      >
        <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className={`mt-5 max-w-2xl text-balance text-3xl font-bold leading-[1.5] sm:text-4xl xl:text-5xl xl:leading-[1.45] ${
          isDark ? "text-surface" : "text-primary-dark"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 max-w-xl text-base leading-[2] sm:text-lg ${
            isDark ? "text-primary-light/80" : "text-text-secondary"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
