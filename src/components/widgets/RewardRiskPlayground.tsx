"use client";

import { useId, useMemo, useState } from "react";
import CandleChart, { type PriceLine } from "@/components/CandleChart";
import { Stat } from "@/components/ui";
import { REGIMES, type Bar } from "@/data/index";
import { breakevenWinRate, plannedRR } from "@/lib/trade";

/**
 * "How far is the target, and how often must you be right" — the two numbers
 * moving together.
 *
 * Reward to risk and break-even win rate are usually taught as two separate
 * tables, which hides the fact that they are one number seen from two sides.
 * Here the learner drags the target and both figures move at once, so the
 * trade-off arrives as a single motion rather than as two facts to memorise.
 *
 * The faint ladder on the chart is the other half of the idea: once the stop is
 * placed, every price above the entry can be read as a multiple of it. That is
 * what R means, and seeing the rungs is faster than explaining it.
 */

const REGIME = REGIMES.find((r) => r.id === "choppy") ?? REGIMES[0];
const ENTRY_INDEX = 121;
const COUNT = 45;
const BARS: Bar[] = REGIME.bars.slice(ENTRY_INDEX - COUNT + 1, ENTRY_INDEX + 1);
const DATES: string[] = REGIME.dates.slice(ENTRY_INDEX - COUNT + 1, ENTRY_INDEX + 1);
const ENTRY = BARS[BARS.length - 1].c;

/** A fixed amount at stake, so the ratio can also be read in money. */
const RISK_BUDGET = 250;
const OUT_OF = 20;

