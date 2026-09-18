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

export interface ReadWord {
  text: string;
  /** 0-100, the recogniser's own confidence in this word. */
  confidence: number;
}

export interface ChartRead {
  /** Everything the recogniser thought it saw. Useful when it goes wrong. */
  text: string;
  /** Numbers that look like prices, sorted. */
  prices: number[];
  /** Every word with its confidence, so a caller can judge the read. */
  words: ReadWord[];
  /** Mean confidence across the words that became price candidates. */
  meanConfidence: number;
}

/**
 * Below this, a read is not worth showing to a trader.
 *
 * Measured, not guessed: on realistic dark-theme screenshots with small axis
 * labels the recogniser returns confidently-shaped but WRONG numbers, and the
 * only signal separating those from good reads is this score. A wrong price
 * offered as a suggestion is worse than no suggestion, because the trader taps
 * it into their own journal.
 */
export const MIN_WORD_CONFIDENCE = 75;

/**
 * Roughly what the recogniser weighs on first use, in megabytes.
 *
 * Worth telling people before it starts: it is a real download on a phone.
 * After the first run the browser caches it and reading is near-instant.
 */
export const READER_DOWNLOAD_MB = 11;

/**
 * Everything the recogniser needs is served from this site, not from a public
 * CDN.
 *
 * That matters more than it looks. The site tells people their screenshot never
 * leaves their computer, and by default this library fetches its engine and
 * language data from a third party — which would have meant their browser
 * announcing itself to someone else the moment they opened the journal. Serving
 * it here keeps the claim true.
 */
function assetPaths() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return {
    workerPath: `${base}/ocr/worker.min.js`,
    corePath: `${base}/ocr/`,
    langPath: `${base}/ocr/lang`,
  };
}

/**
 * Run OCR over an image in this browser.
 *
 * Loaded on demand rather than bundled into every page: most visits never need
 * it, and it is several megabytes.
 */
/** Pull the per-word confidences out of whatever shape the result takes. */
function collectWords(data: unknown): ReadWord[] {
  const out: ReadWord[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (typeof n.text === "string" && typeof n.confidence === "number" && !Array.isArray(n.words)) {
      out.push({ text: n.text, confidence: n.confidence });
    }
    for (const key of ["blocks", "paragraphs", "lines", "words", "symbols"]) {
      const child = n[key];
      if (Array.isArray(child)) for (const c of child) visit(c);
    }
  };
  visit(data);
  return out;
}

export async function readChart(
  image: Blob,
  onProgress?: (fraction: number) => void,
): Promise<ChartRead> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", undefined, {
    ...assetPaths(),
    logger: (m: { status: string; progress: number }) => {
      if (onProgress && typeof m.progress === "number") onProgress(m.progress);
    },
  });

  try {
    const { data } = await worker.recognize(image);
    const text = data.text ?? "";
    const words: ReadWord[] = collectWords(data);
    const trusted = words.filter((w) => w.confidence >= MIN_WORD_CONFIDENCE);
    const numbers = extractNumbers(trusted.map((w) => w.text).join(" "));
    const prices = priceCandidates(numbers);
    const used = trusted.filter((w) => /\d/.test(w.text));
    const meanConfidence =
      used.length === 0
        ? 0
        : used.reduce((n, w) => n + w.confidence, 0) / used.length;
    return { text, prices, words, meanConfidence };
  } finally {
    await worker.terminate();
  }
}
