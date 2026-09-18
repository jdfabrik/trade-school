"use client";

import { useId, useMemo, useState } from "react";
import CandleChart, { type Marker, type PriceLine } from "@/components/CandleChart";
import { Stat } from "@/components/ui";
import { REGIMES, type Bar } from "@/data/index";

/**
 * "Move the stop" — the one habit that turns a planned small loss into an
 * unplanned large one, put in the learner's hands a day at a time.
 *
 * Telling somebody never to widen a stop does not work, because widening it
 * sometimes rescues the trade and everyone has heard that story. So this does
 * not argue. It hands over three stretches of practice prices that look alike on
 * the day you have to decide, and lets the learner widen away:
 *
 *   - the first rewards it spectacularly, which is why the habit survives;
 *   - the second punishes it, which is what it costs;
 *   - the third never threatens the stop at all.
 *
 * Beside every result sits the same trade with the stop left alone, so the two
 * are never compared from memory. Results are counted in the ORIGINAL risk: if
 * you widened and lost, you lost more than the one R you agreed to, and the
 * number says so.
 *
 * Nothing random happens here. The stretches are fixed and the days play out in
 * the order they are stored, so two people can talk about the same trade.
 */

/* -------------------------------- scenarios ------------------------------- */

const PRE = 12;
const POST = 25;
const RISK_BUDGET = 250;

interface Scenario {
  id: string;
  label: string;
  bars: Bar[];
  dates: string[];
  /** Where the entry sits inside `bars`. */
  entryIndex: number;
  entry: number;
  /** Distance from entry to the stop you placed before you got in. */
  risk: number;
  size: number;
}

interface Outcome {
  day: number;
  price: number;
  reason: "stop" | "end";
}

function build(
  id: string,
  label: string,
  regimeId: string,
  index: number,
  risk: number,
): Scenario {
  const regime = REGIMES.find((r) => r.id === regimeId) ?? REGIMES[0];
  const from = index - PRE;
  return {
    id,
    label,
    bars: regime.bars.slice(from, index + POST + 1),
    dates: regime.dates.slice(from, index + POST + 1),
    entryIndex: PRE,
    entry: regime.bars[index].c,
    risk,
    size: Math.max(1, Math.floor(RISK_BUDGET / risk)),
  };
}

const SCENARIOS: Scenario[] = [
  build("first", "First stretch", "trending", 477, 2.7),
  build("second", "Second stretch", "trending", 217, 2.05),
  build("third", "Third stretch", "trending", 481, 2.85),
];

/** Play a stretch out with one fixed stop, which is what discipline looks like. */
function replay(scen: Scenario, stop: number): Outcome {
  const after = scen.bars.slice(scen.entryIndex + 1, scen.entryIndex + 1 + POST);
  for (let k = 0; k < after.length; k += 1) {
    if (after[k].l <= stop) return { day: k + 1, price: stop, reason: "stop" };
  }
  return { day: POST, price: after[after.length - 1].c, reason: "end" };
}

