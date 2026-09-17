"use client";

import { useMemo, useState } from "react";
import { MONTHLY, DATA_NOTICE } from "@/data/index";
import { pctChange, dropna, mean, stdDev } from "@/lib/stats";
import { sharpe } from "@/lib/metrics";
import { Callout, Stat } from "@/components/ui";

const RF_ANNUAL = 0.02;

export default function AssetLab() {
  const [topN, setTopN] = useState(10);
  const [pick, setPick] = useState(3);

  const table = useMemo(() => {
    const rf = RF_ANNUAL / 12;
    const rows = Object.entries(MONTHLY.series).map(([name, prices]) => {
      const returns = dropna(pctChange(prices));
      const expected = mean(returns);
      const risk = stdDev(returns);
      return {
        name,
        months: prices.length,
        returnMonths: returns.length,
        expected,
        risk,
        sharpe: sharpe(expected, rf, risk),
      };
    });
    const ranked = [...rows].sort((a, b) => b.expected - a.expected);
    return { rows, ranked, rf };
  }, []);

  const top = table.ranked.slice(0, topN);
  const selected = top[Math.min(pick, top.length - 1)];
  const monthsTotal = MONTHLY.dates.length;

  return (
    <div className="space-y-8">
      {/* ---------- the pipeline ---------- */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          The pipeline, one step at a time
        </h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-4">
          {[
            {
              code: "download(...)",
              label: `${Object.keys(MONTHLY.series).length} assets × ${monthsTotal} months`,
              note: "Monthly adjusted closes.",
            },
            {
              code: ".dropna(axis=1)",
              label: "Drop incomplete assets",
              note: "axis=1 removes whole columns — that is, whole assets.",
            },
            {
              code: ".pct_change()",
              label: `${monthsTotal} → ${monthsTotal - 1} rows`,
              note: "The first row becomes NaN, so a second dropna() is needed.",
            },
            {
              code: ".mean()",
              label: "One number per asset",
              note: "The expected monthly return, ready to rank.",
            },
          ].map((s) => (
            <li key={s.code} className="card p-4">
              <code className="text-xs font-semibold text-accent">{s.code}</code>
              <p className="mt-1.5 text-sm font-medium">{s.label}</p>
              <p className="mt-1 text-xs text-muted">{s.note}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- the canonical question ---------- */}
      <section className="card p-5">
        <h2 className="font-display text-lg font-semibold">
          The canonical exam question
        </h2>
        <p className="mt-2 text-sm text-muted">
          &ldquo;Rank by expected monthly return, take the top{" "}
          <strong className="text-fg">{topN}</strong>, and give the{" "}
          <strong className="text-fg">
            {pick + 1}
            {pick === 0 ? "st" : pick === 1 ? "nd" : pick === 2 ? "rd" : "th"}
          </strong>{" "}
          highest as a percentage, rounded to 2 decimal places.&rdquo;
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="text-sm font-medium">nlargest(n)</span>
              <span className="tabular font-mono text-sm text-accent">{topN}</span>
            </span>
            <input
              type="range"
              min={1}
              max={Object.keys(MONTHLY.series).length}
              value={topN}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTopN(v);
                setPick((p) => Math.min(p, v - 1));
              }}
              className="mt-2"
            />
          </label>
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Which rank?</span>
              <span className="tabular font-mono text-sm text-accent">
                .iloc[{pick}]
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, topN - 1)}
              value={pick}
              onChange={(e) => setPick(Number(e.target.value))}
              className="mt-2"
            />
          </label>
        </div>

        {selected && (
          <div className="mt-4 rounded-xl border border-accent bg-accent-soft p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-muted">
              round(TOP{topN}.iloc[{pick}], 2)
            </p>
            <p className="tabular mt-1 font-display text-3xl font-bold text-accent">
              {(selected.expected * 100).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {selected.name} — the {pick + 1}
              {pick === 0 ? "st" : pick === 1 ? "nd" : pick === 2 ? "rd" : "th"}{" "}
              highest expected monthly return.
            </p>
          </div>
        )}

        <Callout tone="warn">
          Two traps live in that one line. The index is{" "}
          <strong>zero-based</strong>, so the 4th-highest is{" "}
          <code className="chip">.iloc[3]</code> — drag the slider and watch the
          label disagree with the rank. And the multiplication by 100 must happen{" "}
          <strong>before</strong> the rounding, or{" "}
          {selected ? (
            <>
              {selected.expected.toFixed(4)} would round to{" "}
              <code className="chip">{selected.expected.toFixed(2)}</code> instead
              of <code className="chip">{(selected.expected * 100).toFixed(2)}</code>
            </>
          ) : (
            "a 2.34% return rounds to 0.02"
          )}
          .
        </Callout>
      </section>

      {/* ---------- full table ---------- */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          Every asset, ranked
        </h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-3 py-2.5 font-display text-xs uppercase tracking-wide text-muted">
                  #
                </th>
                <th className="px-3 py-2.5 font-display text-xs uppercase tracking-wide text-muted">
                  Asset
                </th>
                <th className="px-3 py-2.5 text-right font-display text-xs uppercase tracking-wide text-muted">
                  E[r] monthly
                </th>
                <th className="px-3 py-2.5 text-right font-display text-xs uppercase tracking-wide text-muted">
                  Risk (SD)
                </th>
                <th className="px-3 py-2.5 text-right font-display text-xs uppercase tracking-wide text-muted">
                  Sharpe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.ranked.map((r, i) => {
                const inTop = i < topN;
                const isPick = i === pick && inTop;
                return (
                  <tr
                    key={r.name}
                    className={
                      isPick
                        ? "bg-accent-soft"
                        : inTop
                          ? ""
                          : "opacity-45"
                    }
                  >
                    <td className="tabular px-3 py-2 font-mono text-xs text-muted">
                      {i}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="tabular px-3 py-2 text-right font-mono">
                      {(r.expected * 100).toFixed(2)}%
                    </td>
                    <td className="tabular px-3 py-2 text-right font-mono text-muted">
                      {(r.risk * 100).toFixed(2)}%
                    </td>
                    <td
                      className={`tabular px-3 py-2 text-right font-mono ${
                        r.sharpe >= 0 ? "text-buy" : "text-sell"
                      }`}
                    >
                      {r.sharpe.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Faded rows fall outside <code className="chip">nlargest({topN})</code>.
          Risk-free rate for the Sharpe column is {RF_ANNUAL * 100}% annual, i.e.{" "}
          <code className="chip">{RF_ANNUAL}/12</code> monthly.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Assets" value={String(Object.keys(MONTHLY.series).length)} />
        <Stat label="Months of prices" value={String(monthsTotal)} />
        <Stat label="Months of returns" value={String(monthsTotal - 1)} />
        <Stat label="Monthly rf" value={table.rf.toFixed(6)} />
      </div>

      <Callout tone="note">
        {DATA_NOTICE} The tickers are invented four-letter names so nobody
        mistakes them for real companies.
      </Callout>
    </div>
  );
}
