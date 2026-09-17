import type { Metadata } from "next";
import { Suspense } from "react";
import QuizRunner from "./QuizRunner";
import { Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Graded drills",
  description:
    "Graded practice on algorithmic trading with Python: multiple choice, numeric answers and find-the-error code questions, each with a worked explanation.",
};

export default function QuizPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Drill"
        title="Graded practice"
        lede="Marked immediately, with the working shown and a link back to the section that teaches it."
      />
      <Suspense fallback={<div className="card p-6 text-muted">Loading…</div>}>
        <QuizRunner mode="all" />
      </Suspense>
    </Narrow>
  );
}
