"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { REGIMES, DATA_NOTICE } from "@/data/index";
import { bbands, signalsFor, countTrue, type SignalMode } from "@/lib/bollinger";
import { fromSignals, buyAndHold } from "@/lib/backtest";
import BandChart from "@/components/BandChart";
import EquityChart from "@/components/EquityChart";
import { Callout, Stat } from "@/components/ui";

const CASH = 10_000;

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="tabular font-mono text-sm text-accent">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function BollingerLab() {
  const [regimeId, setRegimeId] = useState(REGIMES[0].id);
  const [window, setWindow] = useState(20);
  const [alphaUpper, setAlphaUpper] = useState(2);
  const [alphaLower, setAlphaLower] = useState(2);
  const [feePct, setFeePct] = useState(0.1);
  const [mode, setMode] = useState<SignalMode>("crossing");

  const regime = REGIMES.find((r) => r.id === regimeId) ?? REGIMES[0];
  const fees = feePct / 100;

  const model = useMemo(() => {
    const bands = bbands(regime.close, window, alphaUpper, alphaLower);
    const { entries, exits } = signalsFor(regime.close, bands, mode);
    const result = fromSignals(regime.close, entries, exits, {
      fees,
      initialCash: CASH,
    });
    const benchmark = buyAndHold(regime.close, { fees, initialCash: CASH });

    // compare against the other signal mode, which is the actual lesson here
    const otherMode: SignalMode = mode === "crossing" ? "plain" : "crossing";
    const other = signalsFor(regime.close, bands, otherMode);
    const otherResult = fromSignals(regime.close, other.entries, other.exits, {
      fees,
      initialCash: CASH,
    });

    const lastSigma = [...bands.sigma].reverse().find(Number.isFinite) ?? NaN;

    return {
      bands,
      result,
      benchmark,
      entrySignals: countTrue(entries),
      exitSignals: countTrue(exits),
      otherEntrySignals: countTrue(other.entries),
      otherExitSignals: countTrue(other.exits),
      otherOrders: otherResult.orders.length,
      lastSigma,
      bandwidth: (alphaUpper + alphaLower) * lastSigma,
    };
  }, [regime, window, alphaUpper, alphaLower, fees, mode]);

  const { result, benchmark } = model;
  const finalBenchmark = benchmark[benchmark.length - 1] ?? CASH;
  const asymmetric = Math.abs(alphaUpper - alphaLower) > 1e-9;

  return (
    <div className="space-y-6">
      {/* ---------- regime picker ---------- */}
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          Market regime
        </h2>
        <div
          role="radiogroup"
          aria-label="Market regime"
          className="mt-3 grid gap-2 sm:grid-cols-3"
        >
          {REGIMES.map((r) => {
            const active = r.id === regimeId;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRegimeId(r.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:border-accent"
                }`}
              >
                <span className="block font-display text-sm font-semibold">
                  {r.label}
                </span>
                <span className="mt-1 block text-xs text-muted">{r.note}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- chart ---------- */}
      <BandChart
        close={regime.close}
        bands={model.bands}
        dates={regime.dates}
        orders={result.orders}
        window={window}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5" style={{ background: "var(--fg)" }} />
          Close
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-0.5 w-5 border-t border-dashed"
            style={{ borderColor: "var(--accent)" }}
          />
          Middle band (SMA of {window})
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5 bg-accent opacity-75" />
          Upper / lower bands
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-buy">
            ▲
          </span>
          Buy
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-sell">
            ▼
          </span>
          Sell
        </span>
        <span className="ml-auto">
          Shaded left edge = the first {window - 1} bars, where the bands do not
          exist yet
        </span>
      </div>

      {/* ---------- readout ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="Final value"
          value={`$${result.finalValue.toFixed(0)}`}
          tone={result.finalValue >= CASH ? "buy" : "sell"}
        />
        <Stat label="Buy &amp; hold" value={`$${finalBenchmark.toFixed(0)}`} />
        <Stat label="Trades" value={String(result.trades)} />
        <Stat label="Fees paid" value={`$${result.totalFees.toFixed(2)}`} />
        <Stat
          label="Bandwidth"
          value={Number.isFinite(model.bandwidth) ? `${model.bandwidth.toFixed(2)}` : "—"}
        />
        <Stat
          label="Signals (buy/sell)"
          value={`${model.entrySignals}/${model.exitSignals}`}
        />
      </div>

      {/* ---------- controls ---------- */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-5 p-5">
          <Slider
            label="Window"
            hint={`${window} bars. On 5-minute bars that is a ${window * 5}-minute moving average.`}
            value={window}
            min={5}
            max={60}
            step={1}
            onChange={setWindow}
          />
          <Slider
            label="Upper alpha"
            value={alphaUpper}
            min={0.5}
            max={4}
            step={0.1}
            onChange={setAlphaUpper}
            format={(v) => `${v.toFixed(1)}σ`}
          />
          <Slider
            label="Lower alpha"
            hint={
              asymmetric
                ? "Asymmetric — the middle band is no longer centred between the bands."
                : "Matched to the upper alpha, so the envelope is symmetric."
            }
            value={alphaLower}
            min={0.5}
            max={4}
            step={0.1}
            onChange={setAlphaLower}
            format={(v) => `${v.toFixed(1)}σ`}
          />
          <Slider
            label="Fees"
            hint={`Passed to the backtest as fees=${fees}`}
            value={feePct}
            min={0}
            max={1}
            step={0.05}
            onChange={setFeePct}
            format={(v) => `${v.toFixed(2)}%`}
          />
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <h3 className="font-display text-sm font-semibold">Signal logic</h3>
            <p className="mt-1 text-xs text-muted">
              The distinction the exam tests, and the one you can feel here.
            </p>
            <div role="radiogroup" aria-label="Signal logic" className="mt-3 space-y-2">
              {(
                [
                  {
                    id: "crossing" as SignalMode,
                    title: "crossed_below / crossed_above",
                    body: "True only on the bar where the price transitions across the band. The correct version.",
                  },
                  {
                    id: "plain" as SignalMode,
                    title: "< and >",
                    body: "True on every bar the price sits outside the band. The classic wrong answer.",
                  },
                ]
              ).map((opt) => {
                const active = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(opt.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    <code className="text-sm font-semibold">{opt.title}</code>
                    <span className="mt-1 block text-xs text-muted">{opt.body}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted">
              What switching actually changes
            </h4>
            <dl className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Signals, this mode</dt>
                <dd className="tabular font-semibold">
                  {model.entrySignals} buy / {model.exitSignals} sell
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Signals, other mode</dt>
                <dd className="tabular font-semibold">
                  {model.otherEntrySignals} buy / {model.otherExitSignals} sell
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-1.5">
                <dt className="text-muted">Orders actually placed</dt>
                <dd className="tabular font-semibold">
                  {result.orders.length} vs {model.otherOrders}
                </dd>
              </div>
            </dl>
            <p className="mt-2.5 text-xs text-muted">
              Note the gap between those two rows.{" "}
              <code className="chip">&lt;</code> fires far more signals, but{" "}
              <code className="chip">from_signals</code> ignores a buy while you are
              already holding — so the trade count often barely moves. The signal
              series is badly wrong; the portfolio layer hides most of it.
            </p>
          </div>
        </div>
      </div>

      {asymmetric && (
        <Callout tone="note">
          With an upper alpha of {alphaUpper.toFixed(1)} and a lower alpha of{" "}
          {alphaLower.toFixed(1)}, the bandwidth is{" "}
          <strong>{(alphaUpper + alphaLower).toFixed(1)}σ</strong> and the dashed
          moving average is <em>not</em> halfway between the bands — it sits{" "}
          {alphaUpper > alphaLower ? "below" : "above"} the middle of the envelope.
        </Callout>
      )}

      <EquityChart
        strategy={result.value}
        benchmark={benchmark}
        dates={regime.dates}
        initialCash={CASH}
      />

      <Callout tone="warn">
        {DATA_NOTICE} The three regimes exist so you can see the same strategy win
        and lose without changing a single parameter — which is the real lesson of{" "}
        <Link href="/learn/pitfalls/" className="underline underline-offset-4">
          overfitting
        </Link>
        .
      </Callout>
    </div>
  );
}
