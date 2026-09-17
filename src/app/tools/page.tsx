import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import { Callout, Narrow, PageHeader } from "@/components/ui";
import { TOOLS } from "@/content/tools";

export const metadata: Metadata = {
  title: "Calculators",
  description:
    "Six plain calculators for the numbers a trader works out before and after a trade: position size, risk, reward to risk, breakeven win rate, expectancy and the cost of a losing streak.",
};

/**
 * The order the page reads in, which is the order you meet these numbers in
 * real life rather than the order they happen to sit in the content file.
 */
const ORDER = [
  "position-size",
  "risk-check",
  "reward-risk",
  "breakeven",
  "expectancy",
  "drawdown",
];

const ORDERED = [
  ...ORDER.map((id) => TOOLS.find((t) => t.id === id)).filter((t) => t !== undefined),
  ...TOOLS.filter((t) => !ORDER.includes(t.id)),
];

export default function ToolsPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Calculators"
        title="The numbers, worked out for you"
        lede="Six calculators. The first one is the only one you need every single time: before you place a trade, work out your position size."
      />

      <p className="text-sm text-muted">
        These are the same sums the lessons walk through, so you can check your own
        arithmetic in a few seconds. Change any box and the answer updates as you
        type. Where a lesson has a worked example, you can load it and compare.
      </p>

      <Callout tone="note">
        A calculator can tell you how much to buy and what it would cost you to be
        wrong. It cannot tell you whether the trade is worth taking. That judgement
        is yours, and it is built from your own record of what you did and what
        happened afterwards.
      </Callout>

      <nav aria-label="Calculators on this page" className="mt-6">
        <ul className="flex flex-wrap gap-1.5">
          {ORDERED.map((tool) => (
            <li key={tool.id}>
              <a
                href={`#${tool.id}`}
                className="inline-block rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {tool.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 space-y-5">
        {ORDERED.map((tool) => (
          <Calculator key={tool.id} toolId={tool.id} />
        ))}
      </div>
    </Narrow>
  );
}
