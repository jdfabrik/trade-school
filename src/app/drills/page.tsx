import type { Metadata } from "next";
import { Suspense } from "react";
import DrillRunner from "./DrillRunner";
import { Card, Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Drills",
  description:
    "Short drills on risk, position sizing, stops and R — plus judgement calls where you decide whether a trade was well taken, including trades that made money and were still bad.",
};

export default function DrillsPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Drills"
        title="Practise the decisions"
        lede="Short questions on the numbers, and harder ones on judgement. The judgement drills show you a finished trade and ask whether it was well taken. Some of them made money and were still bad trades."
      />

      <Suspense
        fallback={
          <p className="text-sm text-muted">Loading the drill&hellip;</p>
        }
      >
        <DrillRunner />
      </Suspense>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">
          Or practise on a chart
        </h2>
        <Card href="/drills/chart/" title="Chart markup" meta="Drill">
          Mark an entry, a stop and a target on a chart, size the position, and
          have the markup graded before you see what happened next.
        </Card>
      </div>
    </Narrow>
  );
}
