/**
 * These tests pin the engine to the worked examples printed in the source study
 * guide. If one of them fails, the site is teaching something the guide does not
 * say — which is the only failure mode that really matters here.
 */
import { describe, it, expect } from "vitest";

import { mean, stdDev, pctChange, rollingMean, rollingStd } from "./stats";
import {
  simpleReturn,
  expectedReturn,
  risk,
  riskPremium,
  sharpe,
  annualToMonthlyRf,
  cumulativeToPct,
  feeFromPercent,
  windowInBars,
} from "./metrics";
import {
  bbands,
  crossedBelow,
  crossedAbove,
  below,
  above,
  bandwidth,
  countTrue,
} from "./bollinger";
import { fromSignals, buyAndHold } from "./backtest";

describe("worked examples from the guide", () => {
  it("Agilent: (138.857 - 148.745) / 148.745 = -6.65%", () => {
    const r = simpleReturn(148.745, 138.857);
    expect(r * 100).toBeCloseTo(-6.65, 2);
  });

  it("Sharpe: (0.0919 - 0.02/12) / 0.14 = 0.645", () => {
    const rf = annualToMonthlyRf(0.02);
    expect(rf).toBeCloseTo(0.0016667, 6);
    expect(sharpe(0.0919, rf, 0.14)).toBeCloseTo(0.645, 3);
  });

  it("bandwidth: alphas 3.6 and 3.1 give 6.7 sigma", () => {
    expect(bandwidth(3.6, 3.1, 1)).toBeCloseTo(6.7, 10);
    expect(bandwidth(3.6, 3.1, 2.5)).toBeCloseTo(16.75, 10);
  });

  it("window: 75-minute MA on 5-minute bars is 15 periods; 100-minute is 20", () => {
    expect(windowInBars(75, 5)).toBe(15);
    expect(windowInBars(100, 5)).toBe(20);
  });

  it("cumulative 1.00794 is +0.794%", () => {
    expect(cumulativeToPct(1.00794)).toBeCloseTo(0.794, 3);
  });

  it("0.1% converts to 0.001, not 0.01 or 0.1", () => {
    expect(feeFromPercent(0.1)).toBeCloseTo(0.001, 10);
    expect(feeFromPercent(2)).toBeCloseTo(0.02, 10);
  });

  it("risk premium is expected return minus the risk-free rate", () => {
    expect(riskPremium(0.0919, 0.0016667)).toBeCloseTo(0.0902333, 7);
  });
});

describe("stats mirror pandas semantics", () => {
  it("pct_change leaves a NaN in the first slot", () => {
    const out = pctChange([100, 110, 99]);
    expect(out).toHaveLength(3);
    expect(Number.isNaN(out[0])).toBe(true);
    expect(out[1]).toBeCloseTo(0.1, 10);
    expect(out[2]).toBeCloseTo(-0.1, 10);
  });

  it("mean is the arithmetic average", () => {
    expect(mean([1, 2, 3, 4])).toBeCloseTo(2.5, 10);
  });

  it("stdDev defaults to the sample SD (ddof=1) like pandas .std()", () => {
    // population SD of [2,4,4,4,5,5,7,9] is 2; sample SD is ~2.138
    const xs = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(stdDev(xs)).toBeCloseTo(2.13809, 4);
    expect(stdDev(xs, 0)).toBeCloseTo(2, 10);
  });

  it("rolling windows leave window-1 NaNs at the head", () => {
    const xs = [1, 2, 3, 4, 5];
    const m = rollingMean(xs, 3);
    expect(m.slice(0, 2).every(Number.isNaN)).toBe(true);
    expect(m[2]).toBeCloseTo(2, 10);
    expect(m[4]).toBeCloseTo(4, 10);

    const s = rollingStd(xs, 3, 0);
    expect(s.slice(0, 2).every(Number.isNaN)).toBe(true);
    expect(s[2]).toBeCloseTo(Math.sqrt(2 / 3), 10);
  });

  it("expectedReturn and risk are just mean and SD of the returns", () => {
    const rs = [0.01, -0.02, 0.03];
    expect(expectedReturn(rs)).toBeCloseTo(mean(rs), 12);
    expect(risk(rs)).toBeCloseTo(stdDev(rs), 12);
  });
});

describe("Bollinger band construction", () => {
  const close = [10, 11, 12, 11, 10, 9, 10, 11, 12, 13, 12, 11];

  it("emits exactly window-1 leading NaNs, so bands start at bar `window`", () => {
    const w = 5;
    const b = bbands(close, w, 2, 2);
    for (const series of [b.middle, b.upper, b.lower, b.sigma]) {
      expect(series.slice(0, w - 1).every(Number.isNaN)).toBe(true);
      expect(Number.isNaN(series[w - 1])).toBe(false);
      expect(series).toHaveLength(close.length);
    }
  });

  it("the middle band is a simple moving average, never a median or an SD", () => {
    const b = bbands(close, 3, 2, 2);
    expect(b.middle[2]).toBeCloseTo((10 + 11 + 12) / 3, 10);
    expect(b.middle[3]).toBeCloseTo((11 + 12 + 11) / 3, 10);
  });

  it("upper = MA + alphaUp*sigma and lower = MA - alphaLow*sigma", () => {
    const b = bbands(close, 4, 2, 2);
    const i = 7;
    expect(b.upper[i]).toBeCloseTo(b.middle[i] + 2 * b.sigma[i], 10);
    expect(b.lower[i]).toBeCloseTo(b.middle[i] - 2 * b.sigma[i], 10);
  });

  it("asymmetric alphas leave the middle band off-centre between the bands", () => {
    const b = bbands(close, 4, 3.6, 3.1);
    const i = 9;
    const midpoint = (b.upper[i] + b.lower[i]) / 2;
    expect(Math.abs(midpoint - b.middle[i])).toBeGreaterThan(1e-9);
    // and the gap is exactly (3.6 + 3.1) * sigma
    expect(b.upper[i] - b.lower[i]).toBeCloseTo(bandwidth(3.6, 3.1, b.sigma[i]), 10);
  });

  it("higher volatility widens the bands", () => {
    const calm = [10, 10.1, 10, 10.1, 10, 10.1, 10, 10.1];
    const wild = [10, 13, 8, 14, 7, 15, 6, 16];
    const bc = bbands(calm, 4, 2, 2);
    const bw = bbands(wild, 4, 2, 2);
    const last = calm.length - 1;
    expect(bw.upper[last] - bw.lower[last]).toBeGreaterThan(bc.upper[last] - bc.lower[last]);
  });
});

