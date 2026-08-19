"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export type Person = {
  name: string;
  role: string;
  /** Real photo, when one exists. Falls back to initials when absent. */
  avatarSrc?: string;
};

type Copy = {
  eyebrow: string;
  heading: string;
  description: string;
};

type PeopleOrbitProps = {
  id: string;
  centerLabel: string;
  /** Exactly 6 each — team converges into the emblem, then partners diverge back out to the same slots. */
  team: Person[];
  partners: Person[];
  teamCopy: Copy;
  partnersCopy: Copy;
};

// Percent-based positions around the center emblem, roughly matching a
// six-point ring (top, upper corners, lower corners, bottom). Team and
// partner nodes share these slots so the converge/diverge motion is a
// mirror image of itself.
const ORBIT_POSITIONS = [
  "left-1/2 top-[24%]",
  "left-[4%] top-[38%]",
  "left-[4%] top-[74%]",
  "left-[96%] top-[38%]",
  "left-[96%] top-[74%]",
  "left-1/2 top-[90%]",
];

// Traveling ripple along the hover string — same technique as EkgDivider's
// "by the numbers" line dividers (rise-and-fall envelope + a phase that
// travels along the line), generalized here to an arbitrary line angle
// instead of a fixed vertical/horizontal one.
const WAVE_STOPS = 15;
const WAVE_T = Array.from({ length: WAVE_STOPS }, (_, i) => i / (WAVE_STOPS - 1));
const WAVE_AMPLITUDE = 4;
const WAVE_CYCLES = 1.4;
const WAVE_TRAVEL = 1.2;

function waveOffsets(progress: number) {
  const envelope = Math.sin(Math.PI * progress);
  const phase = progress * WAVE_TRAVEL * Math.PI * 2;
  return WAVE_T.map((t) => WAVE_AMPLITUDE * envelope * Math.sin(WAVE_CYCLES * Math.PI * 2 * t - phase));
}

function buildWavyLine(ox: number, oy: number, ex: number, ey: number, offsets: number[]) {
  const dx = ex - ox;
  const dy = ey - oy;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const coords = WAVE_T.map((t, i) => {
    const bx = ox + dx * t;
    const by = oy + dy * t;
    const offset = offsets[i];
    return `${(bx + px * offset).toFixed(2)},${(by + py * offset).toFixed(2)}`;
  });
  return `M${coords.join(" L")}`;
}

// Same ripple, wrapped around a circle instead of a straight line, for the
// avatar/emblem borders. CYCLES must be a whole number here (unlike the
// line's) so the sine pattern lines up at both ends of the loop — otherwise
// the path would show a visible seam where it closes back on itself.
//
// Coordinates live in a fixed 0–100 box (see BORDER_CX/CY/R below), not
// pixels measured off the DOM. During the orbit convergence the avatar
// wrapper is scaled down by GSAP's `scale` transform — but CSS `transform`
// is a paint-time effect that doesn't touch layout, so the SVG's own
// percentage sizing (`h-full w-full`) still resolves against the
// *pre-transform* box. Drawing the ring from a `getBoundingClientRect()`
// (post-transform, i.e. already shrunk) into that untransformed coordinate
// space is exactly what produced the off-center drift. A static viewBox
// sidesteps the mismatch entirely: the SVG stretches to fill whatever box
// it's actually rendered at — scaled down or not — so the ring drawn in
// this fixed space always lands back on the real circle, no re-measuring
// needed as the avatar shrinks toward the emblem or grows back out.
const BORDER_STOPS = 32;
const BORDER_T = Array.from({ length: BORDER_STOPS }, (_, i) => i / (BORDER_STOPS - 1));
const BORDER_CX = 50;
const BORDER_CY = 50;
const BORDER_R = 46;
const BORDER_AMPLITUDE = 4;
const BORDER_CYCLES = 3;
const BORDER_TRAVEL = 1;
const BORDER_FLAT = BORDER_T.map(() => 0);

