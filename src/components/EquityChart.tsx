"use client";

import { useMemo } from "react";

const W = 900;
const H = 180;
const PAD = { top: 12, right: 56, bottom: 22, left: 8 };

/**
 * Strategy equity against the passive benchmark. Two lines, no envelope — the
 * only question this chart answers is "did the trading beat doing nothing?".
 */
export default function EquityChart({
  strategy,
  benchmark,
  dates,
  initialCash,
}: {
  strategy: number[];
  benchmark: number[];
  dates: string[];
  initialCash: number;
}) {
  const geom = useMemo(() => {
    const all = [...strategy, ...benchmark, initialCash].filter(Number.isFinite);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = hi - lo || 1;
    const yMin = lo - span * 0.08;
    const yMax = hi + span * 0.08;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const n = Math.max(strategy.length, benchmark.length);
    const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    const line = (series: number[]) =>
      series
        .map((v, i) =>
          Number.isFinite(v) ? `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(v).toFixed(2)}` : "",
        )
        .filter(Boolean)
        .join(" ");

    return { x, y, line, yMin, yMax, innerH };
  }, [strategy, benchmark, initialCash]);

  const finalStrategy = strategy[strategy.length - 1] ?? initialCash;
  const finalBenchmark = benchmark[benchmark.length - 1] ?? initialCash;
  const ahead = finalStrategy >= finalBenchmark;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-4 py-2 text-xs">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5 bg-accent" />
          <span className="text-muted">Strategy</span>
          <span className="tabular font-semibold">${finalStrategy.toFixed(0)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-0.5 w-5"
            style={{ background: "var(--muted)" }}
          />
          <span className="text-muted">Buy &amp; hold</span>
          <span className="tabular font-semibold">${finalBenchmark.toFixed(0)}</span>
        </span>
        <span className={`tabular ml-auto font-semibold ${ahead ? "text-buy" : "text-sell"}`}>
          {ahead ? "+" : ""}
          {(((finalStrategy - finalBenchmark) / finalBenchmark) * 100).toFixed(1)}% vs
          benchmark
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Equity curve. Strategy ends at ${finalStrategy.toFixed(0)} dollars, buy and hold at ${finalBenchmark.toFixed(0)} dollars.`}
        style={{ display: "block", height: "auto" }}
      >
        {/* the starting-cash line, so 'above water' is instantly readable */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={geom.y(initialCash)}
          y2={geom.y(initialCash)}
          stroke="var(--border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={W - PAD.right + 8}
          y={geom.y(initialCash) + 4}
          fill="var(--muted)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {initialCash / 1000}k
        </text>

        <path
          d={geom.line(benchmark)}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="1.25"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={geom.line(strategy)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />

        {[0, dates.length - 1].map((i) =>
          dates[i] ? (
            <text
              key={i}
              x={geom.x(i)}
              y={H - 6}
              fill="var(--muted)"
              fontSize="11"
              fontFamily="var(--font-mono)"
              textAnchor={i === 0 ? "start" : "end"}
            >
              {dates[i]}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
