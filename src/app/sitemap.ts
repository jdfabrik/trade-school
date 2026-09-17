import type { MetadataRoute } from "next";
import { SECTIONS } from "@/content/sections";

// Static export: these are generated once at build time, not per request.
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/learn/",
    "/lab/",
    "/lab/bollinger/",
    "/lab/assets/",
    "/lab/portfolio/",
    "/quiz/",
    "/quiz/review/",
    "/glossary/",
    "/formulas/",
    "/code/",
    "/setup/",
    ...SECTIONS.map((s) => `/learn/${s.slug}/`),
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : path.startsWith("/lab") ? 0.9 : 0.7,
  }));
}
