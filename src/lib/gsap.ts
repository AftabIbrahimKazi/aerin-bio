import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registered once here instead of at the top of every animated component —
// the `typeof window` guard is needed because this module is also imported
// by files that render on the server, where ScrollTrigger has nothing to
// attach to.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // ScrollTrigger has its own internal resize listener (independent of any
  // component's own `resize` handler) that recalculates pin/trigger
  // geometry on every resize by default — including the height-only resize
  // mobile browsers fire when the address bar collapses/expands during
  // scroll. That's what was throwing Hero's pinned mask-reveal sequence
  // (and could throw any other pinned/scrubbed ScrollTrigger sitewide)
  // mid-transition on mobile. This is GSAP's own documented fix: ignore
  // resize on touch-only devices unless the width actually changes.
  ScrollTrigger.config({ ignoreMobileResize: true });
  // ignoreMobileResize alone didn't fully stop pinned sequences (Hero's
  // mask reveal) from jumping when the address bar collapses/expands —
  // GSAP's more targeted tool for this: normalizeScroll takes over scroll
  // rendering with a transform-based approach that isn't tied to the
  // browser's native (address-bar-jittery) scroll position, which is what
  // pinned/scrubbed animations need on touch devices.
  ScrollTrigger.normalizeScroll(true);
}

export { gsap, ScrollTrigger };
