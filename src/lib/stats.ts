/**
 * Descriptive statistics, written to mirror pandas semantics so that what the
 * site shows matches what a learner's notebook would print.
 *
 * The NaN handling is deliberate, not sloppy: pandas `.pct_change()` really does
 * leave a NaN in the first slot, and a rolling window really is undefined until
 * it has `window` observations. Those NaNs are the reason the guide insists on
 * two `dropna()` calls, so the site reproduces them rather than hiding them.
 */

/** Arithmetic mean. This is what pandas `.mean()` computes. */
export function mean(xs: number[]): number {
  const clean = xs.filter(Number.isFinite);
  if (clean.length === 0) return NaN;
  let total = 0;
  for (const x of clean) total += x;
  return total / clean.length;
}

/**
 * Standard deviation.
 *
 * `ddof` is the delta degrees of freedom. Pandas `.std()` defaults to 1 (the
 * sample SD), numpy `.std()` defaults to 0 (the population SD). The guide's
 * "risk" is a pandas `.std()`, so 1 is the default here; the rolling bands use 0
 * to match how vectorbt builds them.
 */
export function stdDev(xs: number[], ddof = 1): number {
  const clean = xs.filter(Number.isFinite);
  const n = clean.length;
  if (n - ddof <= 0) return NaN;
  const m = mean(clean);
  let sumSq = 0;
  for (const x of clean) sumSq += (x - m) ** 2;
  return Math.sqrt(sumSq / (n - ddof));
}

/** Variance, same `ddof` convention as {@link stdDev}. */
export function variance(xs: number[], ddof = 1): number {
  return stdDev(xs, ddof) ** 2;
}

/**
 * Proportional change from each element to the next, as pandas `.pct_change()`
 * does — including the leading NaN, which is the single most commonly forgotten
 * detail in the whole workflow.
 */
export function pctChange(xs: number[]): number[] {
  const out: number[] = new Array(xs.length);
  out[0] = NaN;
  for (let i = 1; i < xs.length; i += 1) {
    const prev = xs[i - 1];
    out[i] = Number.isFinite(prev) && prev !== 0 ? (xs[i] - prev) / prev : NaN;
  }
  return out;
}

/** Drop NaN entries — the array equivalent of `.dropna()` with the default axis. */
export function dropna(xs: number[]): number[] {
  return xs.filter(Number.isFinite);
}

/** Simple moving average over a trailing window; first `window - 1` slots are NaN. */
export function rollingMean(xs: number[], window: number): number[] {
  const out: number[] = new Array(xs.length).fill(NaN);
  if (window < 1) return out;
  for (let i = window - 1; i < xs.length; i += 1) {
    const slice = xs.slice(i - window + 1, i + 1);
    out[i] = slice.every(Number.isFinite) ? mean(slice) : NaN;
  }
  return out;
}

/** Rolling standard deviation; first `window - 1` slots are NaN. */
export function rollingStd(xs: number[], window: number, ddof = 0): number[] {
  const out: number[] = new Array(xs.length).fill(NaN);
  if (window < 1) return out;
  for (let i = window - 1; i < xs.length; i += 1) {
    const slice = xs.slice(i - window + 1, i + 1);
    out[i] = slice.every(Number.isFinite) ? stdDev(slice, ddof) : NaN;
  }
  return out;
}

/** Covariance matrix of a set of equal-length return series. */
export function covarianceMatrix(series: number[][], ddof = 1): number[][] {
  const k = series.length;
  const means = series.map((s) => mean(s));
  const n = series[0]?.length ?? 0;
  const out: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let a = 0; a < k; a += 1) {
    for (let b = a; b < k; b += 1) {
      let acc = 0;
      for (let t = 0; t < n; t += 1) {
        acc += (series[a][t] - means[a]) * (series[b][t] - means[b]);
      }
      const cov = acc / (n - ddof);
      out[a][b] = cov;
      out[b][a] = cov;
    }
  }
  return out;
}
