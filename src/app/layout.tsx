import type { Metadata } from "next";
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
    default: "Trade School — grade your own trading",
    template: "%s · Trade School",
  },
  description:
    "Training for new day traders. Log your trades with a screenshot, get graded on the decisions you controlled rather than the money, and practise the habits that keep an account alive.",
  openGraph: {
    title: "Trade School",
    description:
      "Log your trades, get graded on your process, and build the habits that keep an account alive.",
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
        {/* Applies a saved theme before anything paints, so a reader who chose
            light mode does not get a flash of dark.

            This is a plain inline <script> rather than next/script, and it is
            the first thing in the body on purpose. A `beforeInteractive` Script
            is not inlined in a statically exported page: it is queued on
            `self.__next_s` and replayed once the framework bundle has loaded,
            which is several hundred milliseconds after first paint. That is too
            late for the flash, and too late for the theme toggle, which reads
            the attribute this line sets. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:ring-2 focus:ring-accent"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