function borderWaveOffsets(progress: number) {
  const envelope = Math.sin(Math.PI * progress);
  const phase = progress * BORDER_TRAVEL * Math.PI * 2;
  return BORDER_T.map((t) => BORDER_AMPLITUDE * envelope * Math.sin(BORDER_CYCLES * Math.PI * 2 * t - phase));
}

function buildWavyCircle(offsets: number[]) {
  const coords = BORDER_T.map((t, i) => {
    const theta = t * Math.PI * 2;
    const radius = BORDER_R + offsets[i];
    return `${(BORDER_CX + radius * Math.cos(theta)).toFixed(2)},${(BORDER_CY + radius * Math.sin(theta)).toFixed(2)}`;
  });
  return `M${coords.join(" L")}Z`;
}

// Shared by every circle (center emblem + all twelve avatar slots) — kills
// whatever tween was already running on this path, then either ripples it
// in (rise, travel, settle to a plain glowing circle) or fades it out.
// Returns the new tween so the caller can store it back into its own ref.
function runBorderRipple(
  path: SVGPathElement | null,
  existingTween: gsap.core.Tween | null,
  show: boolean,
  prefersReducedMotion: boolean
): gsap.core.Tween | null {
  if (!path) return null;
  existingTween?.kill();

  if (!show) {
    return gsap.to(path, { opacity: 0, duration: 0.25, ease: "power1.out" });
  }

  if (prefersReducedMotion) {
    path.setAttribute("d", buildWavyCircle(BORDER_FLAT));
    gsap.set(path, { opacity: 1 });
    return null;
  }

  gsap.set(path, { opacity: 1 });
  const state = { progress: 0 };
  return gsap.to(state, {
    progress: 1,
    duration: 0.9,
    ease: "sine.inOut",
    onUpdate: () => path.setAttribute("d", buildWavyCircle(borderWaveOffsets(state.progress))),
    onComplete: () => path.setAttribute("d", buildWavyCircle(BORDER_FLAT)),
  });
}