describe("crossing versus plain comparison", () => {
  // price sits below the band for several consecutive bars
  const price = [10, 9, 8, 7, 6, 11];
  const band = [9, 9, 9, 9, 9, 9];

  it("crossedBelow is true only on the transition bar", () => {
    const x = crossedBelow(price, band);
    expect(x).toEqual([false, false, true, false, false, false]);
  });

  it("crossedAbove is true only on the transition bar", () => {
    const x = crossedAbove(price, band);
    expect(x).toEqual([false, false, false, false, false, true]);
  });

  it("plain `<` fires on every bar the price sits outside the band", () => {
    expect(below(price, band)).toEqual([false, false, true, true, true, false]);
  });

  it("crossing fires strictly fewer times than plain `<` on the same series", () => {
    expect(countTrue(crossedBelow(price, band))).toBeLessThan(countTrue(below(price, band)));
  });

  it("a NaN band value can never produce a signal", () => {
    const withNaN = [NaN, NaN, 9, 9, 9, 9];
    expect(crossedBelow(price, withNaN).slice(0, 3).every((v) => v === false)).toBe(true);
    expect(above(price, withNaN)[0]).toBe(false);
  });
});

describe("backtest position state machine", () => {
  const close = [100, 90, 95, 110, 105];

  it("never sells before its first buy", () => {
    // an exit signal fires on bar 0, before any entry
    const entries = [false, false, true, false, false];
    const exits = [true, false, false, true, false];
    const r = fromSignals(close, entries, exits, { fees: 0, initialCash: 1000 });
    expect(r.orders[0].side).toBe("buy");
    expect(r.orders[0].index).toBe(2);
  });

  it("alternates buy and sell, never two of a kind in a row", () => {
    const entries = [true, true, false, false, false];
    const exits = [false, false, false, true, true];
    const r = fromSignals(close, entries, exits, { fees: 0, initialCash: 1000 });
    const sides = r.orders.map((o) => o.side);
    for (let i = 1; i < sides.length; i += 1) {
      expect(sides[i]).not.toBe(sides[i - 1]);
    }
  });

  it("buying at 90 and selling at 110 with no fees returns 1000 -> 1222.22", () => {
    const entries = [false, true, false, false, false];
    const exits = [false, false, false, true, false];
    const r = fromSignals(close, entries, exits, { fees: 0, initialCash: 1000 });
    expect(r.finalValue).toBeCloseTo(1000 * (110 / 90), 6);
    expect(r.trades).toBe(1);
  });

  it("fees reduce the final value and are reported", () => {
    const entries = [false, true, false, false, false];
    const exits = [false, false, false, true, false];
    const free = fromSignals(close, entries, exits, { fees: 0, initialCash: 1000 });
    const paid = fromSignals(close, entries, exits, { fees: 0.001, initialCash: 1000 });
    expect(paid.finalValue).toBeLessThan(free.finalValue);
    expect(paid.totalFees).toBeGreaterThan(0);
    expect(free.totalFees).toBe(0);
  });

  it("more signals means more fee drag — the guide's warning about `<`", () => {
    const price = [100, 99, 98, 97, 96, 120];
    const band = [99.5, 99.5, 99.5, 99.5, 99.5, 99.5];
    const upper = [119, 119, 119, 119, 119, 119];

    const crossBuys = crossedBelow(price, band);
    const naiveBuys = below(price, band);
    const sells = crossedAbove(price, upper);

    const a = fromSignals(price, crossBuys, sells, { fees: 0.01, initialCash: 1000 });
    const b = fromSignals(price, naiveBuys, sells, { fees: 0.01, initialCash: 1000 });
    expect(b.orders.length).toBeGreaterThanOrEqual(a.orders.length);
    expect(b.totalFees).toBeGreaterThanOrEqual(a.totalFees);
  });

  it("an open position at the end is marked to market", () => {
    const entries = [false, true, false, false, false];
    const exits = [false, false, false, false, false];
    const r = fromSignals(close, entries, exits, { fees: 0, initialCash: 1000 });
    expect(r.finalValue).toBeCloseTo(1000 * (105 / 90), 6);
    expect(r.openAtEnd).toBe(true);
  });

  it("buyAndHold is the passive benchmark line", () => {
    const v = buyAndHold(close, { initialCash: 1000, fees: 0 });
    expect(v[0]).toBeCloseTo(1000, 6);
    expect(v[v.length - 1]).toBeCloseTo(1000 * (105 / 100), 6);
  });

  it("cumulative return series starts at 1", () => {
    const entries = [false, true, false, false, false];
    const exits = [false, false, false, true, false];
    const r = fromSignals(close, entries, exits, { fees: 0, initialCash: 1000 });
    expect(r.cumReturns[0]).toBeCloseTo(1, 10);
    expect(cumulativeToPct(r.cumReturns[r.cumReturns.length - 1])).toBeCloseTo(
      (r.finalValue / 1000 - 1) * 100,
      6,
    );
  });
});
