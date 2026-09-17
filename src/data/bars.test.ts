/**
 * The practice bars have to be real bars.
 *
 * A high below the body or a low above it is not a candle, and any drill that
 * decides whether a stop was touched would be reading a shape that could not
 * exist in a market.
 */
import { describe, it, expect } from "vitest";
import { REGIMES } from "./index";

describe("practice candles are well formed", () => {
  it("has one bar per close, in every regime", () => {
    for (const r of REGIMES) {
      expect(r.bars.length, r.id).toBe(r.close.length);
    }
  });

  it("never draws a high below the body or a low above it", () => {
    for (const r of REGIMES) {
      for (let i = 0; i < r.bars.length; i += 1) {
        const b = r.bars[i];
        expect(b.h, `${r.id} bar ${i} high`).toBeGreaterThanOrEqual(Math.max(b.o, b.c));
        expect(b.l, `${r.id} bar ${i} low`).toBeLessThanOrEqual(Math.min(b.o, b.c));
        expect(b.l).toBeGreaterThan(0);
      }
    }
  });

  it("closes match the close series exactly, so both views agree", () => {
    for (const r of REGIMES) {
      for (let i = 0; i < r.bars.length; i += 1) {
        expect(r.bars[i].c, `${r.id} bar ${i}`).toBeCloseTo(r.close[i], 4);
      }
    }
  });

  it("each bar opens where the last one closed", () => {
    for (const r of REGIMES) {
      for (let i = 1; i < r.bars.length; i += 1) {
        expect(r.bars[i].o, `${r.id} bar ${i}`).toBeCloseTo(r.bars[i - 1].c, 4);
      }
    }
  });

  it("every bar has some range, so no candle is an invisible line", () => {
    for (const r of REGIMES) {
      expect(r.bars.every((b) => b.h > b.l), r.id).toBe(true);
    }
  });
});
