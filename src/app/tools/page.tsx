import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import { Callout, Narrow, PageHeader } from "@/components/ui";
import { TOOLS } from "@/content/tools";
import type { WidgetId } from "@/content/types";
import LessonWidget from "@/components/widgets/registry";

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

/**
 * A chart to sit under the calculator that does the same sum.
 *
 * Typing numbers into boxes teaches the formula. Dragging a stop across a chart
 * teaches what the formula is for, which is the part that survives the week. So
 * each of these hangs off the calculator it belongs to rather than living on a
 * page of its own, and the note above it says plainly that the two are the same
 * arithmetic.
 *
 * Only the id and the caption cross into the interactive part, which is what a
 * calculator's own compute function could never do.
 */
const CHART_AFTER: Record<string, { id: WidgetId; lead: string; caption: string }> = {
  "position-size": {
    id: "sizing-playground",
    lead:
      "Same sum, drawn instead of typed. The boxes above and the chart below work out the position exactly the same way — the chart just lets you put the stop somewhere and see what it costs you.",
    caption:
      "Drag the stop further from the entry and watch the share count fall while the money at risk stays where you set it. That is the whole formula, moving.",
  },
  breakeven: {
    id: "reward-risk-playground",
    lead:
      "Same two sums, drawn instead of typed. Moving the target on this chart changes the reward:risk in the calculator above it, and the win rate you need follows from that one number.",
    caption:
      "Pull the target further from the entry, then look at how far the win rate you need drops. Pull it in close and watch how often you would have to be right.",
  },
};

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
        {ORDERED.map((tool) => {
          const chart = CHART_AFTER[tool.id];
          return (
            <div key={tool.id}>
              <Calculator toolId={tool.id} />
              {chart && (
                <>
                  <p className="mt-5 text-sm text-muted">{chart.lead}</p>
                  <LessonWidget id={chart.id} caption={chart.caption} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </Narrow>
  );
}
