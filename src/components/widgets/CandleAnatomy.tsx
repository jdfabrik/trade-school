"use client";

import { useId, useMemo, useState } from "react";
import CandleChart from "@/components/CandleChart";
import { REGIMES, type Bar } from "@/data/index";

/**
 * "Read one candle" — the first thing a beginner has to be able to do.
 *
 * Almost every chart a trader looks at is drawn this way, and almost every new
 * trader nods at the explanation without ever slowing down enough to read a
 * single one. So this widget makes them pick one and look at it: the strip up
 * top is a real stretch of the practice data, and whichever candle is chosen
 * gets drawn large, with its four numbers labelled and a sentence saying what
 * that shape means happened.
 *
 * The buttons are the part that does the teaching. Left to click at random, a
 * learner mostly finds ordinary candles; asking for "a long wick on top" takes
 * them straight to the most extreme one in the stretch, which is where the
 * shape is unmistakable.
 *
 * The closing-price toggle is the quiet argument for candles in the first
 * place: the same days as a single line look calm and orderly, and all the
 * fighting disappears.
 */

/* ---------------------------------- data ---------------------------------- */

const REGIME = REGIMES.find((r) => r.id === "choppy") ?? REGIMES[0];
const FROM = 246;
const COUNT = 44;
const BARS: Bar[] = REGIME.bars.slice(FROM, FROM + COUNT);
const DATES: string[] = REGIME.dates.slice(FROM, FROM + COUNT);

interface Shape {
  /** Each one is a fraction of the candle's whole top-to-bottom height. */
  body: number;
  upper: number;
  lower: number;
  range: number;
  up: boolean;
}

function shapeOf(b: Bar): Shape {
  const range = b.h - b.l;
  const safe = range || 1e-9;
  return {
    range,
    body: Math.abs(b.c - b.o) / safe,
    upper: (b.h - Math.max(b.o, b.c)) / safe,
    lower: (Math.min(b.o, b.c) - b.l) / safe,
    up: b.c >= b.o,
  };
}

type Kind = "upper" | "lower" | "small" | "hardUp" | "hardDown" | "ordinary";

/**
 * Which of the shapes worth naming this candle is.
 *
 * The buttons and the written reading both go through here, so the candle a
 * button promises is always the candle the words then describe. A long wick
 * only counts when the other end is short: a candle with both is indecision,
 * not rejection, and calling it a rejection would teach the wrong thing.
 */
function classify(s: Shape): Kind {
  if (s.upper >= 0.45 && s.lower < 0.3) return "upper";
  if (s.lower >= 0.45 && s.upper < 0.3) return "lower";
  if (s.body <= 0.15) return "small";
  if (s.body >= 0.6) return s.up ? "hardUp" : "hardDown";
  return "ordinary";
}

const AVERAGE_RANGE =
  BARS.reduce((sum, b) => sum + (b.h - b.l), 0) / Math.max(BARS.length, 1);

/**
 * The clearest example of one shape in this stretch, so a button always lands
 * on something worth looking at. Size counts for something — a tall candle is
 * easier to read — but never enough to outrank the shape being asked for.
 */
function pick(kind: Kind, metric: (s: Shape) => number): number {
  let bestIndex = 0;
  let best = -Infinity;
  let found = false;
  BARS.forEach((b, i) => {
    const s = shapeOf(b);
    if (classify(s) !== kind) return;
    const v = metric(s) * 40 + Math.min(s.range / AVERAGE_RANGE, 2) * 10;
    if (v > best) {
      best = v;
      bestIndex = i;
      found = true;
    }
  });
  if (found) return bestIndex;

  /* Nothing of that shape here, so fall back to the nearest thing to it. */
  BARS.forEach((b, i) => {
    const v = metric(shapeOf(b));
    if (v > best) {
      best = v;
      bestIndex = i;
    }
  });
  return bestIndex;
}

