"use client";

import { useId, useMemo, useState } from "react";
import CandleChart, { type Marker } from "@/components/CandleChart";
import { Stat } from "@/components/ui";
import { REGIMES, type Bar } from "@/data/index";

/**
 * "How much room does a stop need" — the bullet people argue with, made real.
 *
 * A learner reads "far enough out that ordinary noise does not reach it" and
 * hears a vague suggestion. What settles it is a count: of the sixty days before
 * this trade, how many fell that far below their own opening price without
 * anything happening at all. When the answer is twenty-one, a stop that close is
 * not a stop, and no argument is needed.
 *
 * The second half is the part tight-stop advocates skip. A wider stop means a
 * smaller position for the same money at stake, so the share count is on screen
 * next to the survival. Neither end of the slider is free, and the widget is
 * careful not to pretend otherwise.
 */

const REGIME = REGIMES.find((r) => r.id === "crash") ?? REGIMES[0];
const ENTRY_INDEX = 329;
const PRE = 12;
const POST = 40;
const FROM = ENTRY_INDEX - PRE;
const BARS: Bar[] = REGIME.bars.slice(FROM, ENTRY_INDEX + POST + 1);
const DATES: string[] = REGIME.dates.slice(FROM, ENTRY_INDEX + POST + 1);
const ENTRY = REGIME.bars[ENTRY_INDEX].c;

/** How far this thing travels between its high and low on an ordinary day. */
const LOOKBACK = 20;
const AVERAGE_DAY =
  REGIME.bars
    .slice(ENTRY_INDEX - LOOKBACK, ENTRY_INDEX)
    .reduce((sum, b) => sum + (b.h - b.l), 0) / LOOKBACK;

/** The days before the trade, used to count how ordinary a given dip is. */
const HISTORY = 60;
const PAST: Bar[] = REGIME.bars.slice(ENTRY_INDEX - HISTORY, ENTRY_INDEX);

const RISK_BUDGET = 250;

const money2 = (n: number) => `$${n.toFixed(2)}`;
const money0 = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