// Same `filter: drop-shadow()` pattern EkgDivider's pulseLabel uses for its
// hover glow — here driven by proximity to the center emblem instead of a
// hover envelope: 0 = at rest (no glow), 1 = at the center (full glow).
function setProximityGlow(el: HTMLElement, intensity: number, maxBlur: number) {
  el.style.filter = intensity > 0 ? `drop-shadow(0 0 ${(intensity * maxBlur).toFixed(1)}px var(--color-culture))` : "none";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PersonAvatar({ person }: { person: Person }) {
  // bg/border/shadow read theme-reactive tokens (tokens.css) rather than
  // Tailwind's dark: variant — this project never registered a @variant
  // dark tied to [data-theme], so dark: only ever follows OS
  // prefers-color-scheme and silently ignores the manual ThemeToggle
  // override. Same reasoning as --shadow-leader-card/--border-leader-card.
  const base =
    "relative flex h-[clamp(2.5rem,5.5vh,5.5rem)] w-[clamp(2.5rem,5.5vh,5.5rem)] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--avatar-border)] bg-[color:var(--avatar-bg)] shadow-[var(--avatar-shadow)]";

  if (person.avatarSrc) {
    return (
      <div aria-hidden className={base}>
        <Image src={person.avatarSrc} alt="" fill sizes="88px" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`${base} font-[family-name:var(--font-mono)] text-[clamp(0.8rem,1.7vh,1.375rem)] font-semibold text-[color:var(--foreground)]/80`}
    >
      {initials(person.name)}
    </div>
  );
}

export default function PeopleOrbit({ id, centerLabel, team, partners, teamCopy, partnersCopy }: PeopleOrbitProps) {
  const [phase, setPhase] = useState<"team" | "partners">("team");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [centerHovered, setCenterHovered] = useState(false);
  const [autoIndex, setAutoIndex] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const teamNodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const partnerNodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverSvgRef = useRef<SVGSVGElement | null>(null);
  // One path + gradient per orbit slot — a single avatar hover only draws its
  // own slot, but hovering the center emblem radiates the wave out to all six
  // at once, so each slot needs to be independently animatable.
  const hoverPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const hoverGradientRefs = useRef<(SVGLinearGradientElement | null)[]>([]);
  const hoverTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const hoverGradientId = useId().replace(/:/g, "");

  // Same wave, wrapped around each circle's own border instead of the line
  // between them — team and partner avatars stay mounted simultaneously
  // (only opacity/pointer-events toggle), so each set needs its own refs.
  const teamBorderPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const partnerBorderPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const teamBorderTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const partnerBorderTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);
  const centerBorderRef = useRef<SVGPathElement | null>(null);
  const centerBorderTweenRef = useRef<gsap.core.Tween | null>(null);

  const branchWrapRef = useRef<HTMLDivElement | null>(null);
  const trunkRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const nameRef = useRef<HTMLParagraphElement | null>(null);
  const roleRef = useRef<HTMLParagraphElement | null>(null);
  const drawRef = useRef<((animate: boolean) => void) | null>(null);

  const activeCopy = phase === "team" ? teamCopy : partnersCopy;
  const activeRoster = phase === "team" ? team : partners;
  const activeIndex = hoveredIndex ?? autoIndex;
  const activePerson = activeRoster[activeIndex] ?? activeRoster[0];

  // Orbit choreography — team converges into the center emblem across the
  // first half of the pinned scroll, then partners diverge back out to the
  // same slots across the second half. Both sets share ORBIT_POSITIONS, so
  // the same per-slot delta drives both halves symmetrically.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const center = centerRef.current;
    const teamNodes = teamNodeRefs.current.filter((n): n is HTMLDivElement => !!n);
    const partnerNodes = partnerNodeRefs.current.filter((n): n is HTMLDivElement => !!n);
    if (!section || !stage || !center || teamNodes.length === 0 || partnerNodes.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(teamNodes, { opacity: 1 });
      gsap.set(partnerNodes, { opacity: 0 });
      const timer = setTimeout(() => {
        gsap.set(teamNodes, { opacity: 0 });
        gsap.set(partnerNodes, { opacity: 1 });
        setPhase("partners");
      }, 4000);
      return () => clearTimeout(timer);
    }

    let trigger: ScrollTrigger | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let lastWidth = window.innerWidth;

    const build = () => {
      trigger?.kill();
      gsap.set(teamNodes, { x: 0, y: 0, scale: 1, opacity: 1 });
      gsap.set(partnerNodes, { x: 0, y: 0, scale: 1, opacity: 0 });
      gsap.set(center, { scale: 1 });
      teamNodes.forEach((n) => setProximityGlow(n, 0, 14));
      partnerNodes.forEach((n) => setProximityGlow(n, 0, 14));
      setProximityGlow(center, 0, 18);

      const centerRect = center.getBoundingClientRect();
      const cx = centerRect.left + centerRect.width / 2;
      const cy = centerRect.top + centerRect.height / 2;

      const deltas = teamNodes.map((node) => {
        const rect = node.getBoundingClientRect();
        const nx = rect.left + rect.width / 2;
        const ny = rect.top + rect.height / 2;
        return { dx: cx - nx, dy: cy - ny };
      });

      // A percentage `end` (e.g. "+=200%") resolves against the trigger's
      // own box, which is far shorter than the scroll distance this
      // two-phase sequence needs to feel scrubbable — pin an explicit
      // multiple of the viewport height instead.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${window.innerHeight * 3}`,
          scrub: 0.6,
          pin: stage,
          onUpdate: (self) => {
            setPhase(self.progress < 0.5 ? "team" : "partners");
            // Center emblem glow — brightest right at the pivot, where
            // everything is closest to it; fades back down on either side
            // as the avatars are farther away (still at rest, or already
            // diverged back out).
            const p = self.progress;
            const centerProximity = p < 0.5 ? p * 2 : (1 - p) * 2;
            setProximityGlow(center, centerProximity, 18);
          },
        },
      });

      teamNodes.forEach((node, i) => {
        tl.to(node, { x: deltas[i].dx, y: deltas[i].dy, scale: 0.3, opacity: 0, ease: "none", duration: 1 }, 0);
        // Each avatar's own glow tracks its own proximity to the emblem —
        // 0 at rest, ramping to full brightness as it converges in.
        const teamProximity = { v: 0 };
        tl.to(
          teamProximity,
          {
            v: 1,
            duration: 1,
            ease: "none",
            onUpdate: () => setProximityGlow(node, teamProximity.v, 14),
          },
          0
        );
      });
      tl.to(center, { scale: 1.08, duration: 0.3, ease: "power2.out" }, 0.75);
      tl.to(center, { scale: 1, duration: 0.3, ease: "power2.out" }, 1);
      partnerNodes.forEach((node, i) => {
        tl.fromTo(
          node,
          { x: deltas[i].dx, y: deltas[i].dy, scale: 0.3, opacity: 0 },
          { x: 0, y: 0, scale: 1, opacity: 1, ease: "none", duration: 1 },
          1
        );
        // Mirror image of the team's glow — partners start right at the
        // emblem (full brightness) and dim as they diverge back out to rest.
        const partnerProximity = { v: 1 };
        tl.to(
          partnerProximity,
          {
            v: 0,
            duration: 1,
            ease: "none",
            onUpdate: () => setProximityGlow(node, partnerProximity.v, 14),
          },
          1
        );
      });

      trigger = tl.scrollTrigger;
    };

    build();

    // Hero (mounted just above this section) also creates a pinned
    // ScrollTrigger in its own effect in the same render pass. GSAP can
    // batch multiple ScrollTrigger.create() calls created together and
    // measure them against a layout snapshot taken before any of that
    // batch's own pin-spacers have actually been inserted — so this
    // section's "top top" start was resolving against the page's height
    // as if Hero had no pin-spacer yet, landing hundreds of pixels too
    // early (confirmed via ScrollTrigger.getAll()). A plain
    // ScrollTrigger.refresh() doesn't recompute an already-pinned
    // trigger's start correctly, so this does a full kill-and-rebuild
    // one frame later, once the initial batch has settled and Hero's
    // spacer is actually in the DOM.
    const initialRebuildFrame = requestAnimationFrame(() => {
      build();
      ScrollTrigger.refresh();
    });

    // Window resize only — not a ResizeObserver on `section`, since GSAP's
    // own pin plugin mutates that element's box (inserts a pin-spacer),
    // which would otherwise retrigger this observer mid-pin and race with
    // the scrub timeline it's rebuilding. Width-only guard on top of that:
    // this section's own pin-spacer insertion changes page height, which
    // can change the scrollbar gutter and fire a genuine width-changing
    // `resize` event even though nothing the user did actually changed
    // the viewport — no need to rebuild for that.
    const handleResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(initialRebuildFrame);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      trigger?.kill();
    };
  }, []);

  // Hover strings — thin lines from the center emblem to orbit avatars,
  // rippling in with the same traveling-wave technique as the "by the
  // numbers" line dividers. Hovering one avatar draws only its own line;
  // hovering the center emblem radiates the wave out to all six at once.
  useEffect(() => {
    const ring = ringRef.current;
    const center = centerRef.current;
    const svg = hoverSvgRef.current;
    if (!ring || !center || !svg) return;

    const nodes = phase === "team" ? teamNodeRefs.current : partnerNodeRefs.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ringRect = ring.getBoundingClientRect();
    const centerRect = center.getBoundingClientRect();
    const ox = centerRect.left + centerRect.width / 2 - ringRect.left;
    const oy = centerRect.top + centerRect.height / 2 - ringRect.top;
    svg.setAttribute("viewBox", `0 0 ${ringRect.width} ${ringRect.height}`);

    const rippleIn = (i: number) => {
      const path = hoverPathRefs.current[i];
      const gradient = hoverGradientRefs.current[i];
      const target = nodes[i];
      if (!path || !gradient || !target) return;

      const targetRect = target.getBoundingClientRect();
      const ex = targetRect.left + targetRect.width / 2 - ringRect.left;
      const ey = targetRect.top + targetRect.height / 2 - ringRect.top;

      // Gradient runs along the line's actual direction (not a fixed axis),
      // so it stays brightest at the emblem and fades toward the avatar
      // regardless of which of the six slots is hovered.
      gradient.setAttribute("x1", String(ox));
      gradient.setAttribute("y1", String(oy));
      gradient.setAttribute("x2", String(ex));
      gradient.setAttribute("y2", String(ey));

      hoverTweenRefs.current[i]?.kill();

      if (prefersReducedMotion) {
        path.setAttribute("d", `M${ox},${oy} L${ex},${ey}`);
        gsap.set(path, { opacity: 1 });
        return;
      }

      gsap.set(path, { opacity: 1 });
      const state = { progress: 0 };
      hoverTweenRefs.current[i] = gsap.to(state, {
        progress: 1,
        duration: 0.9,
        ease: "sine.inOut",
        onUpdate: () => {
          path.setAttribute("d", buildWavyLine(ox, oy, ex, ey, waveOffsets(state.progress)));
        },
        onComplete: () => {
          // Settles flat once the ripple has passed through — the persistent
          // gradient line while still hovering shouldn't stay wavy.
          path.setAttribute("d", `M${ox},${oy} L${ex},${ey}`);
        },
      });
    };

    const rippleOut = (i: number) => {
      const path = hoverPathRefs.current[i];
      if (!path) return;
      hoverTweenRefs.current[i]?.kill();
      hoverTweenRefs.current[i] = gsap.to(path, { opacity: 0, duration: 0.25, ease: "power1.out" });
    };

    const borderPaths = phase === "team" ? teamBorderPathRefs.current : partnerBorderPathRefs.current;
    const borderTweens = phase === "team" ? teamBorderTweenRefs.current : partnerBorderTweenRefs.current;

    nodes.forEach((_, i) => {
      const shouldShow = centerHovered || hoveredIndex === i;
      if (shouldShow) rippleIn(i);
      else rippleOut(i);
      borderTweens[i] = runBorderRipple(borderPaths[i], borderTweens[i], shouldShow, prefersReducedMotion);
    });

    // The emblem is always one end of whatever's showing — its own border
    // ripples whenever any avatar (or the emblem itself) is hovered.
    const anyShown = centerHovered || hoveredIndex !== null;
    centerBorderTweenRef.current = runBorderRipple(
      centerBorderRef.current,
      centerBorderTweenRef.current,
      anyShown,
      prefersReducedMotion
    );
  }, [hoveredIndex, centerHovered, phase]);

  // Entrance reveal for the static chrome (eyebrow, emblem, heading).
  useScrollReveal(sectionRef, { stagger: 0.12 });

  // Single branch line — trunk node to the heading, drawn once when the
  // block scrolls into view, redrawn (no animation) whenever the heading
  // text changes width across the team/partners swap.
  useEffect(() => {
    const wrap = branchWrapRef.current;
    const trunk = trunkRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const heading = headingRef.current;
    if (!wrap || !trunk || !svg || !path || !heading) return;

    const draw = (animate: boolean) => {
      const wrapRect = wrap.getBoundingClientRect();
      const trunkRect = trunk.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const ox = trunkRect.left + trunkRect.width / 2 - wrapRect.left;
      const oy = trunkRect.top + trunkRect.height / 2 - wrapRect.top;
      const ex = headingRect.left + headingRect.width / 2 - wrapRect.left;
      const ey = headingRect.top - wrapRect.top;
      const my = oy + (ey - oy) * 0.5;

      svg.setAttribute("viewBox", `0 0 ${wrapRect.width} ${wrapRect.height}`);
      path.setAttribute("d", `M${ox},${oy} Q${ox},${my} ${ex},${ey}`);

      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      if (animate) {
        gsap.fromTo(path, { strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" });
      } else {
        path.style.strokeDashoffset = String(length);
      }
    };
    drawRef.current = draw;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      draw(false);
      path.style.strokeDashoffset = "0";
      const onResize = () => draw(false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    draw(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          draw(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(wrap);

    const onResize = () => draw(false);
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Re-anchor the branch line (no redraw animation) when the heading text
  // swaps between team/partners copy and its width shifts.
  useEffect(() => {
    drawRef.current?.(false);
  }, [phase]);

  // Detail panel auto-advance — every 5s, unless a specific orbit avatar is
  // currently hovered (hover always wins over the timer).
  useEffect(() => {
    if (hoveredIndex !== null) return;
    const id = setInterval(() => {
      setAutoIndex((i) => (i + 1) % 6);
    }, 5000);
    return () => clearInterval(id);
  }, [hoveredIndex, phase]);

  // Kept as its own effect rather than folded into the interval effect
  // above — this must reset only on a phase change, not on every
  // hoveredIndex change the interval effect also depends on.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoIndex(0);
  }, [phase]);

  // Cross-fade the detail panel and heading/description whenever the
  // active person or phase changes.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = [nameRef.current, roleRef.current].filter((el): el is HTMLParagraphElement => !!el);
    if (targets.length === 0) return;
    gsap.fromTo(targets, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 });
  }, [activePerson]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = [eyebrowRef.current, headingRef.current, descriptionRef.current].filter(Boolean) as HTMLElement[];
    if (targets.length === 0) return;
    gsap.fromTo(targets, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 });
  }, [phase]);

  return (
    <section id={id} ref={sectionRef} className="relative text-[color:var(--foreground)]">
      {/* The glass-blur mask lives on `stage` — the element GSAP actually
          pins — rather than on this outer `<section>`. `backdrop-filter` on
          an ancestor of a pinned element creates a new containing block for
          `position: fixed`, which is how GSAP pins by default, and breaks
          the pin entirely (it renders relative to that blurred ancestor
          instead of the viewport). Putting the blur ON the pinned element
          itself is safe: `backdrop-filter` only affects how that element's
          own containing-block ancestors resolve pinned *descendants* of
          itself, and `stage` has none. */}
      <div
        ref={stageRef}
        className="relative mx-auto flex h-screen max-w-7xl flex-col items-center justify-center bg-[color:var(--background)]/70 px-6 py-8 backdrop-blur-md sm:px-10"
      >
        {/* Orbit ring — team/partner avatars converge into / diverge from the center emblem.
            Sized off vh, not fixed px, so the whole stage still fits one screen on short
            (~720p laptop) viewports instead of only tall desktop ones. */}
        <div ref={ringRef} className="relative h-[clamp(260px,42vh,480px)] w-full shrink-0">
          <svg ref={hoverSvgRef} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              {/* One gradient per orbit slot — coordinates are rewritten per-hover
                  to match each line's actual direction, so the bright end always
                  lands on the emblem and the faint end on the avatar. */}
              {ORBIT_POSITIONS.map((_, i) => (
                <linearGradient
                  key={i}
                  ref={(el) => {
                    hoverGradientRefs.current[i] = el;
                  }}
                  id={`${hoverGradientId}-${i}`}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="var(--color-culture)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--color-culture)" stopOpacity="0.05" />
                </linearGradient>
              ))}
            </defs>
            {ORBIT_POSITIONS.map((_, i) => (
              <path
                key={i}
                ref={(el) => {
                  hoverPathRefs.current[i] = el;
                }}
                fill="none"
                stroke={`url(#${hoverGradientId}-${i})`}
                strokeWidth={0.75}
                strokeLinecap="round"
                opacity={0}
                className="drop-shadow-[0_0_3px_var(--color-culture)]"
              />
            ))}
          </svg>

          {/* Centering lives on this outer wrapper, untouched by GSAP — the
              inner <p> is what the entrance/phase-change tweens animate.
              GSAP's y/opacity tween freezes the element's full transform
              matrix (including a translateX(-50%) centering trick) at
              whatever width the text had at that moment; when the text
              later swaps to a different length, the frozen offset no
              longer matches, drifting the label off-center. Splitting the
              positioning and the animation onto different elements keeps
              the centering recalculating on every render instead. */}
          <div className="absolute left-1/2 top-[clamp(0.5rem,1.5vh,1rem)] -translate-x-1/2">
            <p
              ref={eyebrowRef}
              data-reveal
              className="text-center font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-culture)] mr-[-0.2em]"
            >
              {activeCopy.eyebrow}
            </p>
          </div>

          {/* Same split as the eyebrow above — centering on a plain outer
              wrapper, GSAP only ever touches the inner circle. */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div
              ref={centerRef}
              data-reveal
              onMouseEnter={() => setCenterHovered(true)}
              onMouseLeave={() => setCenterHovered(false)}
              className="relative flex h-[clamp(4rem,8vh,6.5rem)] w-[clamp(4rem,8vh,6.5rem)] flex-col items-center justify-center rounded-full border border-[color:var(--color-culture)]/40 bg-[color:var(--background)] px-1 text-center shadow-lg shadow-[color:var(--color-culture-dim)]/20"
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <path
                  ref={centerBorderRef}
                  fill="none"
                  stroke="var(--color-culture)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0}
                  className="drop-shadow-[0_0_3px_var(--color-culture)]"
                />
              </svg>
              <span className="font-[family-name:var(--font-mono)] text-[clamp(0.6rem,1.3vh,0.8rem)] font-semibold uppercase leading-none tracking-tight whitespace-nowrap">
                {centerLabel}
              </span>
            </div>
          </div>

          {team.map((person, i) => (
            <div
              key={`team-${person.name}`}
              ref={(el) => {
                teamNodeRefs.current[i] = el;
              }}
              onMouseEnter={() => phase === "team" && setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                phase === "team" ? "" : "pointer-events-none"
              } ${ORBIT_POSITIONS[i]}`}
            >
              <PersonAvatar person={person} />
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <path
                  ref={(el) => {
                    teamBorderPathRefs.current[i] = el;
                  }}
                  fill="none"
                  stroke="var(--color-culture)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0}
                  className="drop-shadow-[0_0_3px_var(--color-culture)]"
                />
              </svg>
            </div>
          ))}

          {partners.map((person, i) => (
            <div
              key={`partner-${person.name}`}
              ref={(el) => {
                partnerNodeRefs.current[i] = el;
              }}
              onMouseEnter={() => phase === "partners" && setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
              className={`absolute -translate-x-1/2 -translate-y-1/2 opacity-0 ${
                phase === "partners" ? "" : "pointer-events-none"
              } ${ORBIT_POSITIONS[i]}`}
            >
              <PersonAvatar person={person} />
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <path
                  ref={(el) => {
                    partnerBorderPathRefs.current[i] = el;
                  }}
                  fill="none"
                  stroke="var(--color-culture)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0}
                  className="drop-shadow-[0_0_3px_var(--color-culture)]"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Branch + heading + detail panel — stays inside the pinned stage so
            it's visible throughout both phases, not pushed below the fold by
            the pin-spacer once the section pins. */}
        <div ref={branchWrapRef} className="relative mt-4 flex w-full max-w-2xl shrink-0 flex-col items-center text-center">
          <div ref={trunkRef} className="h-2 w-2 rounded-full bg-[color:var(--color-culture)]" />

          <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <path ref={pathRef} fill="none" stroke="var(--color-culture)" strokeOpacity={0.4} strokeWidth={1.5} strokeLinecap="round" />
          </svg>

          {/* Matches the site's established heading/body scale (see Blog,
              Testimonials, CTA) rather than a one-off size for this section. */}
          <h2 ref={headingRef} data-reveal className="relative mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {activeCopy.heading}
          </h2>
          <p ref={descriptionRef} className="relative mt-2 max-w-lg text-sm text-[color:var(--foreground)]/70 sm:text-base">
            {activeCopy.description}
          </p>

          <div className="relative mt-4 min-h-[3.5rem]">
            <p ref={nameRef} className="text-lg font-semibold">
              {activePerson.name}
            </p>
            <p ref={roleRef} className="mt-1 mr-[-0.2em] text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-culture-dim)]">
              {activePerson.role}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
