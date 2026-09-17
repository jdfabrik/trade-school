import type { Metadata } from "next";
import Link from "next/link";
import PortfolioLab from "./PortfolioLab";
import { PageHeader, Shell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Portfolio optimization lab",
  description:
    "Minimum risk against maximum Sharpe on the same ten assets, with live weights in dollars and the risk-free rate you can move.",
};

export default function PortfolioLabPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Lab"
        title="Two objectives, same ten assets"
        lede="Minimum risk and maximum Sharpe side by side. The difference between them is the whole of the portfolio unit."
      />
      <PortfolioLab />
      <p className="mt-10 text-sm">
        <Link href="/lab/bollinger/" className="text-accent underline underline-offset-4">
          Next: build a trading signal →
        </Link>
      </p>
    </Shell>
  );
}