const EXAMPLES = [
  {
    key: "upper",
    label: "A long wick on top",
    index: pick("upper", (s) => s.upper),
  },
  {
    key: "lower",
    label: "A long wick underneath",
    index: pick("lower", (s) => s.lower),
  },
  {
    key: "small",
    label: "Almost no body",
    index: pick("small", (s) => 1 - s.body),
  },
  {
    key: "up",
    label: "A hard close upward",
    index: pick("hardUp", (s) => s.body),
  },
  {
    key: "down",
    label: "A hard close downward",
    index: pick("hardDown", (s) => s.body),
  },
] as const;

const money = (n: number) => `$${n.toFixed(2)}`;

/** What this shape is actually telling you, in words rather than in jargon. */
function reading(b: Bar): { name: string; text: string } {
  const s = shapeOf(b);
  const kind = classify(s);
  const dir = s.up ? "up" : "down";
  const move = money(Math.abs(b.c - b.o));

  if (kind === "small") {
    return {
      name: "Opened and closed at nearly the same price",
      text:
        `Price travelled ${money(s.range)} between its high and its low and finished ` +
        `within ${move} of where it began. Both sides had a go and neither got anywhere. ` +
        `A candle like this is the market telling you it has not decided.`,
    };
  }
  if (kind === "upper") {
    return {
      name: "A long wick on top",
      text:
        `Price was pushed all the way up to ${money(b.h)} and could not stay there — ` +
        `it finished back down at ${money(b.c)}. Whoever bought near the high spent the ` +
        `rest of the period watching it come back. Highs that get rejected like this are ` +
        `often where the next move down starts.`,
    };
  }
  if (kind === "lower") {
    return {
      name: "A long wick underneath",
      text:
        `Price was sold down to ${money(b.l)} and buyers took the whole move back, ` +
        `closing at ${money(b.c)}. If you had been holding with a stop just under ` +
        `${money(b.l)}, you would have been taken out at the worst moment of the period ` +
        `and then watched it recover without you.`,
    };
  }
  if (kind === "hardUp" || kind === "hardDown") {
    return {
      name: `A hard close ${dir}ward`,
      text:
        `It opened at ${money(b.o)} and closed at ${money(b.c)}, and the body takes up ` +
        `${Math.round(s.body * 100)}% of the whole candle — there is very little left ` +
        `over at either end. One side held it from start to finish. That is a period ` +
        `with a clear winner.`,
    };
  }
  return {
    name: `An ordinary ${dir} period`,
    text:
      `Opened at ${money(b.o)} and closed ${move} ${dir} at ${money(b.c)}, having been ` +
      `as high as ${money(b.h)} and as low as ${money(b.l)} along the way. Most candles ` +
      `look roughly like this one, which is why the unusual ones are worth noticing.`,
  };
}

/* ------------------------------ the big candle ----------------------------- */

const D_W = 340;
const D_H = 268;
const TOP = 34;
const BOT = 214;
const CX = 214;
const BW = 46;

/** Keeps price labels from sitting on top of each other when two prices are close. */
function spread(ys: number[], gap: number): number[] {
  const order = ys
    .map((y, i) => ({ y, i }))
    .sort((a, b) => a.y - b.y);
  let prev = -Infinity;
  for (const o of order) {
    o.y = Math.max(o.y, prev + gap);
    prev = o.y;
  }
  const out = ys.slice();
  for (const o of order) out[o.i] = o.y;
  return out;
}

