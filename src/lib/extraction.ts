/**
 * What a screenshot is claimed to show, and how sure anyone is about it.
 *
 * The one rule this file exists to enforce: a value read off the image and a
 * value someone guessed must never be interchangeable. A grader that cannot
 * tell them apart will happily mark a trade on invented numbers, which is the
 * single most damaging thing this site could do.
 *
 * So `observed` carries a status, and the only function that hands back a bare
 * number requires the status to be "visible". Anything else has to be handled
 * deliberately.
 */

export type FieldStatus =
  /** Printed on the image and read directly. */
  | "visible"
  /** Worked out from something else on the image. Not the same as read. */
  | "inferred"
  /** Not on the image at all. */
  | "missing"
  /** Something is there and it could not be read. */
  | "unreadable";

/** Where on the image a value came from, as fractions of width and height. */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Observation<T> {
  status: FieldStatus;
  /** Only ever present when status is "visible" or "inferred". */
  value?: T;
  /** 0-1. The extractor's own confidence, which is not calibrated. */
  confidence: number;
  /** Where it was read from, when the extractor could say. */
  region?: Region;
  /** What the extractor says it saw, verbatim, for the trader to check. */
  sawText?: string;
  /** Why, when the status is inferred, missing or unreadable. */
  note?: string;
}

export interface ExtractedTrade {
  symbol: Observation<string>;
  direction: Observation<"long" | "short">;
  entry: Observation<number>;
  stop: Observation<number>;
  target: Observation<number>;
  exit: Observation<number>;
  size: Observation<number>;
  pnl: Observation<number>;
}

export type ExtractedField = keyof ExtractedTrade;

export const EXTRACTED_FIELDS: ExtractedField[] = [
  "symbol",
  "direction",
  "entry",
  "stop",
  "target",
  "exit",
  "size",
  "pnl",
];

export const FIELD_LABELS: Record<ExtractedField, string> = {
  symbol: "Ticker",
  direction: "Bought or sold",
  entry: "Got in at",
  stop: "Stop",
  target: "Target",
  exit: "Got out at",
  size: "Shares",
  pnl: "Profit or loss",
};

export interface Extraction {
  trade: ExtractedTrade;
  /** Things the extractor wants to flag rather than silently resolve. */
  issues: string[];
  /** What the extractor thought it was looking at. */
  platform?: string;
  /** Model and provider, recorded so a grade can say where its numbers came from. */
  provider: string;
  model: string;
  /** Rough cost of the call, when the provider reports usage. */
  usage?: { inputTokens: number; outputTokens: number; estimatedCents: number };
}

/* ------------------------------ guard rails ------------------------------- */

const EMPTY: Observation<never> = { status: "missing", confidence: 0 };

export function blankTrade(): ExtractedTrade {
  return {
    symbol: { ...EMPTY },
    direction: { ...EMPTY },
    entry: { ...EMPTY },
    stop: { ...EMPTY },
    target: { ...EMPTY },
    exit: { ...EMPTY },
    size: { ...EMPTY },
    pnl: { ...EMPTY },
  };
}

/**
 * The value, but only if it was actually read off the image.
 *
 * Deliberately awkward to get at. Everything that fills a form field or feeds a
 * grade should go through here, so an inferred or unreadable value cannot be
 * used by accident.
 */
export function visibleValue<T>(o: Observation<T> | undefined): T | null {
  if (!o || o.status !== "visible" || o.value === undefined) return null;
  return o.value;
}

/** Same guard, for walking a whole trade where the field types differ. */
export function visibleUnknown(o: Observation<unknown> | undefined): unknown {
  if (!o || o.status !== "visible" || o.value === undefined) return null;
  return o.value;
}

/**
 * The value if there is one at all, with its status, for showing to a person.
 *
 * Takes a widened Observation so a caller can walk every field of a trade
 * without narrowing each one first; the value comes back as the union, which is
 * what a display needs.
 */
export function anyValue(
  o: Observation<unknown> | undefined,
): { value: unknown; status: FieldStatus } | null {
  if (!o || o.value === undefined) return null;
  if (o.status === "missing" || o.status === "unreadable") return null;
  return { value: o.value, status: o.status };
}

/** Plain-English description of a status, for the confirmation screen. */
export function describeStatus(status: FieldStatus): string {
  switch (status) {
    case "visible":
      return "read off your screenshot";
    case "inferred":
      return "worked out, not read — check this one";
    case "unreadable":
      return "something is there but it could not be read";
    default:
      return "not on the screenshot";
  }
}

/**
 * Sanity-check an extraction against itself.
 *
 * A model will cheerfully return a long whose stop is above its entry. Catching
 * that here, before anything is graded, means the trader is asked rather than
 * quietly given a wrong number.
 */
export function contradictions(trade: ExtractedTrade): string[] {
  const out: string[] = [];

  // Use a value whether it was read or merely worked out — a contradiction is
  // worth flagging either way, and the trader is the one who resolves it.
  const dir = (visibleValue(trade.direction) ??
    (anyValue(trade.direction)?.value as "long" | "short" | undefined)) as
    | "long"
    | "short"
    | undefined;
  const num = (o: Observation<number>): number | undefined => {
    const v = visibleValue(o) ?? (anyValue(o)?.value as number | undefined);
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
  };
  const entry = num(trade.entry);
  const stop = num(trade.stop);
  const target = num(trade.target);

  if (dir && entry !== undefined && stop !== undefined) {
    const wrong = dir === "long" ? stop >= entry : stop <= entry;
    if (wrong) {
      out.push(
        `The stop it read (${stop}) is on the wrong side of the entry (${entry}) for a ${dir}. One of those is misread — check both.`,
      );
    }
  }
  if (dir && entry !== undefined && target !== undefined) {
    const wrong = dir === "long" ? target <= entry : target >= entry;
    if (wrong) {
      out.push(
        `The target it read (${target}) is on the wrong side of the entry (${entry}) for a ${dir}. Check both.`,
      );
    }
  }
  return out;
}

/** How much of the trade was genuinely read, as opposed to guessed or missing. */
export function evidenceSummary(trade: ExtractedTrade): {
  visible: number;
  inferred: number;
  missing: number;
  total: number;
} {
  let visible = 0;
  let inferred = 0;
  let missing = 0;
  for (const f of EXTRACTED_FIELDS) {
    const s = trade[f].status;
    if (s === "visible") visible += 1;
    else if (s === "inferred") inferred += 1;
    else missing += 1;
  }
  return { visible, inferred, missing, total: EXTRACTED_FIELDS.length };
}
