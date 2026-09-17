/**
 * Bollinger Bands and the signal logic built on them.
 *
 * The important thing this module gets right is the difference between a
 * CROSSING and a plain comparison. `crossedBelow` is true only on the bar where
 * the price transitions from at-or-above the band to below it. Plain `<` is true
 * on every bar the price sits outside the band, which fires far more signals,
 * pays far more fees, and is the classic wrong answer. Both are exported so the
 * site can show them side by side.
 */
import { rollingMean, rollingStd } from "./stats";

export interface Bands {
  /** Simple moving average of the previous `window` closes. Never a median. */
  middle: number[];
  /** middle + alphaUpper * sigma */
  upper: number[];
  /** middle - alphaLower * sigma */
  lower: number[];
  /** Rolling standard deviation over the same window. */
  sigma: number[];
}

/**
 * Build the bands. Alphas are independent: when they differ, the middle band is
 * NOT centred between the upper and lower bands, which the guide calls out.
 *
 * `ddof` defaults to 0 (population SD) to match how vectorbt builds the bands.
 */
export function bbands(
  close: number[],
  window: number,
  alphaUpper: number,
  alphaLower: number,
  ddof = 0,
): Bands {
  const middle = rollingMean(close, window);
  const sigma = rollingStd(close, window, ddof);
  const upper = middle.map((m, i) => m + alphaUpper * sigma[i]);
  const lower = middle.map((m, i) => m - alphaLower * sigma[i]);
  return { middle, upper, lower, sigma };
}

/** The distance between the bands: (alphaUpper + alphaLower) * sigma. */
export function bandwidth(alphaUpper: number, alphaLower: number, sigma: number): number {
  return (alphaUpper + alphaLower) * sigma;
}

function usable(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b);
}

/**
 * True only on the bar where `series` transitions from at-or-above `band` to
 * below it. This is vectorbt's `close_crossed_below`.
 */
export function crossedBelow(series: number[], band: number[]): boolean[] {
  return series.map((v, i) => {
    if (i === 0) return false;
    if (!usable(v, band[i]) || !usable(series[i - 1], band[i - 1])) return false;
    return series[i - 1] >= band[i - 1] && v < band[i];
  });
}

/** True only on the bar where `series` transitions from at-or-below `band` to above it. */
export function crossedAbove(series: number[], band: number[]): boolean[] {
  return series.map((v, i) => {
    if (i === 0) return false;
    if (!usable(v, band[i]) || !usable(series[i - 1], band[i - 1])) return false;
    return series[i - 1] <= band[i - 1] && v > band[i];
  });
}

/** Plain `<`: true on EVERY bar the price sits below the band. The wrong answer. */
export function below(series: number[], band: number[]): boolean[] {
  return series.map((v, i) => (usable(v, band[i]) ? v < band[i] : false));
}

/** Plain `>`: true on EVERY bar the price sits above the band. */
export function above(series: number[], band: number[]): boolean[] {
  return series.map((v, i) => (usable(v, band[i]) ? v > band[i] : false));
}

export function countTrue(xs: boolean[]): number {
  return xs.reduce((n, x) => (x ? n + 1 : n), 0);
}

export type SignalMode = "crossing" | "plain";

/** Build entry/exit signals in either mode, so the UI can toggle between them. */
export function signalsFor(close: number[], bands: Bands, mode: SignalMode) {
  return mode === "crossing"
    ? { entries: crossedBelow(close, bands.lower), exits: crossedAbove(close, bands.upper) }
    : { entries: below(close, bands.lower), exits: above(close, bands.upper) };
}
