"use client";

import SmokeCanvas from "@/components/visuals/SmokeCanvas";

export default function SmokeBackground() {
  // `inset-0` on a `fixed` element already pins all four edges to the
  // viewport — an explicit `w-screen` (100vw) on top of that forces the
  // width to the *layout* viewport, which includes the scrollbar gutter and
  // is wider than the *visual* viewport on most browsers. Since this mounts
  // sitewide (layout.tsx), that extra width was the page's horizontal
  // scroll on small screens; `h-dvh` doesn't have the same failure mode
  // (height doesn't create horizontal overflow) so it's left as-is.
  return <SmokeCanvas className="pointer-events-none fixed inset-0 -z-10 h-dvh" />;
}
