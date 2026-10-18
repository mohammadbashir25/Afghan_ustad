/**
 * FinalCTA — the last conversion moment before the Footer.
 *
 * Role
 *  - Lays out the section only: a full-bleed green surface with content on the
 *    inline-start side and the visual on the inline-end side. All behaviour and
 *    animation live in CTAContent and CTAVisual, so this file is a plain server
 *    component (no "use client").
 *
 * Design choices
 *  - Echoes the Hero's split composition: the Hero has a light tinted panel on
 *    the inline-end side behind its visual; here a darker green panel sits on
 *    the same side. Both use `end-0`, so they mirror correctly in RTL.
 *  - Surface is bg-primary (not primary-dark) so it reads as a distinct
 *    "conclusion" band next to darker sections and the footer.
 *  - Yellow is used sparingly: eyebrow rule, the underlined secondary action,
 *    the final path node and the `enroll()` token.
 */

import { Container } from "@/components/ui";

import { CTAContent } from "./CTAContent";
import { CTAVisual } from "./CTAVisual";
import { FINAL_CTA_HEADING_ID } from "./data";

export function FinalCTA() {
  return (
    <section
      aria-labelledby={FINAL_CTA_HEADING_ID}
      className="relative isolate overflow-hidden bg-primary py-20 sm:py-24 lg:py-32"
    >
      {/* Darker panel behind the visual (desktop). Decorative only. */}
      <div
        aria-hidden
        className="absolute inset-y-0 end-0 -z-10 hidden w-[38%] border-s border-white/10 bg-primary-dark/45 lg:block"
      />

      <Container>
        {/* min-w-0 on both columns lets long Dari/Pashto headlines wrap instead of overflowing. */}
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10 xl:gap-16">
          <div className="min-w-0 lg:col-span-7">
            <CTAContent />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <CTAVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
