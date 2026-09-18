"use client";

import { useId, useMemo, useState } from "react";
import { Callout, Stat } from "@/components/ui";
import {
  breakevenWinRate,
  cumulativeR,
  expectancy,
  maxDrawdownR,
  winRate,
} from "@/lib/trade";

/**
 * "Run 100 trades" — what an edge actually feels like while you are living
 * through it.
 *
 * The lesson is not in any single run. It is in pressing the button again with
 * the settings untouched and watching a system that makes money on average hand
 * you a completely different life. So the widget keeps the last few runs on the
 * chart as faint lines: the spread between them is the thing being taught.
 *
 * Nothing random happens while the page is being drawn. The first run comes
 * from a fixed seed, so every visitor sees the same opening curve; later runs
 * take a new seed from the click itself.
 */

/* ---------------------------------- maths --------------------------------- */

interface Settings {
  /** How often the trade goes your way, as a percentage. */
  winPct: number;
  /** Reward to risk: a win pays this many times what a loss costs. */
  rr: number;
  count: number;
}

interface Run {
  seed: number;
  /** Running total in R, starting at zero. One point per trade, plus the start. */
  curve: number[];
  finalR: number;
  perTrade: number;
  achievedWin: number;
  longestLoss: number;
  drawdown: number;
}

/**
 * A small seeded generator (mulberry32). The same seed always gives the same
 * run, which is what lets a curve be drawn from state rather than stored.
 */
function randomFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate(seed: number, settings: Settings): Run {
  const next = randomFrom(seed);
  const rs: number[] = [];
  for (let i = 0; i < settings.count; i++) {
    rs.push(next() * 100 < settings.winPct ? settings.rr : -1);
  }

  let streak = 0;
  let longest = 0;
  for (const r of rs) {
    if (r < 0) {
      streak += 1;
      if (streak > longest) longest = streak;
    } else {
      streak = 0;
    }
  }

  const curve = cumulativeR(rs);
  return {
    seed,
    curve,
    finalR: curve[curve.length - 1],
    perTrade: expectancy(rs),
    achievedWin: winRate(rs),
    longestLoss: longest,
    drawdown: maxDrawdownR(rs),
  };
}

/* --------------------------------- drawing -------------------------------- */

