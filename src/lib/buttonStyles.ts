// Base classes for the two custom button effects defined in
// src/app/styles/effects.css (.btn-glow, .btn-fold). Each call site still
// owns its own layout classes (padding, margin, gap, icon layout) since
// those genuinely differ per placement — only the part that was byte-for-
// byte identical everywhere is shared here.
export const BTN_GLOW = "btn-glow rounded-full text-sm font-medium text-[color:var(--color-ink)]";
export const BTN_FOLD =
  "btn-fold rounded-full bg-[color:var(--foreground-1)] text-sm font-medium uppercase tracking-wide text-[color:var(--background-1)]";
