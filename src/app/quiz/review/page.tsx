import type { Metadata } from "next";
import { Suspense } from "react";
import QuizRunner from "../QuizRunner";
import { Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Weak spots",
  description: "Re-drill the questions you have answered incorrectly.",
};

export default function ReviewPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Drill"
        title="Your weak spots"
        lede="Everything you have answered wrong, most-missed first. Stored in this browser only."
      />
      <Suspense fallback={<div className="card p-6 text-muted">Loading…</div>}>
        <QuizRunner mode="review" />
      </Suspense>
    </Narrow>
  );
}
