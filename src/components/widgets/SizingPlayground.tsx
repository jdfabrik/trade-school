"use client";

import { useId, useMemo, useState } from "react";
import CandleChart from "@/components/CandleChart";
import { Stat } from "@/components/ui";
import { REGIMES, type Bar } from "@/data/index";
import { positionSize } from "@/lib/trade";

/**
 * "Put the stop somewhere" — position sizing, felt rather than read.
 *
 * The formula is four seconds of arithmetic and almost nobody believes it until
 * they have watched it run. So the stop is the thing under the learner's hand,
 * and the two numbers to watch sit side by side: the share count, which swings
 * wildly, and the money at risk, which never moves at all.
 *
 * The comparison rows at the bottom are the same three distances printed in the
 * position-sizing lesson. At the default account and risk they come out at 500,
 * 200 and 50 shares, exactly as the lesson says — so a learner who has just read
 * the table can see it is the same sum and not a different one.
 */

const REGIME = REGIMES.find((r) => r.id === "choppy") ?? REGIMES[0];
const ENTRY_INDEX = 65;
const COUNT = 45;
const BARS: Bar[] = REGIME.bars.slice(ENTRY_INDEX - COUNT + 1, ENTRY_INDEX + 1);
const DATES: string[] = REGIME.dates.slice(ENTRY_INDEX - COUNT + 1, ENTRY_INDEX + 1);
const ENTRY = BARS[BARS.length - 1].c;

const ACCOUNTS = [5000, 25000, 100000];
const COMPARE = [0.5, 1.25, 5];

const money0 = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;
const money2 = (n: number) => `$${n.toFixed(2)}`;
const shares = (n: number) => `${n.toLocaleString("en-US")}`;

