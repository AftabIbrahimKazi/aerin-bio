"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "@/lib/gsap";
import SmokeCanvas from "@/components/visuals/SmokeCanvas";
import { BTN_GLOW } from "@/lib/buttonStyles";

// Same traveling-wave technique as EkgDivider (Impact's "by the numbers"
// dividers) — a rise-and-fall envelope combined with a phase that travels
// along the line, rather than a single static bump, so it reads as a ripple
// passing through. Cycle count (and the stop count needed to render it
// smoothly) is bumped well past EkgDivider's own values, though — this line
// runs the full viewport width rather than a single grid cell, so
// EkgDivider's 1.75 cycles read as barely a single gentle bow across
// something this long. More crests/troughs at higher resolution instead.
const LINE_WAVE_STOPS = 41;
const LINE_WAVE_T = Array.from({ length: LINE_WAVE_STOPS }, (_, i) => i / (LINE_WAVE_STOPS - 1));
const LINE_WAVE_AMPLITUDE = 5;
const LINE_WAVE_CYCLES = 6;
const LINE_WAVE_TRAVEL = 2.2;

function lineWaveOffsets(progress: number) {
  const envelope = Math.sin(Math.PI * progress);
  const phase = progress * LINE_WAVE_TRAVEL * Math.PI * 2;
  return LINE_WAVE_T.map(
    (t) => LINE_WAVE_AMPLITUDE * envelope * Math.sin(LINE_WAVE_CYCLES * Math.PI * 2 * t - phase)
  );
}

function buildLinePath(offsets: number[]) {
  const coords = LINE_WAVE_T.map((t, i) => `${(t * 100).toFixed(2)},${(12 + offsets[i]).toFixed(2)}`);
  return `M${coords.join(" L")}`;
}

// Same wave technique again, but scaled way down for a text underline
// instead of a full-viewport-wide divider — far smaller amplitude and
// fewer cycles, since this only ever spans one short link's width.
const UNDERLINE_WAVE_STOPS = 13;
const UNDERLINE_WAVE_T = Array.from({ length: UNDERLINE_WAVE_STOPS }, (_, i) => i / (UNDERLINE_WAVE_STOPS - 1));
const UNDERLINE_WAVE_AMPLITUDE = 1.5;
const UNDERLINE_WAVE_CYCLES = 2.5;
const UNDERLINE_WAVE_TRAVEL = 1.4;

function underlineWaveOffsets(progress: number) {
  const envelope = Math.sin(Math.PI * progress);
  const phase = progress * UNDERLINE_WAVE_TRAVEL * Math.PI * 2;
  return UNDERLINE_WAVE_T.map(
    (t) => UNDERLINE_WAVE_AMPLITUDE * envelope * Math.sin(UNDERLINE_WAVE_CYCLES * Math.PI * 2 * t - phase)
  );
}

function buildUnderlinePath(offsets: number[]) {
  const coords = UNDERLINE_WAVE_T.map((t, i) => `${(t * 100).toFixed(2)},${(4 + offsets[i]).toFixed(2)}`);
  return `M${coords.join(" L")}`;
}

