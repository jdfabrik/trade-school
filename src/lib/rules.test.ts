/**
 * The trader's own thresholds.
 *
 * The site previously hard-coded 1% risk and 2:1 reward and marked every trade
 * against them. Those are sensible defaults, not universal law — a legitimate
 * style can sit outside them — so they are now the trader's to set. What the
 * site keeps is the right to say plainly when a choice is outside what it
 * teaches.
 */
import { describe, it, expect } from "vitest";

import {
  DEFAULT_RULES,
  clampRules,
  rulesWarning,
  MIN_TRADES_FOR_STATS,
  type TradingRules,
} from "./rules";
import { gradeTrade } from "./grade";
import type { Trade } from "./trade";

function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: "t1",
    date: "2026-09-17",
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
    planNote: "Broke the range high on volume, taking the retest with a stop under it.",
    stopMovedAgainst: false,
    tradesToday: 2,
    minutesSincePriorLoss: null,
    screenshotId: "shot-1",
    ...overrides,
  };
}

describe("defaults", () => {
  it("still defaults to the 1% and 2:1 the lessons teach", () => {
    expect(DEFAULT_RULES.maxRiskPct).toBe(1);
    expect(DEFAULT_RULES.minRR).toBe(2);
  });

  it("grading with no rules given behaves exactly as it always did", () => {
    const withDefault = gradeTrade(trade());
    const explicit = gradeTrade(trade(), DEFAULT_RULES);
    expect(withDefault.score).toBeCloseTo(explicit.score, 12);
    expect(withDefault.letter).toBe(explicit.letter);
  });
});

describe("the trader's thresholds actually change the grade", () => {
  it("a 2% risk fails at the default and passes at a 2% setting", () => {
    // 500 shares with a $1 stop on 25k is exactly 2%
    const t = trade({ size: 500 });
    const strict = gradeTrade(t, { maxRiskPct: 1, minRR: 2 });
    const relaxed = gradeTrade(t, { maxRiskPct: 2, minRR: 2 });

    expect(strict.checks.find((c) => c.id === "risk-size")!.passed).toBe(false);
    expect(relaxed.checks.find((c) => c.id === "risk-size")!.passed).toBe(true);
    expect(relaxed.score).toBeGreaterThan(strict.score);
  });

  it("a 1:1 target fails at 2:1 and passes for a trader who set 1:1", () => {
    const t = trade({ target: 101 });
    const strict = gradeTrade(t, { maxRiskPct: 1, minRR: 2 });
    const scalper = gradeTrade(t, { maxRiskPct: 1, minRR: 1 });

    expect(strict.checks.find((c) => c.id === "reward-risk")!.passed).toBe(false);
    expect(scalper.checks.find((c) => c.id === "reward-risk")!.passed).toBe(true);
  });

  it("the size check follows the trader's risk setting, not a fixed 1%", () => {
    // 500 shares is 2% of the account; at a 2% rule the size is correct
    const t = trade({ size: 500 });
    expect(
      gradeTrade(t, { maxRiskPct: 2, minRR: 2 }).checks.find(
        (c) => c.id === "size-matches-stop",
      )!.passed,
    ).toBe(true);
  });

  it("the check labels tell the trader which threshold they are being held to", () => {
    const g = gradeTrade(trade(), { maxRiskPct: 0.5, minRR: 3 });
    expect(g.checks.find((c) => c.id === "risk-size")!.label).toContain("0.5%");
    expect(g.checks.find((c) => c.id === "reward-risk")!.label).toContain("3");
  });

  it("no setting lets a trade with no stop pass", () => {
    const g = gradeTrade(trade({ stop: null }), { maxRiskPct: 5, minRR: 0.5 });
    expect(g.checks.find((c) => c.id === "stop-set")!.passed).toBe(false);
  });
});

describe("clamping keeps the settings inside a defensible range", () => {
  it("rejects a risk setting that would be reckless at any experience level", () => {
    expect(clampRules({ maxRiskPct: 50, minRR: 2 }).maxRiskPct).toBe(5);
    expect(clampRules({ maxRiskPct: 0, minRR: 2 }).maxRiskPct).toBe(0.1);
  });

  it("keeps reward:risk inside something a real plan could use", () => {
    expect(clampRules({ maxRiskPct: 1, minRR: 100 }).minRR).toBe(10);
    expect(clampRules({ maxRiskPct: 1, minRR: 0 }).minRR).toBe(0.25);
  });

  it("passes sensible values through untouched", () => {
    const r: TradingRules = { maxRiskPct: 0.75, minRR: 2.5 };
    expect(clampRules(r)).toEqual(r);
  });

  it("repairs rubbish rather than throwing", () => {
    expect(clampRules({ maxRiskPct: NaN, minRR: NaN })).toEqual(DEFAULT_RULES);
  });
});

describe("the site still says when a setting is outside what it teaches", () => {
  it("says nothing at the defaults", () => {
    expect(rulesWarning(DEFAULT_RULES)).toBeNull();
  });

  it("warns above 2% risk", () => {
    const w = rulesWarning({ maxRiskPct: 3, minRR: 2 });
    expect(w).not.toBeNull();
    expect(w!.length).toBeGreaterThan(30);
  });

  it("warns when the reward threshold drops below 1:1", () => {
    expect(rulesWarning({ maxRiskPct: 1, minRR: 0.5 })).not.toBeNull();
  });

  it("does not nag a trader who tightened the rules", () => {
    expect(rulesWarning({ maxRiskPct: 0.5, minRR: 3 })).toBeNull();
  });
});

describe("statistics threshold", () => {
  it("is high enough that a handful of trades cannot look like a record", () => {
    expect(MIN_TRADES_FOR_STATS).toBeGreaterThanOrEqual(20);
  });
});
