import type { Metadata } from "next";
import { PageHeader, Shell } from "@/components/ui";
import JournalHistory from "./JournalHistory";

export const metadata: Metadata = {
  title: "Your journal",
  description:
    "Every trade you have logged, graded on process, with your results measured in R, the habits you miss most often, and a CSV export. Stored in your browser only.",
};

export default function JournalHistoryPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Your journal"
        title="Your record"
        lede="What you have logged so far, and what it says about how you are trading. The grades measure the decisions you made; the money is kept beside them, not inside them."
      />
      <JournalHistory />
    </Shell>
  );
}
