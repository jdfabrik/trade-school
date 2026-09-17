/**
 * The optimizer is the one module here without a printed answer in the guide to
 * check against, so it is pinned by properties instead: the constraints must
 * hold, and each objective must actually beat the alternatives at its own job.
 */
import { describe, it, expect } from "vitest";

import {
  projectToSimplex,
  minimizeRisk,
  maximizeSharpe,
  equalWeight,
} from "./optimize";
import { pctChange, dropna } from "./stats";
import { MONTHLY } from "@/data/index";

function monthlyReturns(names: string[]): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const n of names) out[n] = dropna(pctChange(MONTHLY.series[n]));
  return out;
}

const NAMES = Object.keys(MONTHLY.series).slice(0, 10);
const RF = 0.02 / 12;

describe("simplex projection", () => {
  it("returns non-negative weights that sum to one", () => {
    const p = projectToSimplex([0.5, -2, 3, 0.1]);
    expect(p.every((x) => x >= 0)).toBe(true);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it("leaves a vector already on the simplex untouched", () => {
    const already = [0.25, 0.25, 0.25, 0.25];
    const p = projectToSimplex(already);
    p.forEach((x, i) => expect(x).toBeCloseTo(already[i], 12));
  });

  it("handles the degenerate single-asset case", () => {
    expect(projectToSimplex([7])).toEqual([1]);
  });
});

describe("minimizeRisk", () => {
  const result = minimizeRisk(monthlyReturns(NAMES), { riskFreeRate: RF });

  it("respects the long-only, fully-invested constraints", () => {
    expect(result.weights.every((w) => w >= -1e-9)).toBe(true);
    expect(result.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8);
    expect(result.weights).toHaveLength(NAMES.length);
  });

  it("achieves lower risk than equal weighting — which is its whole job", () => {
    const naive = equalWeight(monthlyReturns(NAMES), { riskFreeRate: RF });
    expect(result.risk).toBeLessThan(naive.risk);
  });

  it("achieves lower risk than the max-Sharpe portfolio", () => {
    const sharpe = maximizeSharpe(monthlyReturns(NAMES), { riskFreeRate: RF });
    expect(result.risk).toBeLessThanOrEqual(sharpe.risk + 1e-9);
  });

  it("converges rather than running to the iteration ceiling", () => {
    expect(result.iterations).toBeLessThan(5000);
  });

  it("concentrates in the calmer assets", () => {
    // the generated tickers have known volatilities; the noisiest should get
    // less weight than the quietest
    const byWeight = Object.fromEntries(
      result.names.map((n, i) => [n, result.weights[i]]),
    );
    // ZFXTR is the lowest-vol asset in the generator, ZINDA the highest
    expect(byWeight.ZFXTR).toBeGreaterThan(byWeight.ZINDA);
  });
});

describe("maximizeSharpe", () => {
  const result = maximizeSharpe(monthlyReturns(NAMES), { riskFreeRate: RF });

  it("respects the long-only, fully-invested constraints", () => {
    expect(result.weights.every((w) => w >= -1e-9)).toBe(true);
    expect(result.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8);
  });

  it("achieves a higher Sharpe than equal weighting", () => {
    const naive = equalWeight(monthlyReturns(NAMES), { riskFreeRate: RF });
    expect(result.sharpe).toBeGreaterThan(naive.sharpe);
  });

  it("achieves a higher Sharpe than the minimum-risk portfolio", () => {
    const calm = minimizeRisk(monthlyReturns(NAMES), { riskFreeRate: RF });
    expect(result.sharpe).toBeGreaterThan(calm.sharpe);
  });

  it("the risk-free rate actually changes the answer", () => {
    const zero = maximizeSharpe(monthlyReturns(NAMES), { riskFreeRate: 0 });
    const high = maximizeSharpe(monthlyReturns(NAMES), { riskFreeRate: 0.02 });
    const moved = zero.weights.some((w, i) => Math.abs(w - high.weights[i]) > 1e-4);
    expect(moved).toBe(true);
  });

  it("converges rather than running to the iteration ceiling", () => {
    expect(result.iterations).toBeLessThan(5000);
  });
});

describe("weights convert to dollars the way the guide does", () => {
  it("composition * 25000 allocates the whole investment", () => {
    const result = minimizeRisk(monthlyReturns(NAMES), { riskFreeRate: RF });
    const dollars = result.weights.map((w) => w * 25_000);
    expect(dollars.reduce((a, b) => a + b, 0)).toBeCloseTo(25_000, 6);
  });
});
