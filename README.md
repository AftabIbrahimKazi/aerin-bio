# Aerin Bio

**Medicine that breathes with you.**

A premium, animation-driven landing page for a fictional biotechnology company, built for the Creative Frontend Developer take-home assignment. Aerin Bio engineers antibodies, peptides, and gene therapies as inhaled biologics — delivered as a fine respirable mist straight to lung tissue instead of through the entire bloodstream.

**Live site:** [aerin-bio.vercel.app](https://aerin-bio.vercel.app)
**Repository:** [github.com/AftabIbrahimKazi/aerin-bio](https://github.com/AftabIbrahimKazi/aerin-bio)

---

## Design approach

The brief asked for an original visual identity, not a generic template — so the starting point was the product itself, not a mood board. Aerin Bio's core idea is that inhaled delivery reaches the lung directly, skipping the systemic detour an injection takes. Every major visual decision on the page is built to be a literal expression of that idea rather than decoration bolted onto an arbitrary biotech brand.

The clearest example is the hero: the word **"Aerin"** isn't rendered as text — it's a window. An SVG mask punches a text-shaped hole out of a solid overlay, and a real photograph sits underneath, always at its true, unscaled size. As the page scrolls, the hole itself grows (a font-size increase on the mask, not a transform on the photo) until the letterforms dominate the frame and dissolve into the image. Nothing is cropped or scaled to fake the reveal — the photo is simply uncovered.

The second signature element is the cursor-reactive smoke layer that sits behind the hero content. It's a small canvas particle system, not a shader or a WebGL scene: particles spawn only while the cursor (or a finger, on touch) is moving, inherit that instant's velocity, and are pulled through a coherent curl-noise field so they curl and drift like real turbulence rather than scattering in straight lines. It stays blank at rest and responds immediately to motion — "move your cursor, like breath disturbing mist" is a literal instruction, not just hero copy.

**Palette.** Near-black ink, graphite, clinical paper-white, and a single saturated culture-green accent — meant to read like a lab notebook rather than a generic tech gradient. A monospace display face carries labels, eyebrows, and data (particle codes, stat figures), reading like instrument output; a humanist sans carries body copy.

**Structure.** The page goes well beyond the six required sections — hero, team, innovation (the inhaled-vs-injected delivery pathway), production, technology, capabilities, leadership, testimonials, insights, impact stats, and a closing call to action — each with its own scroll-triggered entrance rather than one repeated fade-in pattern, so the page has a sense of pacing rather than feeling templated.

## Animation approach

Animation is built with **GSAP** and its `ScrollTrigger` plugin, chosen over a declarative animation library because several sequences here are scroll-scrubbed (tied directly to scroll position, not just triggered once) and need fine-grained control over timing and easing:

- **Hero** — a pinned, three-viewport-tall scroll sequence: the eyebrow and supporting copy clear out, "Bio" fades, and the "Aerin" mask hole grows to fill the frame before the page continues into the next section.
- **Section entrances** — a shared reveal pattern (fade + rise, sometimes with a blur-to-focus effect) fires once as each section's content crosses into view, staggered per element rather than firing all at once.
- **Capabilities** — a sticky card stack: each card pins in place as the next slides up to cover most of it, leaving a peek of the card behind, built with plain CSS `position: sticky` rather than a scroll-driven JS reimplementation.
- **Team & partners** — a pinned orbit sequence where avatars converge into a central emblem, then diverge back out as the copy swaps between team and partner content.
- **Small details** — a hover-triggered traveling-wave ripple on divider lines and link underlines, a scroll-progress ring on the back-to-top control, and count-up statistics in the impact section.

Every animated sequence checks `prefers-reduced-motion` and swaps to an instant, static end-state rather than animating for visitors who've asked for reduced motion, and the smoke layer freezes entirely under the same setting.

## Tech stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS v4** for layout and utility styling, with a small set of hand-written CSS files for effects Tailwind can't express (pseudo-elements, keyframe animations, theme-reactive tokens)
- **GSAP** + **ScrollTrigger** for scroll-driven and pinned animation sequences
- **Swiper** for the two carousel sections (insights, testimonials)
- **next/font** for self-hosted, zero-layout-shift font loading
- **next/image** for automatic image optimization, responsive `srcset` generation, and lazy loading
- Canvas 2D (no WebGL/Three.js) for the cursor-reactive particle background

## Features

- Fully responsive layout, tested from small phones through large desktops
- Light/dark theme toggle, independent of OS preference, persisted across visits
- Below-the-fold sections and the particle background are code-split (`next/dynamic`) rather than shipped in the initial bundle
- Autoplaying video is deferred until it's actually about to scroll into view, rather than downloading on page load
- Real page metadata (title, description, Open Graph/Twitter cards), plus generated `robots.txt` and `sitemap.xml`
- Respects `prefers-reduced-motion` throughout

## Getting started

```bash
# install dependencies
npm install

# run the dev server
npm run dev

# open http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint     # run ESLint
```

No environment variables are required to run the project locally.

## Project structure

```text
src/
  app/
    layout.tsx          root layout, fonts, metadata
    page.tsx             composes every section
    globals.css          Tailwind entry point + imports below
    styles/               design tokens and hand-written CSS, split by concern
    robots.ts, sitemap.ts
  components/
    sections/             the eleven page sections (Hero, CTA, etc.)
    chrome/                site-wide chrome (header, footer, theme toggle, back-to-top)
    visuals/                supporting visual/animation components
    ui/                     small shared presentational components
  hooks/                  shared React hooks (e.g. scroll-reveal)
  lib/                    shared GSAP setup and style helpers
```
