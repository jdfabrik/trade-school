/**
 * Generates the deterministic synthetic price data the labs run on.
 *
 * WHY SYNTHETIC: Yahoo's chart API returns HTTP 429 from this machine, and the
 * one free CSV alternative sits behind a JavaScript bot check. Rather than ship
 * nothing, the labs run on generated series that are LABELLED AS GENERATED
 * everywhere they appear. `scripts/fetch-prices.mjs` remains the real-data path
 * for whenever the network cooperates.
 *
 * Synthetic data also buys something real data would not: three deliberately
 * different market regimes. Mean reversion wins in the choppy one and loses
 * badly in the trending one, which is the whole lesson of unit 2.3 — a strategy
 * that looks brilliant on one stretch of history can be worthless on another.
 *
 * Every number is produced by a seeded PRNG, so the output never changes and the
 * tests that pin it stay valid.
 *
 *   node scripts/generate-series.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT_DIR = resolve(import.meta.dirname, "../src/data");

/** mulberry32 — small, fast, and identical on every machine. */
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller, so the shocks are normal rather than uniform. */
function gaussian(next) {
  let u = 0;
  let v = 0;
  while (u === 0) u = next();
  while (v === 0) v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function businessDays(count, startISO) {
  const dates = [];
  const d = new Date(startISO + "T00:00:00Z");
  while (dates.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

/**
 * An Ornstein-Uhlenbeck-ish process in log space. `reversion` pulls the price
 * back toward a slowly drifting anchor, so raising it produces the choppy,
 * band-friendly behaviour and dropping it to zero produces a pure random walk
 * with drift.
 */
function makeSeries({ seed, n, start, drift, vol, reversion, volOfVol = 0 }) {
  const next = rng(seed);
  const out = [];
  let logPrice = Math.log(start);
  let anchor = logPrice;
  let currentVol = vol;

  for (let i = 0; i < n; i += 1) {
    anchor += drift;
    if (volOfVol > 0) {
      // let volatility itself wander, so the bands visibly breathe
      currentVol = Math.max(0.004, currentVol + volOfVol * gaussian(next));
    }
    const pull = reversion * (anchor - logPrice);
    logPrice += pull + currentVol * gaussian(next);
    out.push(Number(Math.exp(logPrice).toFixed(4)));
  }
  return out;
}

const N = 520; // roughly two years of trading days
const dates = businessDays(N, "2024-01-01");

const REGIMES = [
  {
    id: "choppy",
    label: "Choppy / range-bound",
    note: "Mean reversion's home turf. Price oscillates around a slowly rising anchor, so lower-band dips tend to bounce.",
    series: makeSeries({
      seed: 20260917,
      n: N,
      start: 100,
      drift: 0.0003,
      vol: 0.016,
      reversion: 0.06,
      volOfVol: 0.0004,
    }),
  },
  {
    id: "trending",
    label: "Strong uptrend",
    note: "The regime that breaks the strategy. Price grinds upward, so every sell at the upper band takes you out of a rally you never get back into.",
    series: makeSeries({
      seed: 777001,
      n: N,
      start: 100,
      drift: 0.0022,
      vol: 0.014,
      reversion: 0.015,
      volOfVol: 0.0002,
    }),
  },
  {
    id: "crash",
    label: "Volatile, with a crash",
    note: "High volatility and a deep drawdown in the middle. Watch the bands flare open and the signals dry up exactly when you most want them.",
    series: (() => {
      const base = makeSeries({
        seed: 424242,
        n: N,
        start: 140,
        drift: 0.0008,
        vol: 0.022,
        reversion: 0.03,
        volOfVol: 0.0009,
      });
      // superimpose a drawdown and recovery over the middle third
      return base.map((p, i) => {
        const t = i / (N - 1);
        const shock =
          t > 0.3 && t < 0.72
            ? -0.38 * Math.sin(((t - 0.3) / 0.42) * Math.PI)
            : 0;
        return Number((p * Math.exp(shock)).toFixed(4));
      });
    })(),
  },
];

await mkdir(OUT_DIR, { recursive: true });

await writeFile(
  resolve(OUT_DIR, "series.json"),
  JSON.stringify({
    kind: "synthetic",
    generatedBy: "scripts/generate-series.mjs",
    note: "Generated, not real market prices. Deterministic — the same seeds always produce the same numbers.",
    dates,
    regimes: REGIMES.map((r) => ({
      id: r.id,
      label: r.label,
      note: r.note,
      close: r.series,
    })),
  }) + "\n",
  "utf8",
);
console.log(`wrote series.json — ${REGIMES.length} regimes × ${N} bars`);

/* ---------- monthly series for the asset-selection and portfolio labs ---------- */

/*
 * Every name is prefixed with Z and drawn from the NATO alphabet, so it is
 * obvious at a glance that these are fabricated and none of them collides with
 * a real listed ticker. An earlier draft used plausible-looking four-letter
 * names and two of them turned out to be real companies.
 */
const ASSETS = [
  { name: "ZALFA", seed: 11, start: 42, drift: 0.021, vol: 0.075 },
  { name: "ZBRVO", seed: 22, start: 118, drift: 0.017, vol: 0.052 },
  { name: "ZCHRL", seed: 33, start: 76, drift: 0.026, vol: 0.112 },
  { name: "ZDLTA", seed: 44, start: 205, drift: 0.008, vol: 0.038 },
  { name: "ZECHO", seed: 55, start: 31, drift: 0.031, vol: 0.138 },
  { name: "ZFXTR", seed: 66, start: 64, drift: 0.004, vol: 0.029 },
  { name: "ZGOLF", seed: 77, start: 152, drift: 0.019, vol: 0.061 },
  { name: "ZHOTL", seed: 88, start: 88, drift: 0.012, vol: 0.044 },
  { name: "ZINDA", seed: 99, start: 27, drift: 0.034, vol: 0.161 },
  { name: "ZJULT", seed: 110, start: 134, drift: 0.015, vol: 0.057 },
  { name: "ZKILO", seed: 121, start: 59, drift: 0.022, vol: 0.089 },
  { name: "ZLIMA", seed: 132, start: 96, drift: 0.006, vol: 0.033 },
  { name: "ZMIKE", seed: 143, start: 173, drift: 0.028, vol: 0.101 },
  { name: "ZNOVM", seed: 154, start: 48, drift: 0.010, vol: 0.047 },
  { name: "ZOSCR", seed: 165, start: 111, drift: 0.024, vol: 0.072 },
];

const MONTHS = 36;
const monthDates = Array.from({ length: MONTHS }, (_, i) => {
  const d = new Date(Date.UTC(2023, i, 1));
  return d.toISOString().slice(0, 10);
});

const series = {};
for (const a of ASSETS) {
  series[a.name] = makeSeries({
    seed: a.seed,
    n: MONTHS,
    start: a.start,
    drift: a.drift,
    vol: a.vol,
    reversion: 0,
  });
}

await writeFile(
  resolve(OUT_DIR, "monthly.json"),
  JSON.stringify({
    kind: "synthetic",
    generatedBy: "scripts/generate-series.mjs",
    note: "Generated tickers, not real companies. The Z-prefixed names are fabricated so none of them collides with a real listed ticker.",
    interval: "1mo",
    dates: monthDates,
    series,
  }) + "\n",
  "utf8",
);
console.log(`wrote monthly.json — ${ASSETS.length} assets × ${MONTHS} months`);
