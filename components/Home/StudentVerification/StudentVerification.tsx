"use client";

/**
 * StudentVerification (landing-page section)
 * ---------------------------------------------------------------------------
 * Role: introduces public student verification and hosts the check itself.
 *
 *   start side: eyebrow, heading, copy, 3-step process, trust cues, CTA
 *   end side:   a white verification card (header, form, result panel)
 *
 * State ownership
 * - THIS component owns the `VerificationState` machine
 *   (idle -> submitting -> verified | not_found | error). The form only
 *   collects input; the result only renders state. Keeping the machine here
 *   makes the API seam a single prop.
 * - `onVerify` is the only integration point (see VerifyHandler in data.ts).
 *   If it is omitted the section is honest about it: the status chip says
 *   "not connected", submit is disabled and nothing pretends to be live.
 *
 * Race / lifecycle safety
 * - Each submit aborts the previous request (AbortController) and ignores any
 *   late response, so a slow old request can never overwrite a newer one.
 * - Pending requests are aborted on unmount.
 *
 * Optional `initialState` lets designers/Storybook preview any state without
 * a backend. It does not fetch anything.
 *
 * Layout + RTL
 * - Critical container metrics are inline styles (can't be lost to a Tailwind
 *   scan miss); the two-column grid uses `auto-fit`, so it stacks on narrow
 *   screens with no breakpoints or locale branching.
 * - Only logical utilities are used, arrows are mirrored with `rtl:`.
 *
 * Note: written with light local primitives instead of the shared Button /
 * Input / Card / Container because their props aren't visible to the
 * generator; swapping them in is mechanical.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation"; // next-intl localized Link (createNavigation)
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { LuArrowRight, LuShieldCheck } from "react-icons/lu";
import { useLocale, useTranslations } from "next-intl";

import VerificationForm from "./VerificationForm";
import VerificationResult from "./VerificationResult";
import {
  STEPS,
  TRUST_CUES,
  VERIFY_PAGE_HREF,
  type VerificationQuery,
  type VerificationState,
  type VerifyHandler,
} from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Locales that read right-to-left (drives motion direction only). */
const isRtl = (locale: string): boolean => locale === "fa" || locale === "ps";

interface StudentVerificationProps {
  /** Connect the real API here. Omit it and the UI reports "not connected". */
  readonly onVerify?: VerifyHandler;
  /** Dedicated verification page for the CTA. */
  readonly verifyHref?: string;
  /** Preview a state without a backend (design review / Storybook). */
  readonly initialState?: VerificationState;
}

/**
 * Lattice treatment, in inline style so it cannot be overridden by utility
 * ordering: very low opacity, plus a radial mask centred on the card so the
 * pattern dissolves toward the text column. The SVG is mirrored in RTL, and
 * the mask mirrors with it.
 */
const LATTICE_MASK =
  "radial-gradient(ellipse 50% 65% at 85% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)";
const latticeStyle: CSSProperties = {
  color: "var(--color-accent)",
  opacity: 0.05,
  maskImage: LATTICE_MASK,
  WebkitMaskImage: LATTICE_MASK,
};

const sectionStyle: CSSProperties = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  paddingBlock: "clamp(4.5rem, 9vw, 8rem)",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "80rem",
  marginInline: "auto",
  paddingInline: "clamp(1.5rem, 4vw, 2rem)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))",
  alignItems: "center",
  gap: "clamp(3rem, 6vw, 6rem)",
};