function BigCandle({ bar, date }: { bar: Bar; date?: string }) {
  const span = bar.h - bar.l || 1;
  const y = (v: number) => TOP + ((bar.h - v) / span) * (BOT - TOP);
  const up = bar.c >= bar.o;
  const colour = up ? "var(--buy)" : "var(--sell)";

  const bodyTop = y(Math.max(bar.o, bar.c));
  const bodyBottom = y(Math.min(bar.o, bar.c));
  const bodyH = Math.max(3, bodyBottom - bodyTop);

  const rows = [
    { key: "high", label: "High", value: bar.h },
    { key: "open", label: "Open", value: bar.o },
    { key: "close", label: "Close", value: bar.c },
    { key: "low", label: "Low", value: bar.l },
  ];
  const labelY = spread(rows.map((r) => y(r.value)), 17);

  const upperH = bodyTop - y(bar.h);
  const lowerH = y(bar.l) - bodyBottom;

  const bracket = (top: number, height: number, text: string, key: string) =>
    height < 13 ? null : (
      <g key={key}>
        <path
          d={`M${CX + BW / 2 + 10} ${top} h6 v${height} h-6`}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={CX + BW / 2 + 21}
          y={top + height / 2 + 4}
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-mono)"
        >
          {text}
        </text>
      </g>
    );

  return (
    <svg
      viewBox={`0 0 ${D_W} ${D_H}`}
      width="100%"
      role="img"
      aria-label={
        `One candle${date ? ` from ${date}` : ""}. It opened at ${money(bar.o)}, ` +
        `reached ${money(bar.h)} at its highest and ${money(bar.l)} at its lowest, ` +
        `and closed at ${money(bar.c)}.`
      }
      style={{ display: "block", height: "auto" }}
    >
      {/* leader lines and the four prices */}
      {rows.map((r, i) => (
        <g key={r.key}>
          <line
            x1={158}
            x2={CX - BW / 2 - 4}
            y1={y(r.value)}
            y2={y(r.value)}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={152}
            y={labelY[i] + 4}
            textAnchor="end"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill="var(--muted)"
          >
            <tspan fill="var(--fg)">{r.label}</tspan> {money(r.value)}
          </text>
        </g>
      ))}

      {/* the candle itself */}
      <line
        x1={CX}
        x2={CX}
        y1={y(bar.h)}
        y2={y(bar.l)}
        stroke={colour}
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={CX - BW / 2}
        y={bodyTop}
        width={BW}
        height={bodyH}
        fill={colour}
        rx="2"
      />

      {bracket(bodyTop, bodyH, "body", "body")}
      {bracket(y(bar.h), upperH, "wick", "upper")}
      {bracket(bodyBottom, lowerH, "wick", "lower")}

      <text
        x={CX}
        y={D_H - 10}
        textAnchor="middle"
        fontSize="12"
        fontFamily="var(--font-mono)"
        fill="var(--muted)"
      >
        {up ? "closed higher than it opened" : "closed lower than it opened"}
      </text>
    </svg>
  );
}

/* --------------------------- closing prices only --------------------------- */

const L_W = 900;
const L_H = 240;
const L_PAD = { top: 16, right: 64, bottom: 24, left: 10 };

