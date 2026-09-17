import type { Metadata } from "next";
import Link from "next/link";
import AssetLab from "./AssetLab";
import { PageHeader, Shell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Asset selection lab",
  description:
    "Walk the asset-selection pipeline: prices to returns to expected returns to a ranking, with the zero-indexing and rounding traps made visible.",
};

export default function AssetLabPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Lab"
        title="Asset selection, step by step"
        lede="The unit 1.2 workflow with every intermediate result on screen — including the two places the row count changes."
      />
      <AssetLab />
      <p className="mt-10 text-sm">
        <Link href="/lab/portfolio/" className="text-accent underline underline-offset-4">
          Next: turn this ranking into an allocation →
        </Link>
      </p>
    </Shell>
  );
}
