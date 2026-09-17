"use client";

import { useId, useMemo } from "react";
import type { Bar } from "@/data/index";

/**
 * A candlestick chart, drawn as inline SVG.
 *
 * Shared by every interactive lesson on the site, so the candles a learner sees
 * while being taught what a wick is are the same ones they later mark up in a
 * drill.
 *
 * A fixed viewBox with non-scaling strokes means it scales to any width without
 * the line weights distorting, which is what keeps it legible on a phone.
 */

export interface PriceLine {
  price: number;
  label: string;
  /** buy = green, sell = red, plain = accent, muted = grey. */
  tone?: "buy" | "sell" | "plain" | "muted";
  dashed?: boolean;
}

export interface Marker {
  index: number;
  price: number;
  side: "buy" | "sell";
  label?: string;
}

const W = 900;
const PAD = { top: 16, right: 64, bottom: 24, left: 10 };

export default function CandleChart({
  bars,
  dates,
  height = 340,
  lines = [],
  markers = [],
  /** Bars from this index on are drawn faded, for "the rest is hidden". */
  hideFrom,
  /** Highlight one bar, for teaching what a single candle is made of. */
  focusIndex,
  onFocus,
  ariaLabel,
  shadeBetween,
}: {
  bars: Bar[];
  dates?: string[];
  height?: number;
  lines?: PriceLine[];
  markers?: Marker[];
  hideFrom?: number;
  focusIndex?: number;
  onFocus?: (index: number) => void;
  ariaLabel?: string;
  /** A shaded band, used to show the distance between two prices. */
  shadeBetween?: { from: number; to: number; tone: "buy" | "sell" };
}) {
  const clipId = useId();

  const geom = useMemo(() => {
    const prices = bars.flatMap((b) => [b.h, b.l]);
    for (const l of lines) if (Number.isFinite(l.price)) prices.push(l.price);
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const span = hi - lo || 1;
    const yMin = lo - span * 0.08;
    const yMax = hi + span * 0.08;

    const innerW = W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const step = innerW / Math.max(bars.length, 1);

    return {
      x: (i: number) => PAD.left + step * (i + 0.5),
      y: (v: number) =>
        PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH,
      barW: Math.max(1.5, Math.min(14, step * 0.66)),
      innerH,
      ticks: Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4),
    };
  }, [bars, lines, height]);

  const toneColour = (tone: PriceLine["tone"]) =>
    tone === "buy"
      ? "var(--buy)"
      : tone === "sell"
        ? "var(--sell)"
        : tone === "muted"
          ? "var(--muted)"
          : "var(--accent)";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        role="img"
        aria-label={ariaLabel ?? `Candlestick chart of ${bars.length} bars`}
        style={{ display: "block", height: "auto" }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={W - PAD.right} height={height} />
          </clipPath>
        </defs>

        {/* price gridlines */}
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
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* the band between two prices, e.g. entry to stop */}
        {shadeBetween && Number.isFinite(shadeBetween.from) && Number.isFinite(shadeBetween.to) && (
          <rect
            x={PAD.left}
            width={W - PAD.right - PAD.left}
            y={Math.min(geom.y(shadeBetween.from), geom.y(shadeBetween.to))}
            height={Math.abs(geom.y(shadeBetween.from) - geom.y(shadeBetween.to))}
            fill={shadeBetween.tone === "buy" ? "var(--buy)" : "var(--sell)"}
            opacity="0.12"
          />
        )}

        {/* the hidden region */}
        {hideFrom !== undefined && hideFrom < bars.length && (
          <rect
            x={geom.x(hideFrom) - geom.barW}
            y={PAD.top}
            width={W - PAD.right - (geom.x(hideFrom) - geom.barW)}
            height={geom.innerH}
            fill="var(--muted)"
            opacity="0.1"
          />
        )}

        {/* candles */}
        <g clipPath={`url(#${clipId})`}>
          {bars.map((b, i) => {
            const up = b.c >= b.o;
            const colour = up ? "var(--buy)" : "var(--sell)";
            const hidden = hideFrom !== undefined && i >= hideFrom;
            const focused = focusIndex === i;
            const bodyTop = geom.y(Math.max(b.o, b.c));
            const bodyBottom = geom.y(Math.min(b.o, b.c));
            return (
              <g
                key={i}
                opacity={hidden ? 0.18 : focusIndex !== undefined && !focused ? 0.3 : 1}
                onClick={onFocus ? () => onFocus(i) : undefined}
                style={onFocus ? { cursor: "pointer" } : undefined}
              >
                {/* wick */}
                <line
                  x1={geom.x(i)}
                  x2={geom.x(i)}
                  y1={geom.y(b.h)}
                  y2={geom.y(b.l)}
                  stroke={colour}
                  strokeWidth={focused ? 2.5 : 1.25}
                  vectorEffect="non-scaling-stroke"
                />
                {/* body */}
                <rect
                  x={geom.x(i) - geom.barW / 2}
                  y={bodyTop}
                  width={geom.barW}
                  height={Math.max(1.5, bodyBottom - bodyTop)}
                  fill={colour}
                  stroke={focused ? "var(--fg)" : "none"}
                  strokeWidth={focused ? 1.5 : 0}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>

        {/* horizontal price lines */}
        {lines
          .filter((l) => Number.isFinite(l.price))
          .map((l, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={geom.y(l.price)}
                y2={geom.y(l.price)}
                stroke={toneColour(l.tone)}
                strokeWidth="1.5"
                strokeDasharray={l.dashed === false ? undefined : "6 4"}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={PAD.left + 6}
                y={geom.y(l.price) - 6}
                fill={toneColour(l.tone)}
                fontSize="12"
                fontFamily="var(--font-mono)"
              >
                {l.label}
              </text>
            </g>
          ))}

        {/* trade markers */}
        {markers.map((m, i) => {
          const buy = m.side === "buy";
          const colour = buy ? "var(--buy)" : "var(--sell)";
          const cx = geom.x(m.index);
          const cy = geom.y(m.price);
          return (
            <g key={i}>
              <path
                d={`M${cx} ${cy + (buy ? 10 : -10)} l-5 ${buy ? 8 : -8} l10 0 Z`}
                fill={colour}
              />
              <title>{m.label ?? `${buy ? "Buy" : "Sell"} at ${m.price.toFixed(2)}`}</title>
            </g>
          );
        })}

        {/* dates */}
        {dates &&
          [0, bars.length - 1].map((i) =>
            dates[i] ? (
              <text
                key={i}
                x={geom.x(i)}
                y={height - 6}
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
