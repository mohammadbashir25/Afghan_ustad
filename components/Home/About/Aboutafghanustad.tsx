"use client";

/**
 * AboutAfghanUstad
 * ---------------------------------------------------------------------------
 * Section shell: arranges the narrative half and the visual half.
 *
 *   LTR:  [ narrative ][ visual ]
 *   RTL:  [ visual ][ narrative ]   (mirrored by the browser via `dir`)
 *
 * The critical layout primitives (container width, side padding, vertical
 * rhythm, two-column grid) are written as inline styles ON PURPOSE. They
 * cannot be lost to a Tailwind `@source` miss, a stale dev-server cache or an
 * unlayered CSS reset, so the section can never collapse to edge-to-edge
 * text again. Everything decorative still uses Tailwind + your theme tokens.
 *
 * The grid uses `auto-fit`: two columns on desktop, one on tablet/mobile,
 * with no locale branching.
 */
import type { CSSProperties } from "react";
import { MotionConfig } from "framer-motion";

import AboutContent from "./AboutContent";
import AboutVisual from "./AboutVisual";

/** Vertical rhythm + positioning context for the decorative layers. */
const sectionStyle: CSSProperties = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  paddingBlock: "clamp(4.5rem, 9vw, 8rem)",
};

/** Centered container matching the rest of the landing page (~80rem). */
const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "80rem",
  marginInline: "auto",
  paddingInline: "clamp(1.5rem, 4vw, 2rem)",
};

/** Two columns when there is room (>= 2 x 26rem), otherwise stacked. */
const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))",
  alignItems: "center",
  gap: "clamp(3rem, 6vw, 6rem)",
};

export default function AboutAfghanUstad(): React.JSX.Element {
  return (
    // `reducedMotion="user"` makes Framer drop transform animations for
    // visitors who enable prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <section
        id="about"
        aria-labelledby="about-heading"
        style={sectionStyle}
        className="bg-background"
      >
        {/* Decorative depth: a soft green wash from the end edge and a
            gold glow low on the start edge. Purely visual, aria-hidden. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_100%_0%,rgba(230,244,238,0.9),transparent_60%),radial-gradient(40rem_28rem_at_0%_100%,rgba(255,244,194,0.55),transparent_65%)]"
        />

        <div style={containerStyle}>
          <div style={gridStyle}>
            <AboutContent />
            <AboutVisual />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}