/**
 * Long-only mean-variance optimization — the part of skfolio the guide uses.
 *
 * `MeanRisk(objective_function=MINIMIZE_RISK, ...)` and its MAXIMIZE_RATIO
 * sibling, reimplemented in about eighty lines. skfolio hands the problem to a
 * proper convex solver; here it is projected gradient descent onto the simplex,
 * which is enough for the ten-to-fifteen asset portfolios this site shows and
 * keeps the whole thing running in the browser.
 *
 * The constraints are the ones skfolio applies by default: weights are
 * non-negative (no shorting) and sum to 1 (fully invested).
 */
import { covarianceMatrix, mean } from "./stats";

export interface Allocation {
  /** Weight per asset, in the order the names were given. Sums to 1. */
  weights: number[];
  names: string[];
  /** Portfolio expected return per period. */
  expectedReturn: number;
  /** Portfolio standard deviation per period. */
  risk: number;
  sharpe: number;
  /** How many gradient steps were taken; useful for spotting non-convergence. */
  iterations: number;
}

/**
 * Euclidean projection onto the probability simplex (Duchi et al. 2008).
 * Takes any vector and returns the closest one whose entries are non-negative
 * and sum to 1 — which is how the constraints get enforced at every step.
 */
export function projectToSimplex(v: number[]): number[] {
  const n = v.length;
  if (n === 0) return [];
  const sorted = [...v].sort((a, b) => b - a);

  let cumulative = 0;
  let rho = 0;
  let theta = 0;
  for (let i = 0; i < n; i += 1) {
    cumulative += sorted[i];
    const candidate = (cumulative - 1) / (i + 1);
    if (sorted[i] - candidate > 0) {
      rho = i + 1;
      theta = candidate;
    }
  }
  if (rho === 0) theta = (cumulative - 1) / n;

  return v.map((x) => Math.max(0, x - theta));
}

function portfolioVariance(weights: number[], cov: number[][]): number {
  let total = 0;
  for (let i = 0; i < weights.length; i += 1) {
    for (let j = 0; j < weights.length; j += 1) {
      total += weights[i] * cov[i][j] * weights[j];
    }
  }
  return Math.max(total, 0);
}

function covGradient(weights: number[], cov: number[][]): number[] {
  return weights.map((_, i) => {
    let acc = 0;
    for (let j = 0; j < weights.length; j += 1) acc += cov[i][j] * weights[j];
    return 2 * acc;
  });
}

function dot(a: number[], b: number[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) total += a[i] * b[i];
  return total;
}

function describe(
  weights: number[],
  names: string[],
  mus: number[],
  cov: number[][],
  riskFreeRate: number,
  iterations: number,
): Allocation {
  const expected = dot(weights, mus);
  const risk = Math.sqrt(portfolioVariance(weights, cov));
  return {
    weights,
    names,
    expectedReturn: expected,
    risk,
    sharpe: risk === 0 ? NaN : (expected - riskFreeRate) / risk,
    iterations,
  };
}

export interface OptimizeOptions {
  /** Periodic risk-free rate. Required for the Sharpe objective. */
  riskFreeRate?: number;
  maxIterations?: number;
  stepSize?: number;
  tolerance?: number;
}

/**
 * MINIMIZE_RISK. Needs no risk-free rate — there is no ratio being formed, which
 * is exactly why skfolio does not ask for one here.
 */
export function minimizeRisk(
  returns: Record<string, number[]>,
  options: OptimizeOptions = {},
): Allocation {
  const names = Object.keys(returns);
  const series = names.map((n) => returns[n]);
  const cov = covarianceMatrix(series);
  const mus = series.map((s) => mean(s));

  const maxIterations = options.maxIterations ?? 5000;
  const tolerance = options.tolerance ?? 1e-12;
  // scale the step to the size of the covariance entries, or it either crawls
  // or diverges depending on whether returns are daily or monthly
  const scale = Math.max(...cov.map((row) => Math.max(...row.map(Math.abs))), 1e-9);
  let step = options.stepSize ?? 1 / (8 * scale);

  let weights = names.map(() => 1 / names.length);
  let value = portfolioVariance(weights, cov);
  let iterations = 0;

  for (let i = 0; i < maxIterations; i += 1) {
    iterations = i + 1;
    const candidate = projectToSimplex(
      weights.map((w, k) => w - step * covGradient(weights, cov)[k]),
    );
    const candidateValue = portfolioVariance(candidate, cov);

    if (candidateValue > value) {
      // overshot — halve the step and try again from where we were
      step /= 2;
      if (step < 1e-18) break;
      continue;
    }
    if (value - candidateValue < tolerance) {
      weights = candidate;
      break;
    }
    weights = candidate;
    value = candidateValue;
  }

  return describe(weights, names, mus, cov, options.riskFreeRate ?? 0, iterations);
}

/**
 * MAXIMIZE_RATIO — the maximum-Sharpe portfolio. This one genuinely requires a
 * risk-free rate, because the Sharpe ratio is defined in terms of it.
 */
export function maximizeSharpe(
  returns: Record<string, number[]>,
  options: OptimizeOptions = {},
): Allocation {
  const riskFreeRate = options.riskFreeRate ?? 0;
  const names = Object.keys(returns);
  const series = names.map((n) => returns[n]);
  const cov = covarianceMatrix(series);
  const mus = series.map((s) => mean(s));

  const maxIterations = options.maxIterations ?? 5000;
  const tolerance = options.tolerance ?? 1e-14;

  const ratio = (w: number[]) => {
    const sd = Math.sqrt(portfolioVariance(w, cov));
    if (sd === 0) return -Infinity;
    return (dot(w, mus) - riskFreeRate) / sd;
  };

  /** d/dw of (w'mu - rf) / sqrt(w'Sw). */
  const gradient = (w: number[]) => {
    const variance = portfolioVariance(w, cov);
    const sd = Math.sqrt(variance);
    if (sd === 0) return w.map(() => 0);
    const excess = dot(w, mus) - riskFreeRate;
    const covGrad = covGradient(w, cov); // = 2*S*w
    return w.map((_, i) => (mus[i] * sd - (excess * covGrad[i]) / (2 * sd)) / variance);
  };

  let weights = names.map(() => 1 / names.length);
  let value = ratio(weights);
  let step = 0.05;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i += 1) {
    iterations = i + 1;
    const g = gradient(weights);
    const candidate = projectToSimplex(weights.map((w, k) => w + step * g[k]));
    const candidateValue = ratio(candidate);

    if (candidateValue < value) {
      step /= 2;
      if (step < 1e-16) break;
      continue;
    }
    if (candidateValue - value < tolerance) {
      weights = candidate;
      break;
    }
    weights = candidate;
    value = candidateValue;
  }

  return describe(weights, names, mus, cov, riskFreeRate, iterations);
}

/** Equal weight across every asset — the benchmark any optimizer should beat. */
export function equalWeight(
  returns: Record<string, number[]>,
  options: OptimizeOptions = {},
): Allocation {
  const names = Object.keys(returns);
  const series = names.map((n) => returns[n]);
  return describe(
    names.map(() => 1 / names.length),
    names,
    series.map((s) => mean(s)),
    covarianceMatrix(series),
    options.riskFreeRate ?? 0,
    0,
  );
}
