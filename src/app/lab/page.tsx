import type { Metadata } from "next";
import { Card, PageHeader, Shell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Labs",
  description:
    "Three interactive labs: asset selection, portfolio optimization and Bollinger Bands with a live backtest.",
};

export default function LabIndex() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Lab"
        title="Run the software"
        lede="Three labs, in the order the course teaches them. Everything computes in your browser."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card href="/lab/assets/" title="Asset selection" meta="Unit 1.2">
          Prices to returns to a ranking, with the zero-indexing and rounding
          traps visible on screen.
        </Card>
        <Card href="/lab/portfolio/" title="Portfolio optimization" meta="skfolio">
          Minimum risk against maximum Sharpe, with weights in dollars and a
          risk-free rate you can drag.
        </Card>
        <Card href="/lab/bollinger/" title="Bollinger Bands" meta="Units 2.2 &amp; 2.3">
          Live bands, real signals and a backtest against buy-and-hold across
          three market regimes.
        </Card>
      </div>
    </Shell>
  );
}
