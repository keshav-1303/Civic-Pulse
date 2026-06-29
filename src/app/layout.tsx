import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AssistantWidget from "@/components/AssistantWidget";
import Analytics from "@/components/Analytics";
import ServiceWorker from "@/components/ServiceWorker";
import { siteUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const SITE_URL = siteUrl();
const SITE_NAME = "CivicPulse";
const DESCRIPTION =
  "An agentic, hyperlocal civic platform where citizens report, verify, track and resolve community issues, powered by a team of Google Gemini AI agents.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CivicPulse - AI Community Hero",
    template: "%s · CivicPulse",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "CivicPulse" }],
  generator: "Next.js",
  keywords: [
    "civic tech",
    "community issues",
    "report pothole",
    "municipal",
    "AI agents",
    "Google Gemini",
    "smart city",
    "hyperlocal",
    "civic engagement",
  ],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "CivicPulse - AI Community Hero",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicPulse - AI Community Hero",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16b783" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1220" },
  ],
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "GovernmentApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="min-h-screen font-sans">
        {/* Liquid Glass refraction filter (Chromium); Safari/Firefox fall back to frosted glass */}
        <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.011" numOctaves={2} seed={42} result="turb" />
            <feGaussianBlur in="turb" stdDeviation={1.4} result="soft" />
            <feDisplacementMap in="SourceGraphic" in2="soft" scale={30} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
          {children}
        </main>
        <AssistantWidget />
        <footer className="glass-bar border-x-0 border-b-0">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-sm text-ink-400">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p>
                <span className="font-semibold text-ink-600">CivicPulse</span> · Community Hero · Hyperlocal Problem Solver
              </p>
              <nav className="flex items-center gap-4" aria-label="Footer">
                <Link href="/about" className="hover:text-ink-700">About</Link>
                <Link href="/privacy" className="hover:text-ink-700">Privacy</Link>
                <Link href="/terms" className="hover:text-ink-700">Terms</Link>
              </nav>
            </div>
            <p className="text-center text-xs text-ink-400 sm:text-left">
              Built by <span className="font-semibold text-ink-600">Keshav Lohani</span> · Reasoning by Google Gemini
            </p>
          </div>
        </footer>
        <ServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