export default function SizingPlayground() {
  const headingId = useId();
  const stopId = useId();
  const riskId = useId();

  const [distance, setDistance] = useState(1);
  const [riskPct, setRiskPct] = useState(1);
  const [account, setAccount] = useState(25000);

  const sums = useMemo(() => {
    const stop = ENTRY - distance;
    const budget = account * (riskPct / 100);
    const exact = positionSize(account, riskPct, ENTRY, stop);
    const whole = Number.isFinite(exact) ? Math.floor(exact) : 0;
    const risked = whole * distance;
    const cost = whole * ENTRY;
    return {
      stop,
      budget,
      exact,
      whole,
      risked,
      cost,
      costPct: (cost / account) * 100,
    };
  }, [distance, riskPct, account]);

  const overAccount = sums.cost > account;

  const chartLabel =
    `Made-up practice prices with a buy marked at ${money2(ENTRY)} on the last bar and ` +
    `a stop drawn ${money2(distance)} below it at ${money2(sums.stop)}. The shaded band ` +
    `between the two is what one share can cost you.`;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        Put the stop somewhere
      </h2>
      <p className="mt-1 text-sm text-muted">
        You are buying at {money2(ENTRY)}, the last price on the chart. Decide how far
        below that you would admit the idea was wrong, and the size follows from it.
        You never pick the size first.
      </p>

      {/* -------------------------------- chart ------------------------------ */}
      <div className="mt-5">
        <CandleChart
          bars={BARS}
          dates={DATES}
          height={280}
          lines={[
            { price: ENTRY, label: `buy ${money2(ENTRY)}`, tone: "plain", dashed: false },
            { price: sums.stop, label: `stop ${money2(sums.stop)}`, tone: "sell" },
          ]}
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
            <span className="text-muted">How far below the buy your stop sits</span>
            <span className="tabular font-mono text-fg">{money2(distance)}</span>
          </label>
          <input
            id={stopId}
            type="range"
            min={0.2}
            max={6}
            step={0.05}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            The distance from where you get in to where you get out if you are wrong.
            On a real chart this is decided by the chart, not by what you fancy — it
            goes beyond the level that would prove the idea wrong.
          </p>
        </div>

        <div>
          <label htmlFor={riskId} className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Share of the account you will risk</span>
            <span className="tabular font-mono text-fg">{riskPct.toFixed(2)}%</span>
          </label>
          <input
            id={riskId}
            type="range"
            min={0.25}
            max={3}
            step={0.25}
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            What one loss is allowed to cost — {money0(sums.budget)} here. Set this
            once and leave it alone; it is not meant to move trade by trade.
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="font-mono text-xs uppercase tracking-widest text-muted">
          Account
        </legend>
        <div
          role="radiogroup"
          aria-label="Account size"
          className="mt-2 grid grid-cols-3 gap-2"
        >
          {ACCOUNTS.map((size) => {
            const active = account === size;
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAccount(size)}
                className={`tabular rounded-xl border px-3 py-2.5 font-mono text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:border-accent hover:text-fg"
                }`}
              >
                {money0(size)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ------------------------------- answers ----------------------------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Risk per share" value={money2(distance)} />
        <Stat label="Shares to buy" value={shares(sums.whole)} tone="buy" />
        <Stat label="If the stop is hit" value={money0(sums.risked)} tone="sell" />
        <Stat label="Position would cost" value={money0(sums.cost)} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
        <p>
          <span className="tabular font-mono">{money0(sums.budget)}</span> of risk ÷{" "}
          <span className="tabular font-mono">{money2(distance)}</span> a share ={" "}
          <span className="tabular font-mono">{sums.exact.toFixed(1)}</span> shares, which
          you round down to{" "}
          <strong className="tabular font-mono text-fg">{shares(sums.whole)}</strong>.
          Being stopped out then costs{" "}
          <strong className="tabular font-mono text-sell">{money0(sums.risked)}</strong> —
          near enough exactly the {riskPct.toFixed(2)}% you set, and never more.
        </p>
        <p className="mt-2 text-muted">
          Round down, never up. Rounding up risks more than you decided to, and the
          extra profit it buys is not worth the habit.
        </p>
      </div>

      {overAccount && (
        <div className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          At this stop distance the position is worth {money0(sums.cost)} against a{" "}
          {money0(account)} account — {Math.round(sums.costPct)}% of everything you have.
          Your broker may simply not let you hold it. A very tight stop is not free: it
          asks for a position so large that you may not be able to take it at all.
        </div>
      )}

      {/* ----------------------------- comparison ---------------------------- */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <caption className="border-b border-border bg-surface-2 px-3 py-2 text-left text-xs text-muted">
            The same {money0(sums.budget)} of risk, at three different stop distances
          </caption>
          <thead>
            <tr className="bg-surface-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2 font-normal">
                Stop
              </th>
              <th scope="col" className="px-3 py-2 text-right font-normal">
                Shares
              </th>
              <th scope="col" className="px-3 py-2 text-right font-normal">
                At risk
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((d) => {
              const whole = Math.floor(sums.budget / d);
              const mine = Math.abs(d - distance) < 1e-9;
              return (
                <tr
                  key={d}
                  className={`border-t border-border ${mine ? "bg-accent-soft" : ""}`}
                >
                  <th
                    scope="row"
                    className="tabular px-3 py-2 text-left font-mono font-normal"
                  >
                    {money2(d)} away
                    {mine && <span className="ml-1.5 text-xs text-accent">yours</span>}
                  </th>
                  <td className="tabular px-3 py-2 text-right font-mono">
                    {shares(whole)}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-sell">
                    {money0(whole * d)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          Drag the stop from one end of its range to the other. The share count changes
          by a factor of thirty. The money in the third box barely moves. Those two
          facts are the same fact, and it is why a wide stop is not a bigger risk — it
          is a smaller position.
        </p>
        <p className="mt-2 text-muted">
          A trade with a tight stop feels smaller because the position is bigger. It is
          not smaller. It is the same bet, and the tight stop is the one more likely to
          be reached by nothing in particular.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        These are made-up prices for practice, not a real market. The arithmetic is the
        same one the position-size calculator uses.
      </p>
    </section>
  );
}