const W = 900;
const H = 300;
const PAD = { top: 16, right: 56, bottom: 26, left: 10 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

const COUNTS = [50, 100, 250];
const FIRST_SEED = 8_675_309;
const KEEP = 5;

const showR = (n: number) =>
  `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}R`;

export default function ExpectancySimulator() {
  const headingId = useId();
  const winId = useId();
  const rrId = useId();

  const [settings, setSettings] = useState<Settings>({
    winPct: 40,
    rr: 2,
    count: 100,
  });
  const [seed, setSeed] = useState(FIRST_SEED);
  const [history, setHistory] = useState<Run[]>([]);

  const current = useMemo(() => simulate(seed, settings), [seed, settings]);

  /*
   * Changing a setting clears the earlier runs on purpose. Comparing a run at
   * 40% with one at 70% teaches nothing about luck, which is the only thing
   * this widget is for.
   */
  function change(next: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...next }));
    setHistory([]);
  }

  function runAgain() {
    setHistory((h) => [current, ...h].slice(0, KEEP));
    setSeed(Math.floor(Math.random() * 4294967296));
  }

  const breakeven = breakevenWinRate(settings.rr);
  const hasEdge = settings.winPct > breakeven;
  /** What the settings pay per trade on average, before luck gets involved. */
  const onPaper = (settings.winPct / 100) * settings.rr - (1 - settings.winPct / 100);

  const geom = useMemo(() => {
    const curves = [current.curve, ...history.map((h) => h.curve)];
    const values = curves.flat();
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values);
    const pad = (hi - lo || 1) * 0.1;
    const yMin = lo - pad;
    const yMax = hi + pad;
    const span = yMax - yMin;
    const points = current.curve.length;

    const x = (i: number) => PAD.left + (i / Math.max(points - 1, 1)) * INNER_W;
    const y = (v: number) => PAD.top + INNER_H - ((v - yMin) / span) * INNER_H;
    return {
      x,
      y,
      line: (curve: number[]) =>
        curve.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" "),
      ticks: Array.from({ length: 5 }, (_, i) => yMin + (span * i) / 4),
      tickText: (v: number) =>
        `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(span < 8 ? 1 : 0)}R`,
    };
  }, [current, history]);

  const finals = [current.finalR, ...history.map((h) => h.finalR)];
  const best = Math.max(...finals);
  const worst = Math.min(...finals);

  const chartLabel =
    `Running total in R across ${settings.count} made-up trades. It starts at zero, ` +
    `ends at ${showR(current.finalR)}, and its deepest fall from a high point is ` +
    `${current.drawdown.toFixed(1)}R.` +
    (history.length > 0
      ? ` ${history.length} earlier ${history.length === 1 ? "run is" : "runs are"} drawn faintly behind it, ` +
        `finishing between ${showR(worst)} and ${showR(best)}.`
      : "");

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        Run 100 trades
      </h2>
      <p className="mt-1 text-sm text-muted">
        Set a win rate and a reward, then let a run of trades play out. Every trade
        here is a coin flip weighted to your settings — made up for practice, not
        anyone&rsquo;s track record. The point is what the flips do to you.
      </p>
      <p className="mt-2 text-sm text-muted">
        Results are counted in R. One R is what you decided to lose if the trade
        goes wrong. A loss is −1R every time; a win pays the reward you set.
      </p>

      {/* ------------------------------ controls ----------------------------- */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={winId} className="flex items-baseline justify-between text-sm">
            <span className="text-muted">How often you win</span>
            <span className="tabular font-mono text-fg">{settings.winPct}%</span>
          </label>
          <input
            id={winId}
            type="range"
            min={10}
            max={90}
            step={1}
            value={settings.winPct}
            onChange={(e) => change({ winPct: Number(e.target.value) })}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            How many of these trades go your way. Being right more often is not the
            same as making more money, which is what the next slider decides.
          </p>
        </div>

        <div>
          <label htmlFor={rrId} className="flex items-baseline justify-between text-sm">
            <span className="text-muted">What a win pays</span>
            <span className="tabular font-mono text-fg">
              {settings.rr.toFixed(1)} : 1
            </span>
          </label>
          <input
            id={rrId}
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={settings.rr}
            onChange={(e) => change({ rr: Number(e.target.value) })}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            A win of {settings.rr.toFixed(1)} : 1 makes {settings.rr.toFixed(1)} times
            what a loss costs. Bigger wins let you be wrong more often and still come
            out ahead.
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="font-mono text-xs uppercase tracking-widest text-muted">
          How many trades
        </legend>
        <div
          role="radiogroup"
          aria-label="How many trades to run"
          className="mt-2 grid grid-cols-3 gap-2"
        >
          {COUNTS.map((n) => {
            const active = settings.count === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => change({ count: n })}
                className={`tabular rounded-xl border px-3 py-2.5 font-mono text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:border-accent hover:text-fg"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          How long a stretch you are looking at. Fifty trades is a busy month for
          many people; two hundred and fifty is closer to a year.
        </p>
      </fieldset>

      {/* ------------------------- does it even work ------------------------- */}
      <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
        <p>
          At {settings.rr.toFixed(1)} : 1 you need to win{" "}
          <strong className="tabular font-mono">{breakeven.toFixed(1)}%</strong> of the
          time just to end level.{" "}
          {hasEdge ? (
            <>
              You are set to {settings.winPct}%, so on average these settings make{" "}
              <strong className="tabular font-mono text-buy">
                {showR(onPaper)}
              </strong>{" "}
              a trade.
            </>
          ) : (
            <>
              You are set to {settings.winPct}%, so on average these settings lose{" "}
              <strong className="tabular font-mono text-sell">
                {showR(onPaper)}
              </strong>{" "}
              a trade.
            </>
          )}
        </p>
      </div>

      {!hasEdge && (
        <Callout tone="warn">
          These settings have no edge. However good a single run looks, running it
          enough times ends in the same place. Nudge the win rate up, or ask a win to
          pay more, and watch the paper figure above cross zero.
        </Callout>
      )}

      {/* -------------------------------- chart ------------------------------ */}
      <figure className="m-0 mt-5 overflow-hidden rounded-xl border border-border bg-surface">
        <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-xs">
          <span className="text-muted">
            Running total in R &middot; {settings.count} trades
          </span>
          <span className="tabular font-mono text-muted">
            {history.length > 0
              ? `${history.length + 1} runs, same settings`
              : "run it again to compare"}
          </span>
        </figcaption>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={chartLabel}
          style={{ display: "block", height: "auto" }}
        >
          {geom.ticks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={geom.y(v)}
                y2={geom.y(v)}
                stroke="var(--border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={W - PAD.right + 8}
                y={geom.y(v) + 4}
                fill="var(--muted)"
                fontSize="11"
                fontFamily="var(--font-mono)"
              >
                {geom.tickText(v)}
              </text>
            </g>
          ))}

          {/* break-even: the line that decides whether the run was worth taking */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={geom.y(0)}
            y2={geom.y(0)}
            stroke="var(--muted)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />

          {/* the runs before this one */}
          {history.map((h) => (
            <polyline
              key={h.seed}
              points={geom.line(h.curve)}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="1.25"
              opacity="0.45"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <polyline
            points={geom.line(current.curve)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={geom.x(current.curve.length - 1)}
            cy={geom.y(current.finalR)}
            r="4"
            fill="var(--accent)"
          />

          <text
            x={PAD.left}
            y={H - 7}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            first trade
          </text>
          <text
            x={W - PAD.right}
            y={H - 7}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            textAnchor="end"
          >
            trade {settings.count}
          </text>
        </svg>
      </figure>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runAgain}
          className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg"
        >
          Run it again — same settings
        </button>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setHistory([])}
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
          >
            Clear the earlier runs
          </button>
        )}
      </div>

      {/* ------------------------------- results ----------------------------- */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Where it ended"
          value={showR(current.finalR)}
          tone={current.finalR >= 0 ? "buy" : "sell"}
        />
        <Stat label="Average per trade" value={showR(current.perTrade)} />
        <Stat label="Wins" value={`${current.achievedWin.toFixed(1)}%`} />
        <Stat label="Longest losing run" value={`${current.longestLoss} in a row`} />
        <Stat
          label="Worst fall from a high"
          value={`−${current.drawdown.toFixed(1)}R`}
          tone="sell"
        />
        <Stat
          label="Wins needed to end level"
          value={`${breakeven.toFixed(1)}%`}
        />
      </div>

      {history.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            Every run, same settings
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            <li className="tabular font-mono text-accent">
              {showR(current.finalR)} &middot; this one
            </li>
            {history.map((h, i) => (
              <li key={h.seed} className="tabular font-mono text-muted">
                {showR(h.finalR)} &middot; {i === 0 ? "the one before" : `${i + 1} runs back`}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-sm text-muted">
            {finals.length} runs of {settings.count} trades, nothing changed between
            them, finishing anywhere from{" "}
            <strong className="tabular font-mono text-fg">{showR(worst)}</strong> to{" "}
            <strong className="tabular font-mono text-fg">{showR(best)}</strong>.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          {hasEdge
            ? `Press it a few more times. The settings never move, and the runs still ` +
              `land far apart — this one had ${current.longestLoss} losses in a row and ` +
              `gave back ${current.drawdown.toFixed(1)}R from its best point. That stretch ` +
              `is what makes people abandon a method that was working.`
            : `Press it a few more times. Some runs will finish well up, and none of ` +
              `that changes the paper figure above. A good run on settings that lose is ` +
              `the most expensive thing that can happen to a new trader, because it ` +
              `teaches the wrong lesson.`}
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        Real trading is harder than this. Here every loss costs exactly 1R and every
        win pays in full, with no missed fills, no costs and no bad mornings.
      </p>
    </section>
  );
}
