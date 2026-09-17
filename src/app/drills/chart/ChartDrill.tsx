"use client";

import { useMemo, useState } from "react";
import { Callout, GradePill, Stat } from "@/components/ui";
import { DATA_NOTICE, REGIMES } from "@/data/index";
import { letterFor, MAX_RISK_PCT, MIN_RR } from "@/lib/grade";
import { plannedRR, positionSize, realisedR, riskPerUnit } from "@/lib/trade";
import type { Direction } from "@/lib/trade";

/* ------------------------------- the rounds ------------------------------- */

const VISIBLE = 70;
const HIDDEN = 60;
/** How far back "the recent low" looks. */
const SWING_LOOKBACK = 10;
const STARTS = [30, 140, 250, 360];

interface Round {
  key: string;
  label: string;
  visible: number[];
  hidden: number[];
  firstDate: string;
  lastDate: string;
  endDate: string;
}

/**
 * Every slice is fixed at build time. Picking one at random while rendering
 * would give the trader a different chart from the one the page was built with.
 */
const ROUNDS: Round[] = STARTS.flatMap((start) =>
  REGIMES.map((regime) => ({
    key: `${regime.id}-${start}`,
    label: regime.label,
    visible: regime.close.slice(start, start + VISIBLE),
    hidden: regime.close.slice(start + VISIBLE, start + VISIBLE + HIDDEN),
    firstDate: regime.dates[start],
    lastDate: regime.dates[start + VISIBLE - 1],
    endDate: regime.dates[start + VISIBLE + HIDDEN - 1],
  })),
);

/* ------------------------------- chart maths ------------------------------ */

