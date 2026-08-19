// Anchor links (`<a href="#id">`) have two problems the browser's native
// hash navigation doesn't solve on its own: the jump is instant (no
// `scroll-behavior: smooth` is set globally, since that would also affect
// GSAP's own scroll-driven pins), and clicking the same link twice does
// nothing the second time — the URL hash doesn't change, so the browser
// never re-runs the "scroll to fragment" step. Driving the scroll manually
// from a click handler fixes both.
//
// The scroll itself is a manual requestAnimationFrame tween, not native
// `scrollTo({behavior:"smooth"})` — same technique ScrollToTopButton
// already uses, and for the same two reasons: native smooth-scroll runs at
// a fixed browser/OS-controlled speed regardless of distance, so a short
// hop to a nearby section finishes almost instantly (too fast to actually
// see the motion) while a long one is slow — and it can't be given an
// explicit duration.
const SCROLL_DURATION_MS = 6000;

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;

  // Offset by the sticky header's current height — it can be hidden
  // (translated off-screen) depending on scroll direction, so this is
  // measured live rather than using a fixed constant.
  const header = document.querySelector("header");
  const headerOffset = header ? header.getBoundingClientRect().height : 0;
  const HEADER_GAP = 16;

  const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset - HEADER_GAP;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetY);
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function step(now: number) {
    const t = Math.min(1, (now - startTime) / SCROLL_DURATION_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
