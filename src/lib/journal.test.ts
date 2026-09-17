/**
 * Journal storage. These run in Node with no localStorage, which is exactly the
 * situation of a trader in a private window with site data blocked — so the
 * first thing worth proving is that nothing throws.
 */
import { describe, it, expect } from "vitest";

import {
  blankTrade,
  newTradeId,
  sortTrades,
  toCsv,
  loadTrades,
  addTrade,
  deleteTrade,
} from "./journal";
import type { Trade } from "./trade";

function trade(overrides: Partial<Trade> = {}): Trade {
  return { ...blankTrade(), symbol: "ABC", entry: 10, size: 100, ...overrides };
}

describe("storage degrades quietly when the browser will not cooperate", () => {
  it("reading with no storage available returns an empty journal", () => {
    expect(loadTrades()).toEqual([]);
  });

  it("writing with no storage available does not throw", () => {
    expect(() => addTrade(trade())).not.toThrow();
    expect(() => deleteTrade("nope")).not.toThrow();
  });
});

describe("trade identity", () => {
  it("ids are unique across rapid creation", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newTradeId()));
    expect(ids.size).toBe(200);
  });

  it("a blank trade is safe to grade immediately", () => {
    const t = blankTrade();
    expect(t.stop).toBeNull();
    expect(t.exit).toBeNull();
    expect(t.exitReason).toBe("open");
    expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("sorting", () => {
  it("puts the newest trade first", () => {
    const sorted = sortTrades([
      trade({ date: "2026-01-02", symbol: "MID" }),
      trade({ date: "2026-01-03", symbol: "NEW" }),
      trade({ date: "2026-01-01", symbol: "OLD" }),
    ]);
    expect(sorted.map((t) => t.symbol)).toEqual(["NEW", "MID", "OLD"]);
  });

  it("does not mutate the array it was given", () => {
    const input = [trade({ date: "2026-01-01" }), trade({ date: "2026-01-09" })];
    const copy = [...input];
    sortTrades(input);
    expect(input).toEqual(copy);
  });
});

describe("csv export", () => {
  it("writes a header plus one row per trade", () => {
    const csv = toCsv([trade({ symbol: "AAA" }), trade({ symbol: "BBB" })]);
    const lines = csv.split("\n");
    expect(lines[0].startsWith("Date,Symbol,Direction")).toBe(true);
    // the headings a trader reads, never the field names underneath
    expect(csv).not.toMatch(/planNote|stopMovedAgainst|minutesSincePriorLoss/);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("AAA");
  });

  it("quotes a note containing commas, quotes or newlines", () => {
    const csv = toCsv([
      trade({ planNote: 'broke out, then retested "the" high\nheld above' }),
    ]);
    // the quoted field survives as one field, with doubled inner quotes
    expect(csv).toContain('"broke out, then retested ""the"" high');
  });

  it("writes an empty cell for a missing stop rather than the word null", () => {
    const csv = toCsv([trade({ stop: null, target: null })]);
    expect(csv).not.toContain("null");
  });

  it("handles an empty journal", () => {
    const csv = toCsv([]);
    expect(csv.split("\n")).toHaveLength(1);
  });
});
