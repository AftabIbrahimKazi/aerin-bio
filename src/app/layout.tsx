import type { Metadata } from "next";
import { Geist, Fragment_Mono } from "next/font/google";
import Script from "next/script";
import dynamic from "next/dynamic";
import Header from "@/components/chrome/Header";
import Footer from "@/components/chrome/Footer";
import ScrollToTopButton from "@/components/chrome/ScrollToTopButton";
import "./globals.css";

// Canvas-based particle system, not needed for first paint or the LCP
// element — its own chunk instead of sitting in the shared root bundle
// every route pays for.
const SmokeBackground = dynamic(() => import("@/components/chrome/SmokeBackground"));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: "400",
});

const SITE_URL = "https://aerinbio.com";
const SITE_TITLE = "Aerin Bio — Medicine that breathes with you.";
const SITE_DESCRIPTION =
  "Aerin Bio engineers antibodies, peptides, and gene therapies as inhaled biologics — delivered as a fine respirable mist straight to lung tissue instead of through the entire bloodstream.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Aerin Bio",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Aerin Bio",
    images: ["/hero-section.avif"],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/hero-section.avif"],
  },
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fragmentMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Reverted an attempt to also clip overflow-x on <html> (tried both
          -hidden and -clip) — both broke Capabilities' position:sticky
          stack in practice, confirmed by screenshot, regardless of the
          spec-level distinction between the two. Back to body-only, which
          is what the sticky stack was built and confirmed working against.
          The real fix for the horizontal-scroll/rubber-band report is to
          find and eliminate the actual overflowing element, not to clip
          the root. */}
      <body className="min-h-full flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <SmokeBackground />
        <Header />
        {children}
        <Footer />
        <ScrollToTopButton />
      </body>
    </html>
  );
}