export default function StudentVerification({
  onVerify,
  verifyHref = VERIFY_PAGE_HREF,
  initialState,
}: StudentVerificationProps): React.JSX.Element {
  const t = useTranslations("landing.verification");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();

  const [state, setState] = useState<VerificationState>(initialState ?? { phase: "idle" });

  /** The in-flight request's controller, so it can be cancelled. */
  const abortRef = useRef<AbortController | null>(null);
  /** The last submitted query, so the error state can retry it. */
  const lastQueryRef = useRef<VerificationQuery | null>(null);

  // Cancel any pending request when the section unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * Run one verification through the injected handler.
   * - resolves "verified" / "not_found" -> matching state
   * - throws                            -> error state
   * - aborted (newer submit / reset)    -> result is ignored
   */
  const runVerification = useCallback(
    async (query: VerificationQuery): Promise<void> => {
      if (!onVerify) return; // Not connected: never fake a result.

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastQueryRef.current = query;

      setState({ phase: "submitting", query });
      try {
        const outcome = await onVerify(query, controller.signal);
        if (controller.signal.aborted) return;
        setState(
          outcome.status === "verified"
            ? { phase: "verified", query, record: outcome.record }
            : { phase: "not_found", query },
        );
      } catch {
        if (controller.signal.aborted) return;
        setState({ phase: "error", query });
      }
    },
    [onVerify],
  );

  /** Cancel anything pending and return to the empty form. */
  const reset = useCallback((): void => {
    abortRef.current?.abort();
    setState({ phase: "idle" });
  }, []);

  /** Edits only clear a finished result; they never cancel a live request. */
  const handleEdit = useCallback((): void => {
    setState((current) =>
      current.phase === "idle" || current.phase === "submitting" ? current : { phase: "idle" },
    );
  }, []);

  const retry = useCallback((): void => {
    if (lastQueryRef.current) void runVerification(lastQueryRef.current);
  }, [runVerification]);

  /* -------------------------------- Motion --------------------------------- */

  // Narrative enters from the reading-start side, the card from the end side.
  const startOffset = prefersReducedMotion ? 0 : isRtl(locale) ? 28 : -28;
  const endOffset = -startOffset;

  const column: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.12 } },
  };
  const reveal: Variants = {
    hidden: { opacity: 0, x: startOffset },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.7, ease: EASE },
    },
  };
  const cardReveal: Variants = {
    hidden: { opacity: 0, x: endOffset, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.8, ease: EASE, delay: 0.15 },
    },
  };

  const isConnected = Boolean(onVerify);
  const isSubmitting = state.phase === "submitting";

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="verification"
        aria-labelledby="verification-heading"
        style={sectionStyle}
        className="bg-primary-dark text-surface"
      >
        {/* Decorative: a very faint lattice that only shows around the card
            and fades to nothing behind the text (see `latticeStyle`). */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 size-full rtl:-scale-x-100"
          style={latticeStyle}
        >
          <defs>
            <pattern id="verification-lattice" width="72" height="72" patternUnits="userSpaceOnUse">
              <path
                d="M14 14H58V58H14Z M36 4L68 36L36 68L4 36Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verification-lattice)" />
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(44rem_30rem_at_85%_50%,rgba(11,107,79,0.55),transparent_65%)]"
        />

        <div style={containerStyle}>
          <div style={gridStyle}>
            {/* ----------------------------- Narrative ---------------------------- */}
            <motion.div
              variants={column}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="min-w-0 text-start"
            >
              <motion.p
                variants={reveal}
                className="flex items-center gap-3 text-sm font-semibold text-accent-light"
              >
                <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
                {t("eyebrow")}
              </motion.p>

              <motion.h2
                id="verification-heading"
                variants={reveal}
                className="mt-5 max-w-xl text-balance text-3xl font-bold leading-[1.5] sm:text-4xl xl:text-5xl xl:leading-[1.45]"
              >
                {t("heading")}
              </motion.h2>

              <motion.p
                variants={reveal}
                className="mt-5 max-w-xl text-base leading-[2] text-primary-light/80 sm:text-lg"
              >
                {t("description")}
              </motion.p>

              {/* Process: a vertical timeline. The connector is a logical
                  start-side line, so it flips in RTL. */}
              <motion.ol variants={reveal} className="mt-10 max-w-xl">
                {STEPS.map(({ id, icon: Icon, key }, index) => (
                  <li key={id} className="relative flex gap-4 pb-7 last:pb-0">
                    {index < STEPS.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute start-6 top-12 bottom-1 w-px -translate-x-1/2 bg-surface/20 rtl:translate-x-1/2"
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-surface/20 bg-surface/10 text-accent-light"
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold">{t(`${key}.title`)}</h3>
                      <p className="mt-1 text-sm leading-[1.9] text-primary-light/75">
                        {t(`${key}.description`)}
                      </p>
                    </div>
                  </li>
                ))}
              </motion.ol>

              {/* Trust cues */}
              <motion.ul variants={reveal} className="mt-8 flex flex-wrap gap-3">
                {TRUST_CUES.map(({ id, icon: Icon, labelKey }) => (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-full border border-surface/20 px-4 py-2 text-sm text-primary-light"
                  >
                    <Icon aria-hidden="true" className="size-4 text-accent" />
                    {t(labelKey)}
                  </li>
                ))}
              </motion.ul>

              {/* CTA to the dedicated page */}
              <motion.div variants={reveal} className="mt-10">
                <Link
                  href={verifyHref}
                  className="group inline-flex items-center gap-3 rounded-xl border border-surface/40 px-6 py-3.5 text-base font-bold text-surface transition-[background-color,color,transform] duration-200 hover:bg-surface hover:text-primary-dark active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  {t("cta.page")}
                  <LuArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                  />
                </Link>
              </motion.div>
            </motion.div>

            {/* ----------------------------- Verify card -------------------------- */}
            <motion.div
              variants={cardReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="mx-auto w-full max-w-xl min-w-0"
            >
              <div className="rounded-[2rem] bg-surface p-6 text-start text-foreground shadow-[0_50px_100px_-40px_rgba(0,0,0,0.6)] sm:p-8">
                {/* Card header: emblem, title and an HONEST connection chip. */}
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-surface"
                  >
                    <LuShieldCheck className="size-7" />
                    {/* Soft ring: a quiet "secure" cue, static for reduced motion. */}
                    <motion.span
                      className="absolute inset-0 rounded-2xl border-2 border-primary"
                      animate={prefersReducedMotion ? undefined : { scale: [1, 1.25], opacity: [0.5, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold leading-[1.5] text-primary-dark">
                      {t("card.title")}
                    </h3>
                    <p className="mt-1 text-sm leading-[1.9] text-text-secondary">
                      {t("card.subtitle")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                      isConnected
                        ? "bg-primary-light text-primary"
                        : "bg-surface-muted text-text-secondary"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${isConnected ? "bg-success" : "bg-text-muted"}`}
                    />
                    {isConnected ? t("status.ready") : t("status.notConnected")}
                  </span>
                </div>

                <div className="mt-7 border-t border-border pt-7">
                  <VerificationForm
                    isAvailable={isConnected}
                    isSubmitting={isSubmitting}
                    onSubmit={(query) => void runVerification(query)}
                    onEdit={handleEdit}
                    verifyHref={verifyHref}
                  />
                </div>

                {/* Result panel: cross-fades between states; layout animates
                    the card height so nothing jumps. */}
                <motion.div layout={!prefersReducedMotion}>
                  <AnimatePresence mode="wait" initial={false}>
                    {state.phase !== "idle" ? (
                      <motion.div
                        key={state.phase}
                        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.12 } }}
                        transition={{ duration: prefersReducedMotion ? 0.01 : 0.35, ease: EASE }}
                        className="mt-6"
                      >
                        <VerificationResult state={state} onReset={reset} onRetry={retry} />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}