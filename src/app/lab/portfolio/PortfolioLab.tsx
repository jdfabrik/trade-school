"use client";

import { useMemo, useState } from "react";
import { MONTHLY, DATA_NOTICE } from "@/data/index";
import { pctChange, dropna, mean } from "@/lib/stats";
import { minimizeRisk, maximizeSharpe, equalWeight, type Allocation } from "@/lib/optimize";
import { Callout, Stat } from "@/components/ui";

const TOP_N = 10;

function Weights({
  allocation,
  investment,
  accent,
}: {
  allocation: Allocation;
  investment: number;
  accent: boolean;
}) {
  const rows = allocation.names
    .map((name, i) => ({ name, weight: allocation.weights[i] }))
    .sort((a, b) => b.weight - a.weight);
  const maxWeight = Math.max(...rows.map((r) => r.weight), 1e-9);

  return (
    <ul className="mt-4 space-y-1.5">
      {rows.map((r) => {
        const dropped = r.weight < 0.0005;
        return (
          <li
            key={r.name}
            className={`grid grid-cols-[3.5rem_1fr_5rem] items-center gap-2 text-sm ${
              dropped ? "opacity-35" : ""
            }`}
          >
            <span className="font-mono text-xs font-medium">{r.name}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(r.weight / maxWeight) * 100}%`,
                  background: accent ? "var(--accent)" : "var(--muted)",
                }}
              />
            </span>
            <span className="tabular text-right font-mono text-xs">
              ${(r.weight * investment).toFixed(0)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Panel({
  title,
  code,
  blurb,
  allocation,
  investment,
  accent,
}: {
  title: string;
  code: string;
  blurb: string;
  allocation: Allocation;
  investment: number;
  accent: boolean;
}) {
  const held = allocation.weights.filter((w) => w >= 0.0005).length;
  return (
    <div className={`card p-5 ${accent ? "border-accent" : ""}`}>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <code className="mt-1 block text-xs text-accent">{code}</code>
      <p className="mt-2 text-sm text-muted">{blurb}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="E[r] monthly" value={`${(allocation.expectedReturn * 100).toFixed(2)}%`} />
        <Stat label="Risk (SD)" value={`${(allocation.risk * 100).toFixed(2)}%`} />
        <Stat label="Sharpe" value={allocation.sharpe.toFixed(3)} />
      </div>

      <Weights allocation={allocation} investment={investment} accent={accent} />

      <p className="mt-3 text-xs text-muted">
        Holds {held} of {allocation.names.length} assets
        {held < allocation.names.length && " — the rest are allocated zero"}. Solver
        converged in {allocation.iterations} steps.
      </p>
    </div>
  );
}

export default function PortfolioLab() {
  const [investment, setInvestment] = useState(25_000);
  const [rfAnnual, setRfAnnual] = useState(2);

  const model = useMemo(() => {
    const rf = rfAnnual / 100 / 12;

    // rank by expected return and keep the top N — the guide's MONTHLY[TOP10]
    const ranked = Object.entries(MONTHLY.series)
      .map(([name, prices]) => ({
        name,
        returns: dropna(pctChange(prices)),
      }))
      .map((x) => ({ ...x, expected: mean(x.returns) }))
      .sort((a, b) => b.expected - a.expected)
      .slice(0, TOP_N);

    const returns: Record<string, number[]> = {};
    for (const r of ranked) returns[r.name] = r.returns;

    return {
      rf,
      calm: minimizeRisk(returns, { riskFreeRate: rf }),
      sharp: maximizeSharpe(returns, { riskFreeRate: rf }),
      naive: equalWeight(returns, { riskFreeRate: rf }),
    };
  }, [rfAnnual]);

  return (
    <div className="space-y-6">
      <div className="card grid gap-5 p-5 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Investment</span>
            <span className="tabular font-mono text-sm text-accent">
              ${investment.toLocaleString()}
            </span>
          </span>
          <input
            type="range"
            min={1000}
            max={100_000}
            step={1000}
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
            className="mt-2"
          />
          <span className="mt-1 block text-xs text-muted">
            Weights come back as decimal ratios, so this is{" "}
            <code className="chip">composition * {investment}</code>.
          </span>
        </label>

        <label className="block">
          <span className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Annual risk-free rate</span>
            <span className="tabular font-mono text-sm text-accent">
              {rfAnnual.toFixed(1)}%
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={rfAnnual}
            onChange={(e) => setRfAnnual(Number(e.target.value))}
            className="mt-2"
          />
          <span className="mt-1 block text-xs text-muted">
            Passed as <code className="chip">risk_free_rate={rfAnnual / 100}/12</code>{" "}
            = {model.rf.toFixed(6)} monthly.
          </span>
        </label>
      </div>

      <Callout tone="note">
        Drag the risk-free rate and watch only the right-hand panel move.{" "}
        <code className="chip">MINIMIZE_RISK</code> has no ratio to form, so it
        never sees the rate — which is precisely why skfolio does not ask for one.{" "}
        <code className="chip">MAXIMIZE_RATIO</code> cannot work without it.
      </Callout>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Minimum risk"
          code="ObjectiveFunction.MINIMIZE_RISK"
          blurb="The calmest portfolio available. It piles into the low-volatility assets and ignores expected return entirely."
          allocation={model.calm}
          investment={investment}
          accent={false}
        />
        <Panel
          title="Maximum Sharpe"
          code="ObjectiveFunction.MAXIMIZE_RATIO"
          blurb="The best reward per unit of risk. It will happily hold a volatile asset if the return justifies the ride."
          allocation={model.sharp}
          investment={investment}
          accent
        />
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg font-semibold">
          Against equal weighting
        </h3>
        <p className="mt-2 text-sm text-muted">
          Splitting the money evenly across all {TOP_N} is the benchmark. Both
          optimizers should beat it at their own objective — and if one did not,
          the build would fail, because that is a test.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="py-2 font-display text-xs uppercase tracking-wide text-muted">
                  Portfolio
                </th>
                <th className="py-2 text-right font-display text-xs uppercase tracking-wide text-muted">
                  E[r]
                </th>
                <th className="py-2 text-right font-display text-xs uppercase tracking-wide text-muted">
                  Risk
                </th>
                <th className="py-2 text-right font-display text-xs uppercase tracking-wide text-muted">
                  Sharpe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: "Equal weight", a: model.naive },
                { name: "Minimum risk", a: model.calm },
                { name: "Maximum Sharpe", a: model.sharp },
              ].map((row) => (
                <tr key={row.name}>
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="tabular py-2 text-right font-mono">
                    {(row.a.expectedReturn * 100).toFixed(2)}%
                  </td>
                  <td className="tabular py-2 text-right font-mono">
                    {(row.a.risk * 100).toFixed(2)}%
                  </td>
                  <td className="tabular py-2 text-right font-mono">
                    {row.a.sharpe.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Callout tone="warn">
        {DATA_NOTICE} And a caveat that applies to real data too: these are{" "}
        <em>in-sample</em> optima. An optimizer handed history will always find the
        portfolio that would have been best — which tells you much less about
        tomorrow than it appears to.
      </Callout>
    </div>
  );
}
