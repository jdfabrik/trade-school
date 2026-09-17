/**
 * The labs claim that mean reversion wins in a choppy market and loses in a
 * trend. That is a teaching claim, so it gets checked against the actual bundled
 * data rather than asserted in prose.
 *
 * The data is deterministic, so these numbers are stable.
 */
import { describe, it, expect } from "vitest";

import { REGIMES, MONTHLY, defaultRegime } from "./index";
import { bbands, signalsFor, countTrue } from "@/lib/bollinger";
import { fromSignals, buyAndHold } from "@/lib/backtest";
import { pctChange, dropna } from "@/lib/stats";

const WINDOW = 20;
const ALPHA = 2;
const FEES = 0.001;
const CASH = 10_000;

function run(close: number[], mode: "crossing" | "plain") {
  const bands = bbands(close, WINDOW, ALPHA, ALPHA);
  const { entries, exits } = signalsFor(close, bands, mode);
  return fromSignals(close, entries, exits, { fees: FEES, initialCash: CASH });
}

describe("bundled series are well formed", () => {
  it("every regime has one close per date and no gaps", () => {
    expect(REGIMES.length).toBeGreaterThanOrEqual(3);
    for (const r of REGIMES) {
      expect(r.close.length).toBe(r.dates.length);
      expect(r.close.every((p) => Number.isFinite(p) && p > 0)).toBe(true);
    }
  });

  it("the monthly asset table is rectangular", () => {
    const names = Object.keys(MONTHLY.series);
    expect(names.length).toBeGreaterThanOrEqual(10);
    for (const n of names) {
      expect(MONTHLY.series[n].length).toBe(MONTHLY.dates.length);
    }
  });

  it("monthly returns lose exactly one row to the pct_change NaN", () => {
    const prices = MONTHLY.series[Object.keys(MONTHLY.series)[0]];
    const returns = dropna(pctChange(prices));
    expect(returns.length).toBe(prices.length - 1);
  });
});

describe("the regimes teach what the site says they teach", () => {
  it("in the choppy regime the strategy beats buy-and-hold", () => {
    const r = REGIMES.find((x) => x.id === "choppy")!;
    const strategy = run(r.close, "crossing");
    const benchmark = buyAndHold(r.close, { fees: FEES, initialCash: CASH });
    expect(strategy.finalValue).toBeGreaterThan(benchmark[benchmark.length - 1]);
    expect(strategy.trades).toBeGreaterThan(2);
  });

  it("in the trending regime buy-and-hold beats the strategy", () => {
    const r = REGIMES.find((x) => x.id === "trending")!;
    const strategy = run(r.close, "crossing");
    const benchmark = buyAndHold(r.close, { fees: FEES, initialCash: CASH });
    expect(strategy.finalValue).toBeLessThan(benchmark[benchmark.length - 1]);
  });

  /**
   * Measured, not assumed. Plain `<` fires two to four times as many SIGNALS,
   * but `from_signals` ignores an entry while already long, so the number of
   * actual trades is usually identical — across the three regimes at window 20
   * and alpha 2 it is identical in every case.
   *
   * That makes the guide's "more trades, more fee drag" chain a simplification:
   * the mistake is real and the signal series is badly wrong, but the portfolio
   * layer absorbs most of it. The lab shows both counts so the learner sees
   * where the damage does and does not land.
   */
  it("plain comparisons fire far more signals than crossings", () => {
    for (const r of REGIMES) {
      const bands = bbands(r.close, WINDOW, ALPHA, ALPHA);
      const crossing = signalsFor(r.close, bands, "crossing");
      const plain = signalsFor(r.close, bands, "plain");
      expect(countTrue(plain.entries)).toBeGreaterThan(countTrue(crossing.entries));
      expect(countTrue(plain.exits)).toBeGreaterThan(countTrue(crossing.exits));
    }
  });

  it("but the position state machine means the trade count need not rise", () => {
    for (const r of REGIMES) {
      const crossing = run(r.close, "crossing");
      const plain = run(r.close, "plain");
      // never FEWER orders, though very often exactly the same number
      expect(plain.orders.length).toBeGreaterThanOrEqual(crossing.orders.length);
    }
  });

  it("the default regime is the choppy one, so the lab opens on a working strategy", () => {
    expect(defaultRegime().id).toBe("choppy");
  });
});
