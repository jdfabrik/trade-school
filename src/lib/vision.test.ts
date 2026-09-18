/**
 * The model's reply is treated as hostile.
 *
 * A vision model will cheerfully return a long whose stop sits above its entry,
 * or a price with no digits in it, or "visible" for something it plainly could
 * not see. None of that may reach a grade. The rule these tests enforce: when in
 * doubt the value is dropped, never promoted.
 */
import { describe, it, expect } from "vitest";

import { parseExtraction, estimateCents, PROVIDERS } from "./vision";
import {
  visibleValue,
  visibleUnknown,
  anyValue,
  contradictions,
  evidenceSummary,
  type ExtractedTrade,
} from "./extraction";

const field = (o: Record<string, unknown>) => o;

function reply(trade: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return JSON.stringify({ platform: "TradingView", issues: [], trade, ...extra });
}

describe("a value is only visible when it really was", () => {
  it("keeps a properly reported reading", () => {
    const { trade } = parseExtraction(
      reply({ entry: field({ status: "visible", value: 48.6, confidence: 0.9, sawText: "48.60" }) }),
    );
    expect(visibleValue(trade.entry)).toBe(48.6);
    expect(trade.entry.sawText).toBe("48.60");
  });

  it("refuses to hand back an inferred value as if it were read", () => {
    const { trade } = parseExtraction(
      reply({ entry: field({ status: "inferred", value: 48.6, confidence: 0.8 }) }),
    );
    expect(visibleValue(trade.entry)).toBeNull();
    expect(anyValue(trade.entry)).toEqual({ value: 48.6, status: "inferred" });
  });

  it("demotes a visible claim that carries nothing readable", () => {
    const { trade } = parseExtraction(
      reply({ entry: field({ status: "visible", value: "not a number", confidence: 0.99 }) }),
    );
    expect(trade.entry.status).toBe("unreadable");
    expect(visibleValue(trade.entry)).toBeNull();
  });

  it("treats an unknown status as unreadable rather than trusting it", () => {
    const { trade } = parseExtraction(
      reply({ entry: field({ status: "definitely-correct", value: 48.6, confidence: 1 }) }),
    );
    expect(trade.entry.status).toBe("unreadable");
    expect(visibleValue(trade.entry)).toBeNull();
  });

  it("never returns a value for missing or unreadable", () => {
    const { trade } = parseExtraction(
      reply({
        stop: field({ status: "missing", value: 99, confidence: 0.5 }),
        target: field({ status: "unreadable", value: 103, confidence: 0.5 }),
      }),
    );
    expect(trade.stop.value).toBeUndefined();
    expect(trade.target.value).toBeUndefined();
    expect(anyValue(trade.stop)).toBeNull();
  });

  it("clamps a confidence outside 0 to 1", () => {
    const { trade } = parseExtraction(
      reply({
        entry: field({ status: "visible", value: 1, confidence: 42 }),
        stop: field({ status: "visible", value: 2, confidence: -3 }),
      }),
    );
    expect(trade.entry.confidence).toBe(1);
    expect(trade.stop.confidence).toBe(0);
  });

  it("only accepts a direction it recognises", () => {
    const ok = parseExtraction(reply({ direction: field({ status: "visible", value: "BUY", confidence: 1 }) }));
    expect(visibleValue(ok.trade.direction)).toBe("long");

    const bad = parseExtraction(reply({ direction: field({ status: "visible", value: "maybe up?", confidence: 1 }) }));
    expect(bad.trade.direction.status).toBe("unreadable");
  });

  it("drops a region that is not a sane fraction of the image", () => {
    const { trade } = parseExtraction(
      reply({ entry: field({ status: "visible", value: 10, confidence: 1, region: { x: 9, y: 9, w: 9, h: 9 } }) }),
    );
    expect(trade.entry.region).toBeUndefined();
  });
});

describe("a broken reply extracts nothing rather than something wrong", () => {
  it("survives text that is not JSON at all", () => {
    const { trade, issues } = parseExtraction("I had a look and I think it was about 48 dollars");
    expect(issues.length).toBeGreaterThan(0);
    for (const f of Object.keys(trade) as (keyof ExtractedTrade)[]) {
      expect(visibleUnknown(trade[f])).toBeNull();
    }
  });

  it("survives an empty reply", () => {
    expect(parseExtraction("").issues.length).toBeGreaterThan(0);
  });

  it("copes with a reply wrapped in prose or code fences", () => {
    const { trade } = parseExtraction(
      'Here you go:\n```json\n' +
        reply({ entry: field({ status: "visible", value: 48.6, confidence: 0.9 }) }) +
        "\n```",
    );
    expect(visibleValue(trade.entry)).toBe(48.6);
  });

  it("ignores fields it was never asked for", () => {
    const { trade } = parseExtraction(
      reply({ entry: field({ status: "visible", value: 1, confidence: 1 }), nonsense: 12345 }),
    );
    expect(Object.keys(trade).sort()).toEqual(
      ["direction", "entry", "exit", "pnl", "size", "stop", "symbol", "target"],
    );
  });

  it("carries the model's own issues through to the trader", () => {
    const { issues } = parseExtraction(
      reply({}, { issues: ["The price axis is cropped", "Two positions are shown"] }),
    );
    expect(issues).toHaveLength(2);
  });
});

describe("contradictions are surfaced, not silently resolved", () => {
  const vis = (v: unknown) => field({ status: "visible", value: v, confidence: 0.9 });

  it("flags a long whose stop is above its entry", () => {
    const { trade } = parseExtraction(
      reply({ direction: vis("long"), entry: vis(100), stop: vis(101) }),
    );
    const found = contradictions(trade);
    expect(found.length).toBeGreaterThan(0);
    expect(found[0]).toMatch(/wrong side/i);
  });

  it("flags a short whose target is above its entry", () => {
    const { trade } = parseExtraction(
      reply({ direction: vis("short"), entry: vis(100), target: vis(104) }),
    );
    expect(contradictions(trade).length).toBeGreaterThan(0);
  });

  it("says nothing about a coherent trade", () => {
    const { trade } = parseExtraction(
      reply({ direction: vis("long"), entry: vis(100), stop: vis(99), target: vis(103) }),
    );
    expect(contradictions(trade)).toEqual([]);
  });
});

describe("how much was actually read", () => {
  it("counts what is visible against what is guessed or absent", () => {
    const { trade } = parseExtraction(
      reply({
        entry: field({ status: "visible", value: 100, confidence: 1 }),
        stop: field({ status: "visible", value: 99, confidence: 1 }),
        size: field({ status: "inferred", value: 250, confidence: 0.4 }),
      }),
    );
    expect(evidenceSummary(trade)).toEqual({ visible: 2, inferred: 1, missing: 5, total: 8 });
  });
});

describe("the cost estimate is honest and small", () => {
  it("is a few pennies for a downscaled chart", () => {
    const image = {
      dataUrl: "",
      base64: "",
      mediaType: "image/png",
      width: 1600,
      height: 900,
      bytes: 0,
      estimatedTokens: Math.ceil((1600 * 900) / 750),
    };
    for (const p of Object.values(PROVIDERS)) {
      const cents = estimateCents(p, image);
      expect(cents).toBeGreaterThan(0);
      expect(cents, `${p.label} estimate`).toBeLessThan(5);
    }
  });

  it("never quotes zero, so nobody reads it as free", () => {
    const tiny = { dataUrl: "", base64: "", mediaType: "image/png", width: 10, height: 10, bytes: 0, estimatedTokens: 1 };
    expect(estimateCents(PROVIDERS.openai, tiny)).toBeGreaterThan(0);
  });
});
