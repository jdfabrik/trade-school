import type { Metadata } from "next";
import Link from "next/link";
import ChartDrill from "./ChartDrill";
import { Shell, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Chart markup drill",
  description:
    "Mark an entry, a stop and a target on a practice chart, size the position with the 1% rule, and have the markup graded before you see what the price did next.",
};

export default function ChartDrillPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Drills"
        title="Chart markup"
        lede="Part of the chart is hidden. Decide where you would get in, where you would admit you were wrong, and where you would take profit. The markup gets graded first — what happened next comes after."
      />

      <ChartDrill />

      <p className="mt-8 text-sm text-muted">
        <Link
          href="/drills/"
          className="text-accent underline underline-offset-4"
        >
          &larr; Back to the other drills
        </Link>
      </p>
    </Shell>
  );
}
