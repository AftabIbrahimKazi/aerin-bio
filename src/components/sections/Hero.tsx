"use client";

import { useEffect, useId, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import SmokeCanvas from "@/components/visuals/SmokeCanvas";
import { BTN_GLOW } from "@/lib/buttonStyles";
import { scrollToSection } from "@/lib/scrollToSection";

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

// A mobile address-bar collapse/expand shifts innerHeight by roughly
// 50-100px — comfortably under this. A real orientation change swaps
// width/height entirely, a much larger jump, so this threshold tells the
// two apart on the rare occasion a browser's first `resize` event during
// rotation reports a still-transitional width that happens to match the
// last recorded one (a real, if uncommon, mobile Safari quirk).
const HEIGHT_DRIFT_THRESHOLD = 150;

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
  const bioTextRef = useRef<SVGTextElement | null>(null);
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
    const bioText = bioTextRef.current;
    const info = infoRef.current;
    if (
      !section ||
      !stage ||
      !svg ||
      !overlay ||
      !maskText ||
      !placeholder ||
      !eyebrow ||
      !after ||
      !bio ||
      !bioText ||
      !info
    )
      return;

    // "Aerin" itself is a hole in a solid mask overlay (rect fill=black
    // punched out where the text sits), not any kind of scaled/clipped DOM
    // text — that's what makes the reveal a true window: the underlying
    // photo (see .hero-media below) never moves or scales, only the hole's
    // own size grows, so there is nothing to keep aligned or crossfade.
    // "Bio" is drawn the same way — a second, plain (unmasked) SVG <text>,
    // not real DOM text — rather than mixing an HTML span next to the SVG
    // mask. HTML and SVG text run through different layout/rendering code
    // paths in the browser (kerning, hinting, sub-pixel positioning), so
    // even with every font property copied over identically, the two could
    // never be *guaranteed* to land pixel-for-pixel together; putting both
    // words in the same coordinate system removes that whole category of
    // mismatch. `placeholder`/`bio` below are invisible HTML spans that
    // still reserve each word's box in the h1's normal text flow — that's
    // what both SVG texts are measured against — but nothing HTML-rendered
    // is ever actually painted for either word.
    //
    // The baseline is the part that kept coming out wrong under font-metric
    // *estimation* (canvas measureText ascent, line-box ratios — all
    // guesses). It doesn't need to be estimated at all: neither word has a
    // descender (A/e/r/i/n, B/i/o all sit on the baseline), so a Range
    // selecting a word's own text node gives a tight bounding box whose
    // bottom edge is, by definition, exactly on the baseline — not
    // approximated, geometric fact, measured independently per word rather
    // than assuming they share one (they do, since they're on the same
    // line, but each is still measured off its own text directly).
    const measureWord = (el: HTMLElement, svgRect: DOMRect) => {
      const wordRect = el.getBoundingClientRect();
      const style = getComputedStyle(el);

      // getBoundingClientRect() is viewport-relative — it only lines up
      // with the SVG's own 0,0-origin viewBox while the SVG's top-left
      // happens to coincide with the viewport's (true while Hero is
      // actively pinned, or right after a fresh load at scrollY 0).
      // layout() can now also run from a resize/orientation-change or
      // visibilitychange rebuild while the page is scrolled anywhere else
      // entirely (confirmed: scroll to the bottom, rotate the device —
      // this used to bake in a wildly wrong, permanently-stuck y position,
      // since nothing scroll-driven ever re-runs layout() to correct it
      // afterward). Subtracting the SVG's own rect makes every coordinate
      // relative to the SVG's box instead of the viewport, which stays
      // correct regardless of current scroll position — placeholder/bio
      // and the svg are both children of the same `stage`, so their
      // offset from each other never changes with scroll, only their
      // shared offset from the viewport does.
      let y = wordRect.top + wordRect.height - svgRect.top;
      const textNode = el.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        y = range.getBoundingClientRect().bottom - svgRect.top;
      }

      // Manual per-breakpoint correction — see --hero-baseline-offset in
      // src/app/styles/hero.css. The Range-based measurement above is
      // geometrically correct in principle, but real devices/browsers
      // introduce enough sub-pixel and viewport-metric variance that a
      // small tunable nudge per breakpoint is the practical fix; adjust
      // the token per breakpoint there, not this line. Applied to both
      // words identically, so nudging it keeps them on one shared line
      // rather than only moving "Aerin".
      const offset = parseFloat(getComputedStyle(section).getPropertyValue("--hero-baseline-offset")) || 0;
      y += offset;

      return {
        x: wordRect.left + wordRect.width / 2 - svgRect.left,
        y,
        fontSize: parseFloat(style.fontSize),
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
      };
    };

    const layout = () => {
      // viewBox matches the svg's OWN rendered box (via its bounding rect),
      // not window.innerWidth/innerHeight — those aren't guaranteed to be
      // identical to the svg's actual CSS pixel size (e.g. any scrollbar
      // gutter, or the parent stage's box differing from the raw window
      // dimensions for any reason), and any mismatch scales every
      // coordinate drawn inside, throwing off both words' position
      // relative to what getBoundingClientRect() reports in real CSS
      // pixels for placeholder/bio.
      const svgRect = svg.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${svgRect.width} ${svgRect.height}`);

      const aerin = measureWord(placeholder, svgRect);
      maskText.setAttribute("font-family", aerin.fontFamily);
      maskText.setAttribute("font-weight", aerin.fontWeight);
      maskText.setAttribute("font-size", String(aerin.fontSize));
      maskText.setAttribute("letter-spacing", aerin.letterSpacing);
      maskText.setAttribute("x", String(aerin.x));
      maskText.setAttribute("y", String(aerin.y));

      const bioMetrics = measureWord(bio, svgRect);
      bioText.setAttribute("font-family", bioMetrics.fontFamily);
      bioText.setAttribute("font-weight", bioMetrics.fontWeight);
      bioText.setAttribute("font-size", String(bioMetrics.fontSize));
      bioText.setAttribute("letter-spacing", bioMetrics.letterSpacing);
      bioText.setAttribute("x", String(bioMetrics.x));
      bioText.setAttribute("y", String(bioMetrics.y));

      return aerin.fontSize;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No pin, no growth — the hole stays at its resting size, so "Aerin"
      // simply reads as a normal (if photo-filled) word, and everything
      // else — including info typography — is shown at once in normal
      // document flow rather than gated behind scroll.
      layout();
      gsap.set(overlay, { opacity: 1 });
      gsap.set(info, { opacity: 1, y: 0, filter: "blur(0px)", position: "static" });
      // Width-or-big-height-change guard — see the matching comment below
      // on the pinned path's onResize for why the height threshold exists
      // alongside the width check.
      let lastWidth = window.innerWidth;
      let lastHeight = window.innerHeight;
      const layoutDrifted = () =>
        window.innerWidth !== lastWidth || Math.abs(window.innerHeight - lastHeight) > HEIGHT_DRIFT_THRESHOLD;
      const onResize = () => {
        if (!layoutDrifted()) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        layout();
      };
      // Returning to a long-backgrounded tab doesn't fire `resize`, but
      // GSAP's own ScrollTrigger auto-refreshes on `visibilitychange`
      // regardless — see the matching comment below.
      const onVisibilityChange = () => {
        if (document.visibilityState !== "visible" || !layoutDrifted()) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        layout();
      };
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibilityChange);
      return () => {
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }

    let trigger: ScrollTrigger | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    let cancelled = false;
    const layoutDrifted = () =>
      window.innerWidth !== lastWidth || Math.abs(window.innerHeight - lastHeight) > HEIGHT_DRIFT_THRESHOLD;

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
          // of the sequence on its own. Targets the SVG text (bioText), not
          // the invisible HTML placeholder (bio) — the placeholder only
          // exists to reserve layout space for measurement.
          .to(bioText, { opacity: 0, duration: 0.5 }, 0.4)
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

      // Deferred global refresh — Hero and PeopleOrbit (TeamAndPartners)
      // each create their own pinned ScrollTrigger in their own effect.
      // Both run in the same render pass, but GSAP's pin-spacer insertion
      // for one can still be mid-flight when the other's ScrollTrigger.
      // create() measures the page layout to compute its own trigger
      // start position — PeopleOrbit's pin was activating ~800px too
      // early because it read the page's height before Hero's spacer had
      // grown to its full pinned distance, so its content rendered pinned
      // over Hero's still-active sequence. One rAF is enough for React to
      // have flushed every mount-time effect and for GSAP's own pin setup
      // to settle; ScrollTrigger.refresh() then recalculates every
      // registered trigger's start/end against that final layout.
      requestAnimationFrame(() => ScrollTrigger.refresh());

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
      // ScrollTrigger.refresh(). Width-or-big-height-change guard: mobile
      // browsers fire a `resize` event when the address bar
      // collapses/expands during scroll, changing only innerHeight by
      // ~50-100px. This section is pinned for a 3-viewport-height scroll
      // distance, so that spurious resize was firing mid-scroll, killing
      // and rebuilding the timeline (and its scroll-linked mask font-size
      // tween) mid-transition — leaving "Aerin" stuck at whatever
      // intermediate size the old timeline had reached. A real orientation
      // change swaps width/height entirely (a much bigger jump than the
      // address-bar case), so HEIGHT_DRIFT_THRESHOLD tells the two apart —
      // width alone usually catches orientation changes too, but some
      // mobile browsers report a still-transitional width on the first
      // resize event of a rotation, which a width-only check can miss.
      const onResize = () => {
        if (!layoutDrifted()) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
      };
      window.addEventListener("resize", onResize);

      // Returning to a long-backgrounded tab doesn't fire `resize` at all,
      // but ScrollTrigger's own default autoRefreshEvents list includes
      // `visibilitychange` — it recalculates pin/scroll geometry and
      // re-renders the scrub timeline's current frame on its own the
      // moment the tab becomes visible again, independently of this
      // component. That updates GSAP's bookkeeping but not this file's own
      // hand-drawn mask coordinates, since only `build()` (via `layout()`)
      // knows how to redraw those — leaving the two out of sync, which is
      // what read as "Aerin disappears" after leaving the tab a while.
      // Gated the same way as resize, so short backgrounding (switching
      // apps briefly, screen lock) with no actual layout change doesn't
      // pay for a rebuild every time.
      const onVisibilityChange = () => {
        if (document.visibilityState !== "visible" || !layoutDrifted()) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        build();
        ScrollTrigger.refresh();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      return () => {
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
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
          {/* "Bio" — plain (unmasked) SVG text, not the mask geometry above;
              paints normally like any other shape in this svg. Same
              --foreground color the h1 used to render it in directly, since
              it's no longer real DOM text carrying its own inherited color. */}
          <text ref={bioTextRef} fill="var(--foreground)" textAnchor="middle" dominantBaseline="alphabetic">
            Bio
          </text>
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
                breakpoints — "Aerin" and "Bio" MUST stay on one line
                (whitespace-nowrap below is the hard guarantee; both words'
                own SVG text is independently measured, but they're still
                meant to read as one wordmark), and a fixed 60px was wide
                enough to wrap onto two lines on narrow phones. clamp() scales
                continuously with viewport width instead of jumping
                between fixed sizes that can land on an in-between width
                still too narrow to fit — 11vw keeps "Aerin Bio" comfortably
                under the viewport at any width between the two bounds
                (2.25rem floor for the smallest phones, 6rem ceiling
                matching the original lg:text-8xl). whitespace-nowrap is
                a hard backstop against wrapping regardless. */}
            {/* aria-label carries the accessible heading text — both spans
                below are visibility:hidden purely to reserve layout boxes
                for measurement, and hidden elements are excluded from the
                accessibility tree, so without this the heading would
                announce as empty. */}
            <h1
              aria-label="Aerin Bio"
              className="relative whitespace-nowrap text-[clamp(2.25rem,11vw,6rem)] font-semibold tracking-tight"
            >
              {/* Invisible — reserves the exact box each word's SVG text
                  (the mask hole for "Aerin", a plain <text> for "Bio") is
                  measured against and positioned over, so the two line up
                  the way normal inline text would, but neither word is
                  actually painted here — both are drawn entirely in the SVG
                  above. */}
              <span ref={placeholderRef} className="invisible">
                Aerin
              </span>{" "}
              <span ref={bioRef} className="invisible">
                Bio
              </span>
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
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("innovation");
                }}
                className={`${BTN_GLOW} px-6 py-3`}
              >
                See the platform
              </a>
              <a
                href="#cta"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("cta");
                }}
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

            <p className="text-xs text-[color:var(--foreground)]/70">
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
