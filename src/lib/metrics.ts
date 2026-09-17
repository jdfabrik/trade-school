/**
 * The formulas the guide asks you to memorise, each as one named function.
 *
 * Every one of these is pinned by a test against the guide's own worked answer,
 * so a sign error here fails the suite rather than quietly teaching the wrong
 * thing to someone learning this for the first time.
 */
import { mean, stdDev } from "./stats";

/** (Ending value - Beginning value) / Beginning value. */
export function simpleReturn(begin: number, end: number): number {
  if (!Number.isFinite(begin) || begin === 0) return NaN;
  return (end - begin) / begin;
}

/** The long-run arithmetic average of the periodic returns. */
export function expectedReturn(returns: number[]): number {
  return mean(returns);
}

/** Risk is the standard deviation of the returns. Higher SD = more volatile. */
export function risk(returns: number[], ddof = 1): number {
  return stdDev(returns, ddof);
}

/** Expected return minus the risk-free rate: the predicted reward for taking risk. */
export function riskPremium(expected: number, riskFreeRate: number): number {
  return expected - riskFreeRate;
}

/** Risk premium per unit of risk. Bigger is better risk-adjusted performance. */
export function sharpe(expected: number, riskFreeRate: number, sd: number): number {
  if (!Number.isFinite(sd) || sd === 0) return NaN;
  return (expected - riskFreeRate) / sd;
}

/** Sharpe computed straight from a return series. */
export function sharpeFromReturns(returns: number[], riskFreeRate: number, ddof = 1): number {
  return sharpe(expectedReturn(returns), riskFreeRate, risk(returns, ddof));
}

/** A 2% annual risk-free rate is 0.02/12 monthly. Not 0.02, and not 2/12. */
export function annualToMonthlyRf(annualRate: number): number {
  return annualRate / 12;
}

/** A cumulative value of 1.00794 means +0.794% profit. */
export function cumulativeToPct(cumulative: number): number {
  return (cumulative - 1) * 100;
}

/** 0.1% is 0.001 — not 0.01, and not 0.1. The most expensive typo in the unit. */
export function feeFromPercent(percent: number): number {
  return percent / 100;
}

/**
 * A moving-average window is counted in BARS, not minutes: minutes wanted
 * divided by minutes per bar. A 75-minute MA on 5-minute bars is `window=15`.
 */
export function windowInBars(minutesDesired: number, minutesPerBar: number): number {
  if (!Number.isFinite(minutesPerBar) || minutesPerBar === 0) return NaN;
  return minutesDesired / minutesPerBar;
}