// Copy per project-guide-doc/aerin-bio-design-doc.md Section 6.1 — the doc's
// own hero visual note ("no other visual asset needed — background carries
// the visual weight") is superseded by this "Aerin"-as-a-window treatment,
// but the copy itself stays as spec'd.
export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const overlayRef = useRef<SVGRectElement | null>(null);
  const maskTextRef = useRef<SVGTextElement | null>(null);
  const placeholderRef = useRef<HTMLSpanElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const afterRef = useRef<HTMLDivElement | null>(null);
  const bioRef = useRef<HTMLSpanElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const linePathRef = useRef<SVGPathElement | null>(null);
  const lineTweenRef = useRef<gsap.core.Tween | null>(null);
  const underlinePathRef = useRef<SVGPathElement | null>(null);
  const underlineTweenRef = useRef<gsap.core.Tween | null>(null);
  const maskId = useId().replace(/:/g, "");
  const lineGradientId = useId().replace(/:/g, "");

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const svg = svgRef.current;
    const overlay = overlayRef.current;
    const maskText = maskTextRef.current;
    const placeholder = placeholderRef.current;
    const eyebrow = eyebrowRef.current;
    const after = afterRef.current;
    const bio = bioRef.current;
    const info = infoRef.current;
    if (!section || !stage || !svg || !overlay || !maskText || !placeholder || !eyebrow || !after || !bio || !info)
      return;

    // "Aerin" itself is a hole in a solid mask overlay (rect fill=black
    // punched out where the text sits), not any kind of scaled/clipped DOM
    // text — that's what makes the reveal a true window: the underlying
    // photo (see .hero-media below) never moves or scales, only the hole's
    // own size grows, so there is nothing to keep aligned or crossfade.
    // Position/size come from measuring `placeholder` — an invisible span
    // laid out exactly where "Aerin" reads in the wordmark — so the hole
    // starts in the same spot the word would occupy normally.
    //
    // The baseline is the part that kept coming out wrong under font-metric
    // *estimation* (canvas measureText ascent, line-box ratios — all
    // guesses). It doesn't need to be estimated at all: "Bio" has no
    // descenders (B, i, o all sit on the baseline), so a Range selecting
    // just its text node gives a tight bounding box whose bottom edge is,
    // by definition, exactly on the baseline — not approximated, geometric
    // fact for this specific word. That's what both spans share (same h1,
    // same line, same font), so it's what "Aerin" needs to sit on too.
    const layout = () => {
      const rect = placeholder.getBoundingClientRect();
      const style = getComputedStyle(placeholder);
      const fontSize = parseFloat(style.fontSize);

      // viewBox matches the svg's OWN rendered box (via its bounding rect),
      // not window.innerWidth/innerHeight — those aren't guaranteed to be
      // identical to the svg's actual CSS pixel size (e.g. any scrollbar
      // gutter, or the parent stage's box differing from the raw window
      // dimensions for any reason), and any mismatch scales every
      // coordinate drawn inside, throwing off the mask hole's position
      // relative to what getBoundingClientRect() reports in real CSS
      // pixels for placeholder/bio.
      const svgRect = svg.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${svgRect.width} ${svgRect.height}`);
      maskText.setAttribute("font-family", style.fontFamily);
      maskText.setAttribute("font-weight", style.fontWeight);
      maskText.setAttribute("font-size", String(fontSize));
      maskText.setAttribute("letter-spacing", style.letterSpacing);

      let baselineY = rect.top + rect.height;
      const bioTextNode = bio.firstChild;
      if (bioTextNode) {
        const range = document.createRange();
        range.selectNodeContents(bioTextNode);
        baselineY = range.getBoundingClientRect().bottom;
      }

      // Manual per-breakpoint correction — see --hero-baseline-offset in
      // src/app/styles/hero.css. The Range-based measurement above is
      // geometrically correct in principle, but real devices/browsers
      // introduce enough sub-pixel and viewport-metric variance that a
      // small tunable nudge per breakpoint is the practical fix; adjust
      // the token per breakpoint there, not this line.
      const offset = parseFloat(getComputedStyle(section).getPropertyValue("--hero-baseline-offset")) || 0;
      baselineY += offset;

      maskText.setAttribute("x", String(rect.left + rect.width / 2));
      maskText.setAttribute("y", String(baselineY));
      return fontSize;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No pin, no growth — the hole stays at its resting size, so "Aerin"
      // simply reads as a normal (if photo-filled) word, and everything
      // else — including info typography — is shown at once in normal
      // document flow rather than gated behind scroll.
      layout();
      gsap.set(overlay, { opacity: 1 });
      gsap.set(info, { opacity: 1, y: 0, filter: "blur(0px)", position: "static" });
      // Width-only guard — see the matching comment below on the pinned
      // path's onResize for why.
      let lastWidth = window.innerWidth;
      const onResize = () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        layout();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let trigger: ScrollTrigger | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let lastWidth = window.innerWidth;
    let cancelled = false;

    const ctx = gsap.context(() => {
      gsap.set(info, { opacity: 0, y: 24, filter: "blur(8px)" });

      const build = () => {
        trigger?.kill();
        const restSize = layout();
        const targetSize = Math.max(window.innerWidth, window.innerHeight) * 3;
        gsap.set(overlay, { opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${window.innerHeight * 3}`,
            scrub: 0.8,
            pin: stage,
          },
        });

        // Eyebrow + subhead/CTAs/hint clear out first.
        tl.to([eyebrow, after], { opacity: 0, y: -32, filter: "blur(6px)", duration: 0.6, ease: "power2.in" }, 0)
          // "Bio" fades away, leaving "Aerin" — the hole — to carry the rest
          // of the sequence on its own.
          .to(bio, { opacity: 0, duration: 0.5 }, 0.4)
          // The hole itself grows — not a transform, an actual font-size
          // increase on the mask's <text>, so the photo it reveals is
          // always shown at its real, unscaled size underneath. This alone
          // gets the letters large enough to dominate the frame, but can't
          // by itself guarantee a perfectly clean full-bleed result — a
          // glyph's own counters (the "o" hole, the "e" bowl) stay
          // overlay-colored no matter how large the letter gets, since
          // they're holes within the hole. So the very end of this same
          // beat is finished off by fading the whole overlay's remaining
          // sliver away below, once the letters already fill nearly the
          // whole frame — a fade so small by that point it reads as
          // completion, not a swap.
          .fromTo(
            maskText,
            { attr: { "font-size": restSize } },
            { attr: { "font-size": targetSize }, duration: 2.2, ease: "power1.in" },
            0.75
          )
          .to(overlay, { opacity: 0, duration: 0.5, ease: "power2.out" }, 2.6)
          // Info typography — the bridge into the next section.
          .to(info, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out" }, 2.9);

        trigger = tl.scrollTrigger;
      };

      build();

      // Re-measure once web fonts are actually active. `layout()`'s first
      // run can land before next/font's Geist/Fragment Mono has swapped in
      // — the fallback font renders "Aerin"/"Bio" at the same declared
      // font-size but with different character metrics, so the mask's x/y
      // (measured against the fallback) can end up wrong for the real
      // font's layout, most visible on narrow screens where the fluid
      // clamp() font-size is already close to the edge of fitting on one
      // line. `document.fonts.ready` resolves once every used font has
      // actually loaded and applied.
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(() => {
          if (cancelled) return;
          build();
        });
      }

      // Same debounced full-rebuild pattern as PeopleOrbit — the mask's
      // hole position/size are measured in real pixels, so a viewport
      // resize needs a fresh measurement and a fresh timeline, not just a
      // ScrollTrigger.refresh(). Width-only guard: mobile browsers fire a
      // `resize` event when the address bar collapses/expands during
      // scroll, changing only innerHeight. This section is pinned for a
      // 3-viewport-height scroll distance, so that spurious resize was
      // firing mid-scroll, killing and rebuilding the timeline (and its
      // scroll-linked mask font-size tween) mid-transition — leaving
      // "Aerin" stuck at whatever intermediate size the old timeline had
      // reached instead of either its resting or fully-grown size. Layout
      // here is otherwise entirely width-responsive, so skipping
      // height-only changes is safe.
      const onResize = () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
      };
      window.addEventListener("resize", onResize);

      return () => window.removeEventListener("resize", onResize);
    }, section);

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      ctx.revert();
      trigger?.kill();
    };
  }, []);

  // "Request a technical brief"'s underline — same ripple-on-hover
  // technique as the divider/brand-name line above, just hover/focus-only
  // (no auto-play-on-scroll-into-view; it's near the top of an already-
  // visible section, so that would just fire immediately and add nothing).
  const runUnderlineWave = () => {
    const path = underlinePathRef.current;
    if (!path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    underlineTweenRef.current?.kill();
    const state = { progress: 0 };
    underlineTweenRef.current = gsap.to(state, {
      progress: 1,
      duration: 0.7,
      ease: "sine.inOut",
      onUpdate: () => path.setAttribute("d", buildUnderlinePath(underlineWaveOffsets(state.progress))),
    });
  };

  // Decorative gradient line's own wave — fully independent of the
  // pin/zoom effect above (separate effect, own refs), so it can't
  // interfere with that working mechanic. Same trigger/run pattern as
  // EkgDivider: fires once automatically when it scrolls into view (it's
  // already in view on load here, so this plays almost immediately), and
  // again on every hover/focus.
  const runLineWave = () => {
    const path = linePathRef.current;
    if (!path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lineTweenRef.current?.kill();
    const state = { progress: 0 };
    lineTweenRef.current = gsap.to(state, {
      progress: 1,
      duration: 1.1,
      ease: "sine.inOut",
      onUpdate: () => path.setAttribute("d", buildLinePath(lineWaveOffsets(state.progress))),
    });
  };

  useEffect(() => {
    const path = linePathRef.current;
    if (!path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runLineWave();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(path);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="hero" ref={sectionRef} className="relative text-[color:var(--foreground)]">
      <div ref={stageRef} className="relative flex h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Hero photo — fitted to the stage, static, never scaled or faded.
            Only ever visible through the mask overlay's hole below. */}
        <div className="hero-media pointer-events-none absolute inset-0" aria-hidden />

        {/* Mask overlay — solid var(--background) everywhere except a
            "Aerin"-shaped hole (white rect + black text = punched-out mask,
            standard SVG technique), so the page looks completely normal
            except where the word is a window onto the photo above. */}
        <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            {/* Mask region and its white base rect both overscan past 0–100%
                — bound exactly to the viewport, browsers can round/clip a
                thin sliver right at the edge (that's the top-edge sliver of
                unmasked photo you saw), so this deliberately covers more
                than the visible area to guarantee no edge is ever exposed. */}
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-10%" y="-10%" width="120%" height="120%">
              <rect x="-10%" y="-10%" width="120%" height="120%" fill="white" />
              <text ref={maskTextRef} fill="black" textAnchor="middle" dominantBaseline="alphabetic">
                Aerin
              </text>
            </mask>
          </defs>
          <rect
            ref={overlayRef}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            fill="var(--background)"
            mask={`url(#${maskId})`}
          />
        </svg>

        {/* The site-wide smoke (SmokeBackground, in layout.tsx) sits behind
            all page content, so it's invisible here — Hero's photo and mask
            overlay are both fully opaque and paint over it completely. This
            is a second, independent instance stacked directly above those
            two layers (but still below the z-10 chrome text below) so the
            same cursor-reactive smoke reads on top of the mask's solid
            color and the photo alike. Canvas is transparent everywhere it
            isn't actively drawing a particle, so it doesn't hide either
            layer — it only adds soft light on top, same as it does
            everywhere else on the page. */}
        <SmokeCanvas className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <p
            ref={eyebrowRef}
            className="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-culture)]"
          >
            Inhaled biologic therapeutics
          </p>

          <div className="relative">
            {/* Decorative gradient line — sits behind the wordmark (DOM
                order places it first, and it carries no z-index, so the h1
                below — which does no z-index either — paints on top of it
                within this shared stacking context). Ends of the *screen*,
                not just this wrapper: `left-1/2 w-screen -translate-x-1/2`
                is the standard full-bleed breakout — since this wrapper
                (and every ancestor up to the viewport) is horizontally
                centered, the wrapper's own 50% point coincides with the
                viewport's, so a 100vw box centered there spans truly edge
                to edge regardless of how narrow the wrapper itself is. The
                wrapper stays exactly as wide as the h1, though, which is
                what keeps this line's *vertical* position (top-1/2) locked
                to the wordmark's own center rather than the whole stage's.
                Radial, not linear — transparent through the whole central
                stretch (right where the brand text sits) and only picking
                up culture-green color out toward each end, so it never
                visually competes with the letters themselves. Solid, no
                dash. Hover/focus ripples it with the same traveling-wave
                technique as EkgDivider (Impact's dividers) — the outer div
                (not the svg) carries the pointer/focus handlers, same
                role="presentation" + tabIndex pattern EkgDivider uses, so
                the aria-hidden svg inside stays out of the a11y tree while
                still being keyboard-triggerable via its own hit zone. */}
            <div
              role="presentation"
              tabIndex={0}
              onPointerEnter={runLineWave}
              onFocus={runLineWave}
              className="absolute left-1/2 top-1/2 h-6 w-screen -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            >
              <svg
                aria-hidden="true"
                className="pointer-events-none h-full w-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 24"
              >
                <defs>
                  <radialGradient id={lineGradientId} gradientUnits="userSpaceOnUse" cx="50" cy="12" r="50">
                    <stop offset="0%" stopColor="var(--color-culture)" stopOpacity="0" />
                    <stop offset="55%" stopColor="var(--color-culture)" stopOpacity="0" />
                    <stop offset="100%" stopColor="var(--color-culture)" stopOpacity="0.7" />
                  </radialGradient>
                </defs>
                <path
                  ref={linePathRef}
                  d={buildLinePath(lineWaveOffsets(0))}
                  fill="none"
                  stroke={`url(#${lineGradientId})`}
                  strokeWidth={0.6}
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Fluid clamp() font-size, not fixed text-6xl/7xl/8xl
                breakpoints — "Aerin" and "Bio" MUST stay on one line for
                the mask-hole positioning logic above (it measures "Bio"'s
                baseline to place "Aerin"'s hole), and a fixed 60px was
                wide enough to wrap onto two lines on narrow phones,
                breaking that measurement entirely. clamp() scales
                continuously with viewport width instead of jumping
                between fixed sizes that can land on an in-between width
                still too narrow to fit — 11vw keeps "Aerin Bio" comfortably
                under the viewport at any width between the two bounds
                (2.25rem floor for the smallest phones, 6rem ceiling
                matching the original lg:text-8xl). whitespace-nowrap is
                a hard backstop against wrapping regardless. */}
            <h1 className="relative whitespace-nowrap text-[clamp(2.25rem,11vw,6rem)] font-semibold tracking-tight">
              {/* Invisible — reserves the exact box the SVG mask's hole is
                  measured against and positioned over, so "Aerin" lines up
                  with "Bio" the way normal inline text would, but the actual
                  visible word is drawn entirely by the mask above. */}
              <span ref={placeholderRef} className="invisible">
                Aerin
              </span>{" "}
              <span ref={bioRef}>Bio</span>
            </h1>
          </div>

          <div ref={afterRef} className="flex flex-col items-center gap-6">
            <p className="max-w-md text-sm text-[color:var(--foreground)]/70 sm:text-base">
              A platform built to get biologic medicine to the lung directly — engineered for deep-lung deposition,
              not adapted from an injectable.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#innovation"
                className={`${BTN_GLOW} px-6 py-3`}
              >
                See the platform
              </a>
              <a
                href="#cta"
                onMouseEnter={runUnderlineWave}
                onFocus={runUnderlineWave}
                className="link-shine relative text-sm font-medium"
              >
                Request a technical brief
                {/* Replaces a plain text-decoration underline — that can't
                    animate its own shape, so this is a small SVG path
                    instead, rippled via the same wave technique as the
                    dividers on hover/focus. */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -bottom-1 h-2 w-full overflow-visible"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                >
                  <path
                    ref={underlinePathRef}
                    d={buildUnderlinePath(underlineWaveOffsets(0))}
                    fill="none"
                    stroke="var(--foreground)"
                    strokeOpacity={0.3}
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            </div>

            <p className="text-xs text-[color:var(--foreground)]/40">
              move your cursor — like breath disturbing mist
            </p>
          </div>
        </div>

        {/* Info typography — appears once the mask's hole has grown past
            the frame, bridging the scroll into the next section. */}
        <div ref={infoRef} className="absolute inset-x-0 bottom-16 z-10 px-6 text-center sm:bottom-20">
          {/* Fixed --color-paper, not the theme-reactive --foreground this
              section inherits — this text sits on the photo, which doesn't
              change with the theme toggle, so its color shouldn't either. */}
          <p className="mx-auto max-w-lg text-lg font-semibold tracking-tight text-[color:var(--color-paper)] sm:text-2xl">
            68% deep-lung deposition. One inhaled dose, engineered to arrive.
          </p>
        </div>
      </div>
    </section>
  );
}
