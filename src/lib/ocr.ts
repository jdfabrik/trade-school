/**
 * Reading the prices printed on a chart screenshot.
 *
 * Be clear about what this is. It runs optical character recognition in the
 * browser and pulls out the NUMBERS on the image — axis labels, order lines,
 * whatever text the platform drew. It does not understand the chart. It cannot
 * tell a good setup from a bad one, cannot see where you actually entered, and
 * has no opinion about the trade.
 *
 * What it buys is the difference between typing six numbers and tapping three,
 * which is the difference between a journal someone keeps and one they abandon.
 * The trader always confirms which number is which.
 *
 * Everything happens on the device. The image is never uploaded, because there
 * is nowhere to upload it to.
 */

/** Plausible range for a traded price. Outside this it is not a price. */
const MIN_PRICE = 0.0001;
const MAX_PRICE = 10_000_000;

/** Most chips a person can usefully scan. */
const MAX_CANDIDATES = 24;

/**
 * Every number in the recognised text.
 *
 * OCR output is messy — stray pipes, hashes and punctuation — so this looks for
 * number-shaped runs rather than trying to tokenise properly.
 */
export function extractNumbers(text: string): number[] {
  if (!text) return [];
  const out: number[] = [];

  for (const match of text.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g)) {
    const value = Number(match[0].replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    if (value < MIN_PRICE || value > MAX_PRICE) continue;
    out.push(value);
  }

  return out;
}

/**
 * Which of those numbers are plausibly prices.
 *
 * A chart's price axis is a tight cluster of similar values; timestamps, volume,
 * and indicator periods are not. So the largest cluster of numbers that sit
 * within a common order of magnitude wins, and the scattered rest are dropped.
 */
export function priceCandidates(numbers: number[]): number[] {
  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  if (unique.length === 0) return [];
  if (unique.length <= 3) return unique;

  // Group values that sit within 25% of the group's lowest member. On a chart
  // the visible price range is almost always far tighter than that.
  const groups: number[][] = [];
  let current: number[] = [unique[0]];

  for (let i = 1; i < unique.length; i += 1) {
    const value = unique[i];
    const base = current[0];
    if (base > 0 && value <= base * 1.25) {
      current.push(value);
    } else {
      groups.push(current);
      current = [value];
    }
  }
  groups.push(current);

  // The biggest group is the price axis. Ties go to the tighter spread, which
  // is more axis-like than a coincidental run of round numbers.
  groups.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    const spread = (g: number[]) => (g[g.length - 1] - g[0]) / (g[0] || 1);
    return spread(a) - spread(b);
  });

  const best = groups[0];
  // A single-member "cluster" is no cluster at all; fall back to everything.
  const chosen = best.length >= 3 ? best : unique;
  return chosen.slice(0, MAX_CANDIDATES);
}

export type Side = "long" | "short";

/**
 * Once the entry is known, a stop can only be on one side of it and a target on
 * the other. Filtering the chips to the ones that could actually be right turns
 * a wall of numbers into a short, obvious choice.
 */
export function rolesFor(
  prices: number[],
  entry: number | null,
  side: Side,
): { stops: number[]; targets: number[] } {
  if (entry === null || !Number.isFinite(entry)) {
    return { stops: prices, targets: prices };
  }

  const below = prices.filter((p) => p < entry);
  const above = prices.filter((p) => p > entry);

  // Nearest first: a stop usually sits just beyond the level that would prove
  // the idea wrong, not at the far edge of the screen.
  const byCloseness = (a: number, b: number) =>
    Math.abs(a - entry) - Math.abs(b - entry);

  return side === "long"
    ? { stops: [...below].sort(byCloseness), targets: [...above].sort(byCloseness) }
    : { stops: [...above].sort(byCloseness), targets: [...below].sort(byCloseness) };
}

/* ------------------------------ the OCR run ------------------------------- */

export interface ChartRead {
  /** Everything the recogniser thought it saw. Useful when it goes wrong. */
  text: string;
  /** Numbers that look like prices, sorted. */
  prices: number[];
}

/**
 * Run OCR over an image in this browser.
 *
 * Loaded on demand rather than bundled into every page: the recogniser and its
 * language data are several megabytes, and most visits never need them.
 */
export async function readChart(
  image: Blob,
  onProgress?: (fraction: number) => void,
): Promise<ChartRead> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (onProgress && typeof m.progress === "number") onProgress(m.progress);
    },
  });

  try {
    const { data } = await worker.recognize(image);
    const text = data.text ?? "";
    return { text, prices: priceCandidates(extractNumbers(text)) };
  } finally {
    await worker.terminate();
  }
}