function CloseOnly({ bars }: { bars: Bar[] }) {
  const closes = bars.map((b) => b.c);
  const lo = Math.min(...closes);
  const hi = Math.max(...closes);
  const span = hi - lo || 1;
  const innerW = L_W - L_PAD.left - L_PAD.right;
  const innerH = L_H - L_PAD.top - L_PAD.bottom;
  const x = (i: number) =>
    L_PAD.left + (i / Math.max(bars.length - 1, 1)) * innerW;
  const y = (v: number) =>
    L_PAD.top + innerH - ((v - (lo - span * 0.08)) / (span * 1.16)) * innerH;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <svg
        viewBox={`0 0 ${L_W} ${L_H}`}
        width="100%"
        role="img"
        aria-label={
          `The same ${bars.length} periods drawn as a single line joining the closing ` +
          `prices. The highs and lows are not shown at all.`
        }
        style={{ display: "block", height: "auto" }}
      >
        <polyline
          points={closes.map((c, i) => `${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={L_W - L_PAD.right + 8}
          y={y(hi) + 4}
          fill="var(--muted)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {hi.toFixed(2)}
        </text>
        <text
          x={L_W - L_PAD.right + 8}
          y={y(lo) + 4}
          fill="var(--muted)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {lo.toFixed(2)}
        </text>
      </svg>
    </div>
  );
}

/* --------------------------------- widget --------------------------------- */

export default function CandleAnatomy() {
  const headingId = useId();
  const sliderId = useId();

  const [index, setIndex] = useState(EXAMPLES[0].index);
  const [closesOnly, setClosesOnly] = useState(false);

  const bar = BARS[index];
  const said = useMemo(() => reading(bar), [bar]);
  const shape = shapeOf(bar);

  const step = (by: number) =>
    setIndex((i) => Math.min(BARS.length - 1, Math.max(0, i + by)));

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        Read one candle
      </h2>
      <p className="mt-1 text-sm text-muted">
        Each candle covers one period of trading and holds four prices: where it
        opened, where it closed, and the highest and lowest it reached in between.
        The thick part is the distance from open to close. The thin lines above and
        below show how far price got and could not stay.
      </p>
      <p className="mt-2 text-sm text-muted">
        Green means it closed higher than it opened; red means it closed lower. Pick
        one below and read it.
      </p>

      {/* ------------------------------- the strip ------------------------- */}
      <div className="mt-5">
        {closesOnly ? (
          <CloseOnly bars={BARS} />
        ) : (
          <CandleChart
            bars={BARS}
            dates={DATES}
            height={250}
            focusIndex={index}
            onFocus={setIndex}
            ariaLabel={
              `${BARS.length} periods of made-up practice prices drawn as candles. ` +
              `Period ${index + 1} is picked out; it opened at ${money(bar.o)} and ` +
              `closed at ${money(bar.c)}.`
            }
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setClosesOnly((v) => !v)}
          aria-pressed={closesOnly}
          className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
            closesOnly
              ? "border-accent bg-accent-soft text-accent"
              : "border-border text-muted hover:border-accent hover:text-fg"
          }`}
        >
          {closesOnly ? "Show the candles again" : "Show closing prices only"}
        </button>
        <span className="text-xs text-muted">
          The same days as one line. Notice how much calmer it looks once the highs
          and lows are thrown away.
        </span>
      </div>

      {!closesOnly && (
        <>
          {/* ------------------------------ choosing ----------------------- */}
          <fieldset className="mt-5">
            <legend className="font-mono text-xs uppercase tracking-widest text-muted">
              Take me to one where
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EXAMPLES.map((e) => {
                const active = index === e.index;
                return (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => setIndex(e.index)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-muted hover:border-accent hover:text-fg"
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Each button jumps to the clearest example of that shape in this stretch,
              so you are not hunting for one.
            </p>
          </fieldset>

          <div className="mt-5">
            <label
              htmlFor={sliderId}
              className="flex items-baseline justify-between text-sm"
            >
              <span className="text-muted">Which candle</span>
              <span className="tabular font-mono text-fg">
                {index + 1} of {BARS.length}
                {DATES[index] ? ` · ${DATES[index]}` : ""}
              </span>
            </label>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={BARS.length - 1}
              step={1}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              className="mt-2 h-7 w-full cursor-pointer"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={index === 0}
                className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent hover:text-fg disabled:opacity-40"
              >
                ← The one before
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={index === BARS.length - 1}
                className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-accent hover:text-fg disabled:opacity-40"
              >
                The next one →
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Move along the stretch one period at a time, or tap any candle on the
              chart above.
            </p>
          </div>

          {/* ------------------------------ the reading -------------------- */}
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-start">
            <div className="rounded-xl border border-border bg-surface-2 p-3">
              <BigCandle bar={bar} date={DATES[index]} />
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                What this one is telling you
              </p>
              <p className="mt-1 font-display text-lg font-semibold">{said.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{said.text}</p>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div className="flex justify-between gap-2 border-b border-border pb-1">
                  <dt className="text-muted">Height</dt>
                  <dd className="tabular font-mono">{money(shape.range)}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-1">
                  <dt className="text-muted">Body</dt>
                  <dd className="tabular font-mono">
                    {Math.round(shape.body * 100)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-1">
                  <dt className="text-muted">Wick above</dt>
                  <dd className="tabular font-mono">
                    {Math.round(shape.upper * 100)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-1">
                  <dt className="text-muted">Wick below</dt>
                  <dd className="tabular font-mono">
                    {Math.round(shape.lower * 100)}%
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted">
                The percentages say how much of the candle each part takes up. A body
                near zero means it finished where it started; a wick near half means
                price spent the period somewhere it could not hold.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="mt-5 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          Ask for a long wick underneath, note the low it reached, then switch to closing
          prices only. The dip and the recovery collapse into a line that barely moves.
          It is the same period. A stop sitting inside that wick would have been taken
          out, and the line would never have shown you why.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        These are made-up prices for practice, not a real market, and they are the
        same every time you come back.
      </p>
    </section>
  );
}
