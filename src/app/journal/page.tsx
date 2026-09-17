import type { Metadata } from "next";
import { PageHeader, Shell } from "@/components/ui";
import TradeForm from "./TradeForm";

export const metadata: Metadata = {
  title: "Log a trade",
  description:
    "Record a real trade — entry, stop, target, size and the reason you took it — and get it graded on the process rather than the profit. Everything stays in your browser.",
};

export default function JournalPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Your journal"
        title="Log a trade"
        lede="Type in a trade you actually took. It gets graded on what you controlled — the stop, the size, the plan — and the money it made or lost is reported separately, because those are two different results."
      />
      <TradeForm />
    </Shell>
  );
}
