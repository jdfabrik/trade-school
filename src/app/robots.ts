import type { MetadataRoute } from "next";

// Static export: these are generated once at build time, not per request.
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";

export default function robots(): MetadataRoute.Robots {
  // A preview build should never end up in search results.
  if (process.env.PREVIEW_NOINDEX === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
