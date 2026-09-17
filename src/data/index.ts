/**
 * Typed access to the bundled price data.
 *
 * All of it is SYNTHETIC and deterministic — see scripts/generate-series.mjs and
 * PROVENANCE.md for why. Anything rendering this data must say so on screen;
 * {@link DATA_NOTICE} is the one sentence to use.
 */
import seriesJson from "./series.json";
import monthlyJson from "./monthly.json";

export const DATA_NOTICE =
  "Generated data, not real market prices. Deterministic, so every number here is reproducible.";

export interface Regime {
  id: string;
  label: string;
  note: string;
  close: number[];
  dates: string[];
}

export const REGIMES: Regime[] = seriesJson.regimes.map((r) => ({
  id: r.id,
  label: r.label,
  note: r.note,
  close: r.close,
  dates: seriesJson.dates,
}));

export function regimeById(id: string): Regime | undefined {
  return REGIMES.find((r) => r.id === id);
}

export function defaultRegime(): Regime {
  return REGIMES[0];
}

export interface MonthlyTable {
  dates: string[];
  series: Record<string, number[]>;
  note: string;
}

export const MONTHLY: MonthlyTable = {
  dates: monthlyJson.dates,
  series: monthlyJson.series as Record<string, number[]>,
  note: monthlyJson.note,
};
