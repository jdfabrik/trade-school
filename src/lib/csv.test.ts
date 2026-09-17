/**
 * CSV import.
 *
 * The journal exports to CSV as insurance against browser-only storage, but
 * until now there was no way back in — which made the insurance worthless. A
 * trader who clears their browser data should be able to restore what they had.
 */
import { describe, it, expect } from "vitest";

import { toCsv, fromCsv, blankTrade } from "./journal";
import type { Trade } from "./trade";

function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    ...blankTrade(),
    id: "trade-1",
    date: "2026-09-10",
    symbol: "ABC",
    direction: "long",
    accountSize: 25_000,
    entry: 100,
    stop: 99,
    target: 103,
    size: 250,
    exit: 103,
    exitReason: "target",
    setup: "Opening range breakout",
    planNote: "Broke the range high on volume.",
    stopMovedAgainst: false,
    tradesToday: 2,
    minutesSincePriorLoss: null,
    ...overrides,
  };
}

describe("round trip", () => {
  it("survives an export and re-import unchanged", () => {
    const original = [
      trade({ id: "a", symbol: "AAA" }),
      trade({ id: "b", symbol: "BBB", direction: "short", stop: 101, target: 97, exit: 97 }),
    ];
    const { trades, errors } = fromCsv(toCsv(original));
    expect(errors).toEqual([]);
    expect(trades).toHaveLength(2);
    for (const field of [
      "id",
      "date",
      "symbol",
      "direction",
      "accountSize",
      "entry",
      "stop",
      "target",
      "size",
      "exit",
      "exitReason",
      "setup",
      "planNote",
      "stopMovedAgainst",
      "tradesToday",
      "minutesSincePriorLoss",
    ] as const) {
      expect(trades[0][field], field).toEqual(original[0][field]);
      expect(trades[1][field], field).toEqual(original[1][field]);
    }
  });

  it("carries the id, so re-importing the same file does not duplicate trades", () => {
    const csv = toCsv([trade({ id: "keep-me" })]);
    expect(csv.split("\n")[0]).toContain("id");
    expect(fromCsv(csv).trades[0].id).toBe("keep-me");
  });

  it("keeps a missing stop, target or exit as missing rather than zero", () => {
    const { trades } = fromCsv(
      toCsv([trade({ stop: null, target: null, exit: null, exitReason: "open" })]),
    );
    expect(trades[0].stop).toBeNull();
    expect(trades[0].target).toBeNull();
    expect(trades[0].exit).toBeNull();
    expect(trades[0].exitReason).toBe("open");
  });

  it("survives a note containing commas, quotes and newlines", () => {
    const note = 'broke out, then retested "the" high\nand held above it';
    const { trades, errors } = fromCsv(toCsv([trade({ planNote: note })]));
    expect(errors).toEqual([]);
    expect(trades[0].planNote).toBe(note);
  });

  it("round-trips the honesty flags", () => {
    const { trades } = fromCsv(
      toCsv([trade({ stopMovedAgainst: true, tradesToday: 9, minutesSincePriorLoss: 3 })]),
    );
    expect(trades[0].stopMovedAgainst).toBe(true);
    expect(trades[0].tradesToday).toBe(9);
    expect(trades[0].minutesSincePriorLoss).toBe(3);
  });
});

describe("imported files are treated as untrusted", () => {
  it("reports a row it cannot use instead of importing rubbish", () => {
    const csv = ["id,date,symbol,entry,size", "x,2026-01-01,ABC,notanumber,100"].join("\n");
    const { trades, errors } = fromCsv(csv);
    expect(trades).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/row 2|entry/i);
  });

  it("rejects a file with no recognisable header", () => {
    const { trades, errors } = fromCsv("hello\nworld");
    expect(trades).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("handles an empty file without throwing", () => {
    expect(fromCsv("")).toEqual({ trades: [], errors: expect.any(Array) });
    expect(() => fromCsv("   \n  ")).not.toThrow();
  });

  it("imports the good rows and reports the bad ones", () => {
    const good = toCsv([trade({ id: "ok", symbol: "GOOD" })]);
    const csv = good + "\nbad,2026-01-01,BAD,long,notanumber,1,,,1,,open,,,false,1,";
    const { trades, errors } = fromCsv(csv);
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe("GOOD");
    expect(errors).toHaveLength(1);
  });

  it("gives every imported trade an id even if the file has none", () => {
    const csv = ["date,symbol,direction,entry,size", "2026-01-01,ABC,long,100,50"].join("\n");
    const { trades } = fromCsv(csv);
    expect(trades).toHaveLength(1);
    expect(trades[0].id).toBeTruthy();
  });

  it("drops any screenshot reference, because the image is not in the file", () => {
    const csv = ["id,date,symbol,entry,size,screenshotId", "a,2026-01-01,ABC,100,50,shot-9"].join(
      "\n",
    );
    const { trades } = fromCsv(csv);
    expect(trades[0].screenshotId).toBeUndefined();
  });

  it("ignores a stray trailing newline", () => {
    const { trades, errors } = fromCsv(toCsv([trade()]) + "\n");
    expect(trades).toHaveLength(1);
    expect(errors).toEqual([]);
  });
});
