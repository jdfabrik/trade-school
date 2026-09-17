import type { MetadataRoute } from "next";

// Static export: generated once at build time.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Algorithmic Trading School",
    short_name: "Algo School",
    description:
      "Learn algorithmic trading with Python: Bollinger Bands, portfolio optimization and backtesting, with an interactive lab and graded practice.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0d10",
    theme_color: "#0c0d10",
  };
}
