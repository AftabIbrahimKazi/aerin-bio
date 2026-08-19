"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import EkgDivider from "@/components/visuals/EkgDivider";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Capability = {
  code: string;
  tag: string;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  panel: "background" | "background-1";
};

// Static, literal Tailwind classes (not runtime-interpolated arbitrary
// values) so the JIT compiler can actually find and generate them — see
// css-standards RULE 14, no inline `style` prop, which this sidesteps.
const STICKY_TOP = ["top-[4.5rem]", "top-[7rem]", "top-[9.5rem]", "top-[12rem]"];

const CAPABILITIES: Capability[] = [
  {
    code: "CF",
    tag: "Formulation",
    title: "Custom Formulation Development",
    tagline: "Turning a molecule into an inhalable therapy.",
    description:
      "We engineer particle size, charge, and stability profile around each biologic individually — a formulation built for the airway, not adapted from an injectable.",
    bullets: ["Particle Engineering", "Stability Testing"],
    panel: "background",
  },
  {
    code: "ID",
    tag: "Device",
    title: "Inhaler Device Partnership",
    tagline: "Hardware that matches the formulation, not the other way around.",
    description:
      "We work alongside device partners from early development so the inhaler's mechanics and the formulation's particle behavior are calibrated together, not reconciled after the fact.",
    bullets: ["Device Calibration", "Human Factors"],
    panel: "background-1",
  },
  {
    code: "CM",
    tag: "Manufacturing",
    title: "Clinical-Stage Manufacturing",
    tagline: "Bench-scale batches to trial-ready supply.",
    description:
      "Aseptic fill-finish and process controls proven to hold particle integrity from a handful of vials to commercial-scale runs, without reformulating between stages.",
    bullets: ["Aseptic Fill-Finish", "Process Controls"],
    panel: "background",
  },
  {
    code: "RS",
    tag: "Regulatory",
    title: "Regulatory Support for Inhaled Route",
    tagline: "Inhaled biologics are a newer regulatory path — we've walked it before.",
    description:
      "Our regulatory team has anticipated reviewer questions on deep-lung deposition, device-drug combination filings, and inhaled-route safety data across multiple programs.",
    bullets: ["Submission Strategy", "Agency Liaison"],
    panel: "background-1",
  },
];

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Header only — the cards below get their own per-card entrance + recede
  // choreography, not this generic batch.
  useScrollReveal(sectionRef, { y: 32, blur: 10, duration: 1 });

  // Per-card entrance pop as each card scrolls in (rather than all four
  // popping together on section entry, which is what made the stack feel
  // bland — most cards were still off the bottom of the viewport when a
  // single batch fired). No scroll-tied recede/dim on top of that — an
  // earlier version dimmed each card as soon as the *next* card's wrapper
  // merely entered the viewport, well before it actually started covering
  // the current one, so cards were fading out while still being read.
  // Covering is left to the plain CSS sticky stacking, same as the
  // section's original behavior.
  useEffect(() => {
    const panels = panelRefs.current.filter((el): el is HTMLDivElement => !!el);
    const wrappers = wrapperRefs.current.filter((el): el is HTMLDivElement => !!el);
    if (panels.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(panels, { opacity: 1, scale: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      panels.forEach((panel, i) => {
        gsap.from(panel, {
          opacity: 0,
          scale: 0.92,
          y: 48,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: wrappers[i], start: "top 90%", once: true },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="capabilities" ref={sectionRef} className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div data-reveal className="flex flex-col items-center text-center">
          <Eyebrow reveal={false}>Capabilities</Eyebrow>
          <SectionHeading reveal={false} className="mt-4 max-w-lg">
            What we bring to a program.
          </SectionHeading>
        </div>

        {/* Sticky-stack: each card pins at a progressively lower offset than
            the one before it, so the next card slides up and covers most of
            the previous — a peek of each earlier card's top edge stays
            visible behind it, pure CSS, no scroll-driven JS needed. */}
        <div className="relative mt-12 sm:mt-16">
          {CAPABILITIES.map((capability, i) => (
            <div
              key={capability.code}
              ref={(el) => {
                wrapperRefs.current[i] = el;
              }}
              className={`sticky ${STICKY_TOP[i]}`}
            >
              <div
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                className={`relative overflow-hidden rounded-[2rem] border border-[color:var(--foreground)]/10 p-8 shadow-2xl shadow-black/10 sm:p-10 ${
                  capability.panel === "background-1"
                    ? "bg-[color:var(--background-1)] text-[color:var(--foreground-1)]"
                    : "bg-[color:var(--background)] text-[color:var(--foreground)]"
                }`}
              >
                <span className="absolute right-6 top-6 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-[color:var(--color-culture)]/15 text-center">
                  <span className="font-[family-name:var(--font-mono)] text-lg font-semibold leading-none text-[color:var(--color-culture-dim)]">
                    {capability.code}
                  </span>
                  <span className="mt-1 text-[0.55rem] uppercase tracking-wide opacity-90">{capability.tag}</span>
                </span>

                {/* pr-20 reserves clearance for the absolutely-positioned
                    code badge above (h-14 w-14 at right-6 top-6) — without
                    it, a title long enough to wrap on a narrow panel runs
                    full-width and its second line sits directly under the
                    badge. sm: panels are wide enough that titles don't wrap
                    into the badge's row, so the reservation isn't needed. */}
                <h3 className="max-w-md pr-20 text-xl font-semibold tracking-tight sm:pr-0 sm:text-3xl">
                  {capability.title}
                </h3>
                <p className="mt-4 max-w-md text-sm font-semibold italic sm:text-base">{capability.tagline}</p>

                <div className="relative mt-6 grid gap-6 pt-6 sm:grid-cols-2">
                  <EkgDivider orientation="horizontal" className="top-0" />
                  <p className="text-sm leading-relaxed opacity-90">{capability.description}</p>
                  <ul className="flex flex-col gap-3">
                    {capability.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2 text-sm">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-culture)]"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