const money2 = (n: number) => `$${n.toFixed(2)}`;
const money0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function RewardRiskPlayground() {
  const headingId = useId();
  const stopId = useId();
  const targetId = useId();
  const dotsId = useId();

  const [stopDistance, setStopDistance] = useState(1);
  const [targetDistance, setTargetDistance] = useState(3);

  const sums = useMemo(() => {
    const stop = ENTRY - stopDistance;
    const target = ENTRY + targetDistance;
    const rr = plannedRR({ entry: ENTRY, stop, target });
    const breakeven = breakevenWinRate(rr);
    const needed = Math.ceil((breakeven / 100) * OUT_OF);
    return {
      stop,
      target,
      rr,
      breakeven,
      needed,
      payout: RISK_BUDGET * rr,
    };
  }, [stopDistance, targetDistance]);

  /* The rungs: entry plus one risk, two risks, and so on. */
  const lines: PriceLine[] = useMemo(() => {
    const rungs: PriceLine[] = [];
    const top = Math.min(5, Math.floor(sums.rr));
    for (let n = 1; n <= top; n += 1) {
      const price = ENTRY + n * stopDistance;
      if (Math.abs(price - sums.target) < stopDistance * 0.2) continue;
      rungs.push({ price, label: `+${n}R`, tone: "muted" });
    }
    return [
      { price: ENTRY, label: `buy ${money2(ENTRY)}`, tone: "plain", dashed: false },
      { price: sums.stop, label: `stop ${money2(sums.stop)}`, tone: "sell" },
      {
        price: sums.target,
        label: `target ${money2(sums.target)} · ${sums.rr.toFixed(1)}R`,
        tone: "buy",
      },
      ...rungs,
    ];
  }, [stopDistance, sums]);

  const chartLabel =
    `Made-up practice prices with a buy at ${money2(ENTRY)}, a stop at ` +
    `${money2(sums.stop)} and a target at ${money2(sums.target)}. That is a reward to ` +
    `risk of ${sums.rr.toFixed(1)} to 1, so you would need to win ` +
    `${sums.breakeven.toFixed(1)} per cent of the time to end level.`;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        How far is the target
      </h2>
      <p className="mt-1 text-sm text-muted">
        Three prices decide a trade before you take it: where you get in, where you
        admit you were wrong, and where you would take the money. Move the bottom two
        and watch what the trade is worth — and how often you would have to be right
        for it to be worth taking at all.
      </p>
      <p className="mt-2 text-sm text-muted">
        The distance from the buy to the stop is one R. Everything else is counted in
        those units, which is what the faint rungs on the chart are marking.
      </p>

      {/* -------------------------------- chart ------------------------------ */}
      <div className="mt-5">
        <CandleChart
          bars={BARS}
          dates={DATES}
          height={300}
          lines={lines}
          markers={[
            {
              index: BARS.length - 1,
              price: ENTRY,
              side: "buy",
              label: `Buy at ${money2(ENTRY)}`,
            },
          ]}
          shadeBetween={{ from: ENTRY, to: sums.stop, tone: "sell" }}
          ariaLabel={chartLabel}
        />
      </div>

      {/* ------------------------------ controls ----------------------------- */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={stopId} className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Stop, below the buy</span>
            <span className="tabular font-mono text-fg">{money2(stopDistance)}</span>
          </label>
          <input
            id={stopId}
            type="range"
            min={0.25}
            max={4}
            step={0.05}
            value={stopDistance}
            onChange={(e) => setStopDistance(Number(e.target.value))}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            This distance is one R. Moving it changes what every other price on the
            chart is worth, which is why the rungs shift when you drag it.
          </p>
        </div>

        <div>
          <label
            htmlFor={targetId}
            className="flex items-baseline justify-between text-sm"
          >
            <span className="text-muted">Target, above the buy</span>
            <span className="tabular font-mono text-fg">{money2(targetDistance)}</span>
          </label>
          <input
            id={targetId}
            type="range"
            min={0.25}
            max={8}
            step={0.05}
            value={targetDistance}
            onChange={(e) => setTargetDistance(Number(e.target.value))}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            Where you would take the money. Somewhere price has a reason to reach — the
            other side of a range, the last high — not a number that makes the sum look
            good.
          </p>
        </div>
      </div>

      {/* ------------------------------- answers ----------------------------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reward to risk" value={`${sums.rr.toFixed(1)} : 1`} />
        <Stat
          label="Wins needed to break even"
          value={`${sums.breakeven.toFixed(1)}%`}
        />
        <Stat label="If it works" value={money0(sums.payout)} tone="buy" />
        <Stat label="If it does not" value={money0(RISK_BUDGET)} tone="sell" />
      </div>

      <p className="mt-2 text-xs text-muted">
        The money figures assume you put {money0(RISK_BUDGET)} at stake, which is 1% of
        a {money0(25000)} account.
      </p>

      {/* --------------------------- twenty trades --------------------------- */}
      <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-4">
        <p id={dotsId} className="font-mono text-[11px] uppercase tracking-wide text-muted">
          Out of your next 20 trades, wins needed just to end level
        </p>
        <div
          role="img"
          aria-labelledby={dotsId}
          aria-label={`${sums.needed} of 20 trades would have to win.`}
          className="mt-2.5 flex flex-wrap gap-1.5"
        >
          {Array.from({ length: OUT_OF }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-6 w-6 rounded-full border ${
                i < sums.needed
                  ? "border-buy bg-buy/70"
                  : "border-border bg-surface"
              }`}
            />
          ))}
        </div>
        <p className="tabular mt-2.5 font-display text-2xl font-bold text-accent">
          {sums.needed} out of 20
        </p>
        <p className="mt-1 text-sm text-muted">
          At {sums.rr.toFixed(1)} to 1 you can be wrong {OUT_OF - sums.needed} times out
          of twenty and still finish where you started. Everything above that is profit.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          Pull the target out to the far end. The win rate you need collapses — at five
          to one you can be wrong four times in five. Now pull it right in. You need to
          be right most of the time, which almost nobody is, for a much smaller reward
          each time. That shape is why traders who need to be right tend to lose money.
        </p>
        <p className="mt-2 text-muted">
          The honest other half: a target further away is reached less often, and this
          chart cannot tell you how much less. A ratio is a plan, not a promise, and it
          only counts if you actually leave the trade alone long enough to find out.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        These are made-up prices for practice, not a real market. The two sums here are
        the ones behind the reward:risk and breakeven calculators.
      </p>
    </section>
  );
}
