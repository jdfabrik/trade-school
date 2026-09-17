import type { MetadataRoute } from "next";
import { LESSONS } from "@/content/lessons";

// Static export: these are generated once at build time, not per request.
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";

/** Pages a trader uses every session rank above the reference material. */
const PRIMARY = new Set(["/journal/", "/journal/history/", "/drills/", "/drills/chart/"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/journal/",
    "/journal/history/",
    "/learn/",
    ...LESSONS.map((l) => `/learn/${l.slug}/`),
    "/drills/",
    "/drills/chart/",
    "/tools/",
    "/glossary/",
    "/reality/",
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : PRIMARY.has(path) ? 0.9 : 0.7,
  }));
}
