import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { THEME_BOOT_SCRIPT } from "@/lib/clientStore";
import SiteFooter from "@/components/SiteFooter";

const display = Space_Grotesk({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body-family",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Algorithmic Trading School",
    template: "%s · Algorithmic Trading School",
  },
  description:
    "Learn algorithmic trading with Python: Bollinger Bands, portfolio optimization and backtesting, with an interactive lab and graded practice.",
  openGraph: {
    title: "Algorithmic Trading School",
    description:
      "Bollinger Bands, portfolio optimization and backtesting — with an interactive lab and graded practice.",
    type: "website",
  },
  robots: process.env.PREVIEW_NOINDEX === "1" ? { index: false, follow: false } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen flex flex-col`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:ring-2 focus:ring-accent"
        >
          Skip to content
        </a>
        {/* Applies a saved theme ahead of hydration, so a reader who chose
            light mode does not get a flash of dark. */}
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