const W = 900;
const H = 340;
const PAD = { top: 16, right: 74, bottom: 26, left: 10 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;
/** Empty slots after the last visible bar, so the level lines have room. */
const GUTTER = 6;

const money = (n: number) => n.toFixed(2);
const parse = (raw: string) => {
  const value = Number(raw.trim());
  return raw.trim() === "" || !Number.isFinite(value) ? null : value;
};

type Level = "entry" | "stop" | "target";

interface Outcome {
  /** Bars after the last visible one. */
  index: number;
  price: number;
  r: number;
  what: "stop" | "target" | "open";
}

/**
 * Step through the hidden bars and report whichever level the price reached
 * first. This series carries one price per bar, so a level counts as reached
 * when a bar closes past it.
 */
function walkForward(
  hidden: number[],
  direction: Direction,
  entry: number,
  stop: number,
  target: number,
  rr: number,
): Outcome {
  for (let i = 0; i < hidden.length; i++) {
    const price = hidden[i];
    if (direction === "long" ? price <= stop : price >= stop) {
      return { index: i, price: stop, r: -1, what: "stop" };
    }
    if (direction === "long" ? price >= target : price <= target) {
      return { index: i, price: target, r: rr, what: "target" };
    }
  }
  const lastPrice = hidden[hidden.length - 1];
  return {
    index: hidden.length - 1,
    price: lastPrice,
    r: realisedR({ entry, exit: lastPrice, stop, size: 1, direction }),
    what: "open",
  };
}

const LEVEL_COLOR: Record<Level, string> = {
  entry: "var(--muted)",
  stop: "var(--sell)",
  target: "var(--buy)",
};

export default function ChartDrill() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("long");
  const [entryText, setEntryText] = useState(() =>
    money(ROUNDS[0].visible[VISIBLE - 1]),
  );
  const [stopText, setStopText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [accountText, setAccountText] = useState("10000");
  const [arm, setArm] = useState<Level>("stop");
  const [graded, setGraded] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const round = ROUNDS[roundIndex];

  const stats = useMemo(() => {
    const { visible } = round;
    const last = visible[visible.length - 1];
    const recent = visible.slice(-SWING_LOOKBACK);
    const swingLow = Math.min(...recent);
    const swingHigh = Math.max(...recent);
    let moved = 0;
    for (let i = 1; i < visible.length; i++) {
      moved += Math.abs(visible[i] - visible[i - 1]);
    }
    const avgMove = moved / (visible.length - 1);
    return { last, swingLow, swingHigh, avgMove };
  }, [round]);

  const entry = parse(entryText);
  const stop = parse(stopText);
  const target = parse(targetText);
  const account = parse(accountText);

  /* ------------------------------ the markup ------------------------------ */

  const markup = useMemo(() => {
    if (entry === null || stop === null || target === null) return null;
    const rightWayRound =
      direction === "long"
        ? stop < entry && target > entry
        : stop > entry && target < entry;
    if (!rightWayRound) return null;

    const perUnit = riskPerUnit({ entry, stop });
    if (!Number.isFinite(perUnit)) return null;

    const rr = plannedRR({ entry, stop, target });
    const size =
      account === null || account <= 0
        ? null
        : Math.max(0, Math.floor(positionSize(account, MAX_RISK_PCT, entry, stop)));

    return { perUnit, rr, size, dollarsAtRisk: size === null ? null : size * perUnit };
  }, [entry, stop, target, direction, account]);

  const checks = useMemo(() => {
    if (markup === null || entry === null || stop === null || target === null) {
      return null;
    }
    const beyondSwing =
      direction === "long" ? stop < stats.swingLow : stop > stats.swingHigh;
    const swingPrice = direction === "long" ? stats.swingLow : stats.swingHigh;

    return [
      {
        id: "rr",
        weight: 0.4,
        label: `Reward is at least ${MIN_RR} to 1`,
        passed: markup.rr >= MIN_RR,
        detail: `Your target is ${markup.rr.toFixed(2)} to 1. You are risking ${money(
          markup.perUnit,
        )} a share to make ${money(Math.abs(target - entry))}.`,
        advice: `Move the target further out, or find a place where the stop can sit closer. At less than ${MIN_RR} to 1 you have to be right too often for the trade to pay.`,
      },
      {
        id: "swing",
        weight: 0.35,
        label:
          direction === "long"
            ? "Stop sits below the recent low"
            : "Stop sits above the recent high",
        passed: beyondSwing,
        detail: `The ${direction === "long" ? "lowest" : "highest"} price in the last ${SWING_LOOKBACK} bars is ${money(
          swingPrice,
        )}. Your stop is at ${money(stop)}.`,
        advice:
          direction === "long"
            ? `A stop above ${money(swingPrice)} sits inside the range price has just been trading in, so ordinary movement is enough to take you out. Put it below that low, where being hit means the idea was wrong.`
            : `A stop below ${money(swingPrice)} sits inside the range price has just been trading in, so ordinary movement is enough to take you out. Put it above that high, where being hit means the idea was wrong.`,
      },
      {
        id: "noise",
        weight: 0.25,
        label: "Stop is further away than an ordinary move",
        passed: markup.perUnit >= stats.avgMove,
        detail: `This chart moves about ${money(stats.avgMove)} a bar. Your stop is ${money(
          markup.perUnit,
        )} away, which is ${(markup.perUnit / stats.avgMove).toFixed(1)} of an ordinary move.`,
        advice: `A stop tighter than a single ordinary move gets taken out by noise rather than by being wrong. Widen it and take fewer shares — the money at risk stays the same.`,
      },
    ];
  }, [markup, entry, stop, target, direction, stats]);

  const score =
    checks === null
      ? 0
      : checks.reduce((total, c) => total + (c.passed ? c.weight : 0), 0);

  /* -------------------------------- reveal -------------------------------- */

  const outcome =
    revealed && markup !== null && entry !== null && stop !== null && target !== null
      ? walkForward(round.hidden, direction, entry, stop, target, markup.rr)
      : null;

  /* ------------------------------- geometry ------------------------------- */

  /**
   * Before the reveal the visible bars fill the chart; revealing zooms out to
   * make room for what followed. Both axes rescale at that moment, which is why
   * the reveal reads as a change of view rather than as part of the markup.
   */
  const geom = useMemo(() => {
    const values = [...round.visible];
    if (revealed) values.push(...round.hidden);
    for (const level of [entry, stop, target]) {
      if (level !== null) values.push(level);
    }
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const yMin = lo - span * 0.07;
    const yMax = hi + span * 0.07;
    const slots = VISIBLE + (revealed ? HIDDEN : GUTTER);
    const x = (i: number) => PAD.left + (i / (slots - 1)) * INNER_W;
    const barW = Math.max(2, (INNER_W / slots) * 0.62);
    const y = (v: number) => PAD.top + INNER_H - ((v - yMin) / (yMax - yMin)) * INNER_H;
    const priceAt = (yView: number) => {
      const clamped = Math.min(PAD.top + INNER_H, Math.max(PAD.top, yView));
      return yMin + ((PAD.top + INNER_H - clamped) / INNER_H) * (yMax - yMin);
    };
    return { x, y, barW, priceAt };
  }, [round, revealed, entry, stop, target]);

  function bars(series: number[], offset: number, dimmed: boolean) {
    return series.map((close, i) => {
      const prev = i === 0 ? (offset === 0 ? close : round.visible[VISIBLE - 1]) : series[i - 1];
      const top = geom.y(Math.max(prev, close));
      const bottom = geom.y(Math.min(prev, close));
      return (
        <rect
          key={i}
          x={geom.x(offset + i) - geom.barW / 2}
          y={top}
          width={geom.barW}
          height={Math.max(1.5, bottom - top)}
          fill={close >= prev ? "var(--buy)" : "var(--sell)"}
          opacity={dimmed ? 0.55 : 0.9}
        />
      );
    });
  }

  /* -------------------------------- actions ------------------------------- */

  function setLevel(level: Level, value: number) {
    const text = money(value);
    if (level === "entry") setEntryText(text);
    else if (level === "stop") setStopText(text);
    else setTargetText(text);
  }

  function handleChartClick(event: React.MouseEvent<SVGSVGElement>) {
    if (revealed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.height === 0) return;
    setLevel(arm, geom.priceAt(((event.clientY - rect.top) / rect.height) * H));
  }

  function nextChart() {
    const next = (roundIndex + 1) % ROUNDS.length;
    setRoundIndex(next);
    setDirection("long");
    setEntryText(money(ROUNDS[next].visible[VISIBLE - 1]));
    setStopText("");
    setTargetText("");
    setArm("stop");
    setGraded(false);
    setRevealed(false);
  }

  const levelLabel = [
    entry === null ? "" : `Entry marked at ${money(entry)}.`,
    stop === null ? "" : `Stop marked at ${money(stop)}.`,
    target === null ? "" : `Target marked at ${money(target)}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const chartLabel = revealed
    ? `Practice price chart, ${round.label}, with the ${HIDDEN} bars that came next now shown. ${levelLabel}`
    : `Practice price chart, ${round.label}. ${VISIBLE} bars are shown, running from ${money(
        Math.min(...round.visible),
      )} to ${money(Math.max(...round.visible))}. The ${HIDDEN} bars that came next are hidden. ${levelLabel}`;

  return (
    <>
      {/* ------------------------------ chart ------------------------------ */}
      <figure className="m-0 overflow-hidden rounded-xl border border-border bg-surface">
        <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-xs">
          <span className="text-muted">
            Practice chart {roundIndex + 1} of {ROUNDS.length} &middot; {round.label}
          </span>
          <span className="tabular font-mono text-muted">
            {round.firstDate} to {revealed ? round.endDate : round.lastDate}
          </span>
        </figcaption>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={chartLabel}
          onClick={handleChartClick}
          style={{ display: "block", height: "auto", cursor: revealed ? "default" : "crosshair" }}
        >
          {bars(round.visible, 0, false)}

          {revealed ? (
            bars(round.hidden, VISIBLE, true)
          ) : (
            <>
              <rect
                x={geom.x(VISIBLE) - geom.barW}
                y={PAD.top}
                width={W - PAD.right - geom.x(VISIBLE) + geom.barW}
                height={INNER_H}
                fill="var(--surface-2)"
                opacity="0.9"
              />
              <text
                x={geom.x(VISIBLE) - geom.barW - 6}
                y={PAD.top + 12}
                fill="var(--muted)"
                fontSize="12"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                the rest is hidden
              </text>
            </>
          )}

          {/* the line the trader is planning from */}
          <line
            x1={geom.x(VISIBLE - 1)}
            x2={geom.x(VISIBLE - 1)}
            y1={PAD.top}
            y2={PAD.top + INNER_H}
            stroke="var(--border)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {(["entry", "stop", "target"] as Level[]).map((level) => {
            const value =
              level === "entry" ? entry : level === "stop" ? stop : target;
            if (value === null) return null;
            const y = geom.y(value);
            return (
              <g key={level}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke={LEVEL_COLOR[level]}
                  strokeWidth="1.5"
                  strokeDasharray={level === "entry" ? "none" : "6 4"}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={W - PAD.right + 6}
                  y={y + 5}
                  fill={LEVEL_COLOR[level]}
                  fontSize="14"
                  fontFamily="var(--font-mono)"
                >
                  {money(value)}
                </text>
              </g>
            );
          })}

          {outcome && (
            <>
              <line
                x1={geom.x(VISIBLE + outcome.index)}
                x2={geom.x(VISIBLE + outcome.index)}
                y1={PAD.top}
                y2={PAD.top + INNER_H}
                stroke="var(--fg)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={geom.x(VISIBLE + outcome.index)}
                cy={geom.y(outcome.price)}
                r="5"
                fill="none"
                stroke="var(--fg)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}

          <text
            x={PAD.left}
            y={H - 7}
            fill="var(--muted)"
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            {round.firstDate}
          </text>
          <text
            x={geom.x(VISIBLE - 1)}
            y={H - 7}
            fill="var(--muted)"
            fontSize="12"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            {round.lastDate}
          </text>
          {revealed && (
            <text
              x={W - PAD.right}
              y={H - 7}
              fill="var(--muted)"
              fontSize="12"
              fontFamily="var(--font-mono)"
              textAnchor="end"
            >
              {round.endDate}
            </text>
          )}
        </svg>
      </figure>

      <p className="mt-2 text-xs text-muted">{DATA_NOTICE}</p>

      {/* ----------------------------- the markup ---------------------------- */}
      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="markup-heading">
        <h2 id="markup-heading" className="font-display text-lg font-semibold">
          Mark up the chart
        </h2>
        <p className="mt-1 text-sm text-muted">
          Decide which way you would take it, where you would be wrong, and where
          you would take profit. Type the prices in, or pick a level below and
          click the chart to place it.
        </p>

        <fieldset className="mt-4" disabled={revealed}>
          <legend className="font-mono text-xs uppercase tracking-widest text-muted">
            Direction
          </legend>
          <div
            role="radiogroup"
            aria-label="Direction"
            className="mt-2 grid gap-2 sm:grid-cols-2"
          >
            {(["long", "short"] as Direction[]).map((d) => {
              const active = direction === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setDirection(d);
                    setGraded(false);
                  }}
                  className={`rounded-xl border p-2.5 font-display text-sm font-semibold transition-colors ${
                    active
                      ? d === "long"
                        ? "border-buy bg-buy/10 text-buy"
                        : "border-sell bg-sell/10 text-sell"
                      : "border-border text-muted hover:border-accent hover:text-fg"
                  }`}
                >
                  {d === "long" ? "Long — buy, expecting a rise" : "Short — sell, expecting a fall"}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {(
            [
              ["entry", "Entry", entryText, setEntryText],
              ["stop", "Stop", stopText, setStopText],
              ["target", "Target", targetText, setTargetText],
            ] as [Level, string, string, (v: string) => void][]
          ).map(([level, label, value, setter]) => (
            <label key={level} className="block text-sm">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-0.5 w-4"
                  style={{ background: LEVEL_COLOR[level] }}
                />
                <span className="text-muted">{label}</span>
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={value}
                disabled={revealed}
                onChange={(e) => {
                  setter(e.target.value);
                  setGraded(false);
                }}
                onFocus={() => setArm(level)}
                className="tabular mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono disabled:opacity-60"
                placeholder="0.00"
              />
            </label>
          ))}
        </div>

        <fieldset className="mt-4" disabled={revealed}>
          <legend className="font-mono text-xs uppercase tracking-widest text-muted">
            Clicking the chart sets
          </legend>
          <div role="radiogroup" aria-label="Level set by clicking the chart" className="mt-2 flex flex-wrap gap-1.5">
            {(["entry", "stop", "target"] as Level[]).map((level) => {
              const active = arm === level;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setArm(level)}
                  className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-muted hover:text-fg"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-5 block max-w-xs text-sm">
          <span className="text-muted">Your account size ($)</span>
          <input
            type="number"
            step="100"
            min="0"
            inputMode="decimal"
            value={accountText}
            onChange={(e) => setAccountText(e.target.value)}
            className="tabular mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono"
          />
          <span className="mt-1.5 block text-xs text-muted">
            Risking {MAX_RISK_PCT}% of it, which is the most this site will call
            sensible on one trade.
          </span>
        </label>

        {markup === null ? (
          <Callout tone="warn">
            Fill in all three prices, the right way round. On a long the stop goes
            below your entry and the target above it; on a short it is the other
            way about.
          </Callout>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Risk per share" value={`$${money(markup.perUnit)}`} />
            <Stat
              label="Reward : risk"
              value={`${markup.rr.toFixed(2)} : 1`}
              tone={markup.rr >= MIN_RR ? "buy" : "sell"}
            />
            <Stat
              label="Shares the 1% rule allows"
              value={markup.size === null ? "—" : markup.size.toLocaleString("en-US")}
            />
            <Stat
              label="Money at risk"
              value={
                markup.dollarsAtRisk === null ? "—" : `$${money(markup.dollarsAtRisk)}`
              }
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={markup === null || revealed}
            onClick={() => setGraded(true)}
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Grade my markup
          </button>
          <button
            type="button"
            disabled={!graded || revealed}
            onClick={() => setRevealed(true)}
            className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg"
          >
            Reveal what happened next
          </button>
          <button
            type="button"
            onClick={nextChart}
            className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Another chart
          </button>
        </div>
      </section>

      {/* ------------------------------ the grade ---------------------------- */}
      {graded && checks !== null && (
        <section className="mt-6" aria-labelledby="grade-heading">
          <div className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
            <GradePill letter={letterFor(score)} size="lg" />
            <div>
              <h2 id="grade-heading" className="font-display text-xl font-semibold">
                {checks.filter((c) => c.passed).length} of {checks.length} habits in
                place
              </h2>
              <p className="mt-1 text-sm text-muted">
                This grades the markup only. Nothing here knows what the price did
                next, and nothing here should.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {checks.map((check) => (
              <li
                key={check.id}
                className={`rounded-xl border p-4 text-sm ${
                  check.passed ? "border-buy/40 bg-buy/5" : "border-sell/40 bg-sell/5"
                }`}
              >
                <p
                  className={`font-display font-semibold ${
                    check.passed ? "text-buy" : "text-sell"
                  }`}
                >
                  {check.passed ? "Yes" : "No"} &mdash; {check.label}
                </p>
                <p className="mt-1.5 text-muted">{check.detail}</p>
                {!check.passed && <p className="mt-1.5">{check.advice}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ----------------------------- the reveal ---------------------------- */}
      {revealed && outcome !== null && (
        <section className="mt-6" aria-labelledby="reveal-heading">
          <div className="card p-5 sm:p-6">
            <h2 id="reveal-heading" className="font-display text-xl font-semibold">
              What this particular chart did next
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat
                label="Result"
                value={`${outcome.r >= 0 ? "+" : "−"}${Math.abs(outcome.r).toFixed(2)}R`}
                tone={outcome.r >= 0 ? "buy" : "sell"}
              />
              <Stat
                label="Finished at"
                value={`$${money(outcome.price)}`}
              />
              <Stat
                label="Bars later"
                value={String(outcome.index + 1)}
              />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              {outcome.what === "stop"
                ? `Price reached your stop at $${money(outcome.price)} before it reached your target. That is a full loss of one R, which on a $${accountText || "0"} account is the ${MAX_RISK_PCT}% you agreed to risk.`
                : outcome.what === "target"
                  ? `Price reached your target at $${money(outcome.price)} before it reached your stop, so the trade paid ${markup === null ? "" : markup.rr.toFixed(2)} times what it risked.`
                  : `Price reached neither level in the ${HIDDEN} bars that followed. Measured at the last bar, the trade stood at ${outcome.r >= 0 ? "+" : "−"}${Math.abs(outcome.r).toFixed(2)}R. A trade that goes nowhere still ties up money and attention.`}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              This practice series records one price per bar, so a level counts as
              reached when a bar closes past it.
            </p>

            <Callout tone="warn">
              A good markup can still lose, and a careless one can still win. What
              you just saw is what this one series happened to do next, not a
              verdict on your plan. The grade above is the part you control.
            </Callout>

            <button
              type="button"
              onClick={nextChart}
              className="mt-2 rounded-xl bg-accent px-5 py-2.5 font-medium text-bg"
            >
              Another chart
            </button>
          </div>
        </section>
      )}
    </>
  );
}
