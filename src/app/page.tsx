import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";

// Hero stays a static import — it's the LCP element, so it must ship in the
// initial bundle. Everything below it is off-screen at load on every
// viewport this design targets, so each section is its own chunk instead of
// bloating the bundle every visitor downloads before they've scrolled.
const TeamAndPartners = dynamic(() => import("@/components/sections/TeamAndPartners"));
const Innovation = dynamic(() => import("@/components/sections/Innovation"));
const Production = dynamic(() => import("@/components/sections/Production"));
const Technology = dynamic(() => import("@/components/sections/Technology"));
const Capabilities = dynamic(() => import("@/components/sections/Capabilities"));
const Leadership = dynamic(() => import("@/components/sections/Leadership"));
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"));
const Blog = dynamic(() => import("@/components/sections/Blog"));
const Impact = dynamic(() => import("@/components/sections/Impact"));
const CTA = dynamic(() => import("@/components/sections/CTA"));

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <TeamAndPartners />
      {/* One shared blur wrapper for every section from here down — adjacent
          independently-blurred sections show a seam at the join, since
          backdrop-filter can't sample across an element's own boundary.
          Innovation/Technology/Capabilities get their own connective seams
          (.section-seam) between them so they read as one mechanism. */}
      <div className="bg-[color:var(--background)]/70 backdrop-blur-md">
        <Innovation />
        <Production />
        <Technology />
        <Capabilities />
        <Leadership />
        <Testimonials />
        <Blog />
        <Impact />
      </div>
      <CTA />
    </main>
  );
}
