import { forwardRef } from "react";

// public/cityscape-back.svg and public/cityscape-back-nomoon.svg share
// the exact same viewBox/crop (0 600 3197.9 1400) — the only difference
// is the nomoon variant has the single moon <path> stripped out — so
// every tile renders at identical scale regardless of which one is used;
// only the seam-causing scale mismatch is avoided, not the moon itself.
// Tiled side by side at a fixed height (never scaled to viewport width,
// so nothing stretches), one tile pulling the moon variant, the rest the
// plain one.
const TILE_COUNT = 8;
// Each tile is the full ~3198px-wide source at a fixed height, so only
// the first few tiles land inside a typical viewport — keep both special
// tiles near the start so they're actually visible instead of scrolled
// off-screen.
const MOON_TILE_INDEX = 0;
// cityscape-tower.svg is a taller crop (0 208 3197.9 1792) reaching up to
// the tallest tower's spire; it renders at a visibly different scale
// than the other tiles (same tradeoff as showing the full moon), so it's
// a deliberate landmark tile rather than a seamless match.
const TOWER_TILE_INDEX = 2;

const CityscapeAnimation = forwardRef<HTMLDivElement>(function CityscapeAnimation(_props, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      // Full-bleed via left + negative margin, not a translateX transform:
      // GSAP (CTA.tsx) owns this element's transform (y, during the panel
      // swap), and a transform-based centering trick would get silently
      // overwritten/stale the first time GSAP writes to it.
      className="pointer-events-none absolute bottom-0 left-1/2 z-0 -ml-[50vw] flex h-40 w-screen items-end overflow-hidden sm:h-56"
    >
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- decorative local SVG tiles, not raster photos; next/image's optimizer/srcset buys nothing here and would need dangerouslyAllowSVG in next.config for no gain
        <img
          key={i}
          src={
            i === MOON_TILE_INDEX
              ? "/cityscape-back.svg"
              : i === TOWER_TILE_INDEX
                ? "/cityscape-tower.svg"
                : "/cityscape-back-nomoon.svg"
          }
          alt=""
          // Every tile is the same source image; odd ones are mirrored so
          // the repeat doesn't read as an obvious copy-pasted clone. `block`
          // drops the inline-image baseline gap, and the 1px negative
          // margin overlaps tiles just enough to cover any subpixel
          // rounding on the auto width so nothing hairlines between them.
          className={`-mr-px block h-full w-auto shrink-0 object-contain object-bottom last:mr-0 ${
            i % 2 === 1 ? "-scale-x-100" : ""
          }`}
        />
      ))}
    </div>
  );
});

export default CityscapeAnimation;
