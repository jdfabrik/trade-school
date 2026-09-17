import type { MetadataRoute } from "next";

// Static export: generated once at build time.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trade School",
    short_name: "Trade School",
    description:
      "Training for new day traders: log trades with a screenshot and get graded on your process.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0d10",
    theme_color: "#0c0d10",
  };
}