export default function StopNoise() {
  const headingId = useId();
  const stopId = useId();

  const [distance, setDistance] = useState(10);

  const run = useMemo(() => {
    const stop = ENTRY - distance;
    const after = BARS.slice(PRE + 1);

    let hitDay: number | null = null;
    for (let k = 0; k < after.length; k += 1) {
      if (after[k].l <= stop) {
        hitDay = k + 1;
        break;
      }
    }

    const finalClose = after[after.length - 1].c;
    const exit = hitDay === null ? finalClose : stop;
    const size = Math.max(1, Math.floor(RISK_BUDGET / distance));
    const perShare = exit - ENTRY;

    /* How many ordinary days, before you were even in, fell this far. */
    const noiseDays = PAST.filter((b) => b.o - b.l >= distance).length;

    return {
      stop,
      hitDay,
      finalClose,
      exit,
      size,
      result: perShare / distance,
      money: perShare * size,
      noiseDays,
      multiple: distance / AVERAGE_DAY,
      highWater: Math.max(...after.map((b) => b.h)),
    };
  }, [distance]);

  const markers: Marker[] = [
    {
      index: PRE,
      price: ENTRY,
      side: "buy",
      label: `Buy at ${money2(ENTRY)}`,
    },
  ];
  if (run.hitDay !== null) {
    markers.push({
      index: PRE + run.hitDay,
      price: run.stop,
      side: "sell",
      label: `Stopped out at ${money2(run.stop)}`,
    });
  }

  const chartLabel =
    `Made-up practice prices. A buy at ${money2(ENTRY)} with a stop ${money2(distance)} ` +
    `below it at ${money2(run.stop)}. ` +
    (run.hitDay === null
      ? `The stop was never reached, and price finished at ${money2(run.finalClose)}.`
      : `The stop was reached on day ${run.hitDay}, after which price went on to ` +
        `${money2(run.highWater)} and finished at ${money2(run.finalClose)}.`);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        How much room does a stop need
      </h2>
      <p className="mt-1 text-sm text-muted">
        You bought at {money2(ENTRY)}, marked on the chart. On an ordinary day this
        thing travels about{" "}
        <strong className="tabular font-mono text-fg">{money2(AVERAGE_DAY)}</strong>{" "}
        between its high and its low, with nothing in particular happening. Now decide
        how far away to put the stop.
      </p>

      {/* -------------------------------- chart ------------------------------ */}
      <div className="mt-5">
        <CandleChart
          bars={BARS}
          dates={DATES}
          height={300}
          lines={[
            { price: ENTRY, label: `buy ${money2(ENTRY)}`, tone: "plain", dashed: false },
            { price: run.stop, label: `stop ${money2(run.stop)}`, tone: "sell" },
          ]}
          markers={markers}
          shadeBetween={{ from: ENTRY, to: run.stop, tone: "sell" }}
          ariaLabel={chartLabel}
        />
      </div>

      {/* ------------------------------- control ----------------------------- */}
      <div className="mt-5">
        <label htmlFor={stopId} className="flex items-baseline justify-between text-sm">
          <span className="text-muted">How far below the buy your stop sits</span>
          <span className="tabular font-mono text-fg">
            {money2(distance)} · {run.multiple.toFixed(2)} average days
          </span>
        </label>
        <input
          id={stopId}
          type="range"
          min={1}
          max={16}
          step={0.25}
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="mt-2 h-7 w-full cursor-pointer"
        />
        <p className="mt-1 text-xs text-muted">
          Drag it in until the trade gets stopped out, then look at what price did
          afterwards. The number beside it says how many ordinary days of movement fit
          in that gap.
        </p>
      </div>

      {/* ------------------------------- figures ----------------------------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Ordinary days that reach it"
          value={`${run.noiseDays} of ${HISTORY}`}
          tone={run.noiseDays > HISTORY / 5 ? "sell" : undefined}
        />
        <Stat label="Shares you could take" value={run.size.toLocaleString("en-US")} />
        <Stat
          label="How it ended"
          value={`${run.result >= 0 ? "+" : "−"}${Math.abs(run.result).toFixed(1)}R`}
          tone={run.result >= 0 ? "buy" : "sell"}
        />
        <Stat
          label="In money"
          value={money0(run.money)}
          tone={run.money >= 0 ? "buy" : "sell"}
        />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
        <p>
          In the sixty days before you bought,{" "}
          <strong className="tabular font-mono text-fg">{run.noiseDays}</strong> of them
          fell at least {money2(distance)} below their own opening price — on a day when
          nothing was wrong.{" "}
          {run.noiseDays >= 12
            ? "A stop that close is not protecting you from being wrong. It is standing in traffic."
            : run.noiseDays === 0
              ? "Nothing in the recent past reached that far, so getting hit here would mean something genuinely changed."
              : "That is unusual but not rare. It could happen to you in a fortnight."}
        </p>
      </div>

      <div
        className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
          run.hitDay === null
            ? "border-buy/40 bg-buy/10"
            : "border-sell/40 bg-sell/10"
        }`}
      >
        {run.hitDay === null ? (
          <p>
            The stop was never reached. Price ran on to {money2(run.highWater)} and
            finished at {money2(run.finalClose)}, so you are ahead by{" "}
            <strong className="tabular font-mono">
              {money0(run.finalClose - ENTRY)} a share
            </strong>
            . Because the stop is wide you are only holding{" "}
            {run.size.toLocaleString("en-US")} shares, so the whole thing is worth{" "}
            <strong className="tabular font-mono">{money0(run.money)}</strong>.
          </p>
        ) : (
          <p>
            Stopped out on day {run.hitDay} at {money2(run.stop)}, for a loss of{" "}
            <strong className="tabular font-mono">{money0(run.money)}</strong>. Price
            then carried on up to {money2(run.highWater)} and finished the stretch at{" "}
            {money2(run.finalClose)}. You were right about the direction and it made no
            difference at all.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          A tight stop buys you a large position, and hands it straight back by getting
          hit on a day that meant nothing. A wide stop survives the noise, and the
          position it allows is much smaller. Neither end of that slider is free. What
          you are choosing is not how much to risk — that was fixed at{" "}
          {money0(RISK_BUDGET)} before you started — but how likely you are to be thrown
          out of a trade you got right.
        </p>
        <p className="mt-2 text-muted">
          So the stop goes where the idea stops being true, and the size is worked out
          afterwards. That order is the whole discipline. Deciding you want a big
          position and then finding somewhere nearby to put the stop is the same mistake
          wearing a different hat.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        These are made-up prices for practice, not a real market. This also assumes you
        were filled at exactly your stop price. In a fast market you often are not, and
        the loss is a little worse than planned.
      </p>
    </section>
  );
}