const money2 = (n: number) => `$${n.toFixed(2)}`;
const money0 = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
const showR = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}R`;

/* --------------------------------- widget --------------------------------- */

export default function MovingStop() {
  const headingId = useId();
  const stopId = useId();

  const [which, setWhich] = useState(0);
  const scen = SCENARIOS[which];

  const [day, setDay] = useState(0);
  const [stop, setStop] = useState(SCENARIOS[0].entry - SCENARIOS[0].risk);
  const [movedAway, setMovedAway] = useState(false);
  const [closed, setClosed] = useState<Outcome | null>(null);

  const startingStop = scen.entry - scen.risk;
  const lastClose = scen.bars[scen.entryIndex + day].c;
  const open = closed === null;

  /* What the same trade does if you never touch the stop. Fixed per stretch. */
  const disciplined = useMemo(() => replay(scen, scen.entry - scen.risk), [scen]);

  const inR = (price: number) => (price - scen.entry) / scen.risk;

  /** The most this trade can still cost, given where the stop is right now. */
  const worstCase = (scen.entry - stop) * scen.size;
  const worstR = (scen.entry - stop) / scen.risk;

  const maxStop = Math.max(
    startingStop,
    Math.floor((lastClose - 0.01) * 100) / 100,
  );

  function reset(index: number) {
    const next = SCENARIOS[index];
    setWhich(index);
    setDay(0);
    setStop(next.entry - next.risk);
    setMovedAway(false);
    setClosed(null);
  }

  function moveStop(value: number) {
    if (!open) return;
    const next = Math.min(value, maxStop);
    setStop(next);
    if (next < startingStop - 1e-9) setMovedAway(true);
  }

  function advance(steps: number) {
    if (!open) return;
    let d = day;
    let out: Outcome | null = null;
    for (let n = 0; n < steps && out === null && d < POST; n += 1) {
      d += 1;
      const bar = scen.bars[scen.entryIndex + d];
      if (bar.l <= stop) {
        out = { day: d, price: stop, reason: "stop" };
      } else if (d === POST) {
        out = { day: d, price: bar.c, reason: "end" };
      }
    }
    setDay(d);
    setClosed(out);
  }

  /* ------------------------------- the chart ------------------------------ */

  const lines: PriceLine[] = [
    {
      price: scen.entry,
      label: `bought ${money2(scen.entry)}`,
      tone: "plain",
      dashed: false,
    },
    { price: stop, label: `your stop ${money2(stop)}`, tone: "sell" },
  ];
  if (Math.abs(stop - startingStop) > 1e-9) {
    lines.push({
      price: startingStop,
      label: `where you first put it ${money2(startingStop)}`,
      tone: "muted",
    });
  }

  const markers: Marker[] = [
    {
      index: scen.entryIndex,
      price: scen.entry,
      side: "buy",
      label: `Bought at ${money2(scen.entry)}`,
    },
  ];
  if (closed) {
    markers.push({
      index: scen.entryIndex + closed.day,
      price: closed.price,
      side: "sell",
      label: `Out at ${money2(closed.price)}`,
    });
  }

  const chartLabel =
    `Made-up practice prices. You bought at ${money2(scen.entry)} and ` +
    `${day === 0 ? "no days have played out yet" : `${day} of ${POST} days have played out`}. ` +
    `Your stop is at ${money2(stop)}. ` +
    (closed
      ? closed.reason === "stop"
        ? `You were stopped out on day ${closed.day}, finishing at ${showR(inR(closed.price))}.`
        : `You closed at the end of the stretch at ${money2(closed.price)}, which is ${showR(inR(closed.price))}.`
      : "The days after this one are faded out, because they have not happened yet.");

  /* ------------------------------ what to say ----------------------------- */

  const afterExit = closed
    ? scen.bars.slice(scen.entryIndex + closed.day + 1, scen.entryIndex + POST + 1)
    : [];
  const wentOnTo = afterExit.length > 0 ? Math.max(...afterExit.map((b) => b.h)) : null;
  const finishedAt = scen.bars[scen.entryIndex + POST].c;

  const yourR = closed ? inR(closed.price) : inR(lastClose);
  const disciplinedR = inR(disciplined.price);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        Move the stop
      </h2>
      <p className="mt-1 text-sm text-muted">
        You bought at {money2(scen.entry)} and put a stop {money2(scen.risk)} below, at{" "}
        {money2(startingStop)}. That was the plan: {money0(RISK_BUDGET)} at stake across{" "}
        {scen.size} shares, and it is what one R means for this trade.
      </p>
      <p className="mt-2 text-sm text-muted">
        Now play the days out one at a time. You can move the stop whenever you like,
        and nothing here will stop you. Watch what it costs.
      </p>

      {/* -------------------------------- chart ------------------------------ */}
      <div className="mt-5">
        <CandleChart
          bars={scen.bars}
          dates={scen.dates}
          height={300}
          lines={lines}
          markers={markers}
          /* While the trade is live the future is hidden, because that is the
             position you actually decide from. The moment it closes the rest is
             revealed, because what price did next is the whole lesson. */
          hideFrom={closed ? scen.bars.length : scen.entryIndex + day + 1}
          shadeBetween={{ from: scen.entry, to: stop, tone: "sell" }}
          ariaLabel={chartLabel}
        />
      </div>

      {/* ------------------------------ the clock ---------------------------- */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {closed
            ? `Closed on day ${closed.day} of ${POST}`
            : `Day ${day} of ${POST} · still open`}
        </p>
        <p className="tabular font-mono text-sm">
          {closed ? "finished at " : "worth "}
          <span className={yourR >= 0 ? "text-buy" : "text-sell"}>
            {showR(yourR)}
          </span>
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => advance(1)}
          disabled={!open}
          className="flex-1 rounded-xl bg-accent px-5 py-3 font-medium text-bg disabled:opacity-40"
        >
          Play the next day
        </button>
        <button
          type="button"
          onClick={() => advance(POST)}
          disabled={!open}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-accent hover:text-fg disabled:opacity-40"
        >
          Play the rest
        </button>
      </div>

      {/* ------------------------------- the stop ---------------------------- */}
      <div className="mt-5">
        <label htmlFor={stopId} className="flex items-baseline justify-between text-sm">
          <span className="text-muted">Where your stop sits</span>
          <span className="tabular font-mono text-fg">{money2(stop)}</span>
        </label>
        <input
          id={stopId}
          type="range"
          min={Number((scen.entry - scen.risk * 3).toFixed(2))}
          max={maxStop}
          step={0.01}
          value={Math.min(stop, maxStop)}
          onChange={(e) => moveStop(Number(e.target.value))}
          disabled={!open}
          className="mt-2 h-7 w-full cursor-pointer disabled:opacity-40"
        />
        <p className="mt-1 text-xs text-muted">
          Left gives the trade more room and costs you more when you are wrong. Right
          moves it toward profit. It will not go above the latest price, because a stop
          up there would simply sell you out at once.
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => moveStop(startingStop)}
            disabled={!open || Math.abs(stop - startingStop) < 1e-9}
            className="rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent hover:text-fg disabled:opacity-40"
          >
            Back to where you planned it
          </button>
          <button
            type="button"
            onClick={() => moveStop(scen.entry)}
            disabled={!open || lastClose <= scen.entry || stop >= scen.entry}
            className="rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent hover:text-fg disabled:opacity-40"
          >
            Move it up to breakeven
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Breakeven only becomes available once the trade is actually in profit. It is
          the one move that is always allowed, because it goes toward profit and never
          away.
        </p>
      </div>

      {/* ------------------------------ live stakes -------------------------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Planned loss" value={money0(RISK_BUDGET)} />
        <Stat
          label="Most it can cost now"
          value={worstCase <= 0 ? "nothing" : money0(worstCase)}
          tone={worstCase > RISK_BUDGET + 1e-9 ? "sell" : "buy"}
        />
        <Stat
          label="Which is"
          value={
            worstCase <= 0 ? "a free trade" : `${worstR.toFixed(1)}× the plan`
          }
          tone={worstR > 1 + 1e-9 ? "sell" : undefined}
        />
        <Stat label="Shares" value={scen.size.toLocaleString("en-US")} />
      </div>

      {movedAway && open && (
        <div className="mt-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          You have given the trade more room. The {money0(RISK_BUDGET)} you agreed to
          lose is now a possible {money0(worstCase)} — {worstR.toFixed(1)} times the risk
          you signed up for. Nothing about the trade improved when you did that. Only
          the size of the loss changed.
        </div>
      )}

      {/* -------------------------------- result ----------------------------- */}
      {closed && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            How it went
          </p>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
              <p className="text-xs text-muted">What you did</p>
              <p
                className={`tabular font-display text-2xl font-bold ${
                  yourR >= 0 ? "text-buy" : "text-sell"
                }`}
              >
                {showR(yourR)}
              </p>
              <p className="tabular mt-0.5 font-mono text-xs text-muted">
                {money0((closed.price - scen.entry) * scen.size)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
              <p className="text-xs text-muted">Leaving the stop alone</p>
              <p
                className={`tabular font-display text-2xl font-bold ${
                  disciplinedR >= 0 ? "text-buy" : "text-sell"
                }`}
              >
                {showR(disciplinedR)}
              </p>
              <p className="tabular mt-0.5 font-mono text-xs text-muted">
                {money0((disciplined.price - scen.entry) * scen.size)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm">
            {closed.reason === "stop"
              ? `Your stop was reached on day ${closed.day} at ${money2(closed.price)}.`
              : `You were still holding at the end of the stretch, at ${money2(closed.price)}.`}{" "}
            {wentOnTo !== null &&
              `Afterwards price got as high as ${money2(wentOnTo)}. `}
            It finished the stretch at {money2(finishedAt)}.
          </p>

          <p className="mt-2 text-sm text-muted">
            {movedAway
              ? yourR > disciplinedR
                ? "Giving it room paid this time. Read that sentence again, because it is exactly why the habit is so hard to break — and the next stretch is the same decision with a different ending."
                : "Giving it room cost you more than the plan allowed. The loss you agreed to was one R; this was not."
              : yourR > disciplinedR
                ? "You moved the stop toward profit and kept more of the trade. That is the direction it is allowed to move."
                : "You left the stop where you planned it. Whatever the number says, that was the trade you decided to take."}
          </p>
        </div>
      )}

      {/* ------------------------------ start again -------------------------- */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset(which)}
          className="rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:border-accent hover:text-fg"
        >
          Run this stretch again
        </button>
        <button
          type="button"
          onClick={() => reset((which + 1) % SCENARIOS.length)}
          className="rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:border-accent hover:text-fg"
        >
          Try a different stretch
        </button>
        <span className="self-center font-mono text-xs uppercase tracking-widest text-muted">
          {scen.label} of {SCENARIOS.length}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          Play all three stretches and widen the stop every time. One of them rewards it
          handsomely. One of them keeps falling and takes several times the loss you
          agreed to. One never threatens the stop at all. On the day you have to decide
          they look the same, because they are the same picture: a trade going against
          you and no way of knowing which kind it is.
        </p>
        <p className="mt-2 text-muted">
          That is the argument. Not that widening never works, but that it works often
          enough to become a habit, and the times it does not are the ones that end
          accounts. A stop that only ever moves toward profit costs you some good trades
          and keeps you in the game. Moving it the other way does the opposite of both.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        These are made-up prices for practice, not a real market, and they are the same
        every time you come back. Fills are assumed to happen exactly at your stop,
        which real markets do not promise.
      </p>
    </section>
  );
}
