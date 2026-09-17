/**
 * Typed access to the bundled price data.
 *
 * All of it is SYNTHETIC and deterministic — see scripts/generate-series.mjs and
 * PROVENANCE.md for why. Anything rendering this data must say so on screen;
 * {@link DATA_NOTICE} is the one sentence to use.
 */
import seriesJson from "./series.json";

export const DATA_NOTICE =
  "These are made-up prices for practice, not a real market. The charts are the same every time you come back, so you can compare one attempt with the next.";

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

/*
 * `monthly.json` is not imported here on purpose. It was written for the
 * portfolio and asset-selection labs, which no longer exist, and nothing on the
 * site reads it. Importing it put all 15 series into the chart drill's client
 * chunk — JSON is not tree-shaken away once a module in the graph names it.
 * Anything that needs it again should import it where it is used.
 */
