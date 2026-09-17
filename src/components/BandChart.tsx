"use client";

import { useId, useMemo } from "react";
import type { Bands } from "@/lib/bollinger";
import type { Order } from "@/lib/backtest";

const W = 900;
const H = 380;
const PAD = { top: 14, right: 56, bottom: 26, left: 8 };

function finite(xs: number[]): number[] {
  return xs.filter(Number.isFinite);
}

/**
 * Price chart with the band envelope, drawn as inline SVG.
 *
 * A fixed viewBox plus `vector-effect: non-scaling-stroke` means the chart
 * scales to any width without the line weights distorting — which is what makes
 * it legible on a phone as well as a laptop.
 */
export default function BandChart({
  close,
  bands,
  dates,
  orders,
  window: win,
  height = H,
}: {
  close: number[];
  bands: Bands;
  dates: string[];
  orders: Order[];
  window: number;
  height?: number;
}) {
  const gradientId = useId();

  const geom = useMemo(() => {
    const all = [...finite(close), ...finite(bands.upper), ...finite(bands.lower)];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = hi - lo || 1;
    const padY = span * 0.06;
    const yMin = lo - padY;
    const yMax = hi + padY;

    const innerW = W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (close.length <= 1 ? 0 : (i / (close.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    const line = (series: number[]) => {
      const parts: string[] = [];
      let open = false;
      series.forEach((v, i) => {
        if (!Number.isFinite(v)) {
          open = false;
          return;
        }
        parts.push(`${open ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`);
        open = true;
      });
      return parts.join(" ");
    };

    // envelope: upper left-to-right, then lower right-to-left, closed
    const idx = bands.upper
      .map((v, i) => (Number.isFinite(v) && Number.isFinite(bands.lower[i]) ? i : -1))
      .filter((i) => i >= 0);
    let envelope = "";
    if (idx.length > 1) {
      const up = idx.map((i) => `${x(i).toFixed(2)} ${y(bands.upper[i]).toFixed(2)}`);
      const down = [...idx]
        .reverse()
        .map((i) => `${x(i).toFixed(2)} ${y(bands.lower[i]).toFixed(2)}`);
      envelope = `M${up.join(" L")} L${down.join(" L")} Z`;
    }

    const ticks = Array.from({ length: 5 }, (_, i) => {
      const v = yMin + ((yMax - yMin) * i) / 4;
      return { v, y: y(v) };
    });

    return {
      x,
      y,
      line,
      envelope,
      ticks,
      warmupX: x(Math.max(0, win - 1)),
      innerH,
    };
  }, [close, bands, win, height]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        role="img"
        aria-label={`Price chart with Bollinger Bands over ${close.length} bars, showing ${orders.length} orders`}
        style={{ display: "block", height: "auto" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines + price axis on the right */}
        {geom.ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="var(--border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={W - PAD.right + 8}
              y={t.y + 4}
              fill="var(--muted)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {t.v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* the window-1 bars where the bands do not yet exist */}
        {win > 1 && (
          <>
            <rect
              x={PAD.left}
              y={PAD.top}
              width={Math.max(0, geom.warmupX - PAD.left)}
              height={geom.innerH}
              fill="var(--muted)"
              opacity="0.07"
            />
            <line
              x1={geom.warmupX}
              x2={geom.warmupX}
              y1={PAD.top}
              y2={PAD.top + geom.innerH}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {geom.envelope && <path d={geom.envelope} fill={`url(#${gradientId})`} />}

        <path
          d={geom.line(bands.upper)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={geom.line(bands.lower)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={geom.line(bands.middle)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.25"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={geom.line(close)}
          fill="none"
          stroke="var(--fg)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {orders.map((o, i) => {
          const cx = geom.x(o.index);
          const cy = geom.y(o.price);
          const buy = o.side === "buy";
          const colour = buy ? "var(--buy)" : "var(--sell)";
          const dy = buy ? 9 : -9;
          return (
            <g key={i}>
              <path
                d={`M${cx} ${cy + dy} l-5 ${buy ? 7 : -7} l10 0 Z`}
                fill={colour}
              />
              <circle cx={cx} cy={cy} r="2.5" fill={colour} />
              <title>
                {`${buy ? "Buy" : "Sell"} at ${o.price.toFixed(2)} on ${dates[o.index] ?? `bar ${o.index}`}`}
              </title>
            </g>
          );
        })}

        {/* date axis: first, middle, last */}
        {[0, Math.floor(close.length / 2), close.length - 1].map((i) =>
          dates[i] ? (
            <text
              key={i}
              x={geom.x(i)}
              y={height - 8}
              fill="var(--muted)"
              fontSize="11"
              fontFamily="var(--font-mono)"
              textAnchor={i === 0 ? "start" : i === close.length - 1 ? "end" : "middle"}
            >
              {dates[i]}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
