/**
 * Direction sanity, and hard rules that cannot be averaged away.
 *
 * Found by an independent review and then reproduced: the grader awarded A at
 * 100% to a long whose target sat BELOW its entry, and to a long whose "stop"
 * sat ABOVE its entry. Both came from taking Math.abs() of a price difference,
 * which throws away the only thing that makes a stop a stop.
 *
 * This is the worst class of bug this site can have. A beginner takes a trade
 * that cannot work, and the thing that exists to teach them tells them it was
 * perfect.
 */
import { describe, it, expect } from "vitest";

import { riskPerUnit, plannedRR } from "./trade";
import { gradeTrade } from "./grade";
import type { Trade } from "./trade";

function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: "d1",
    date: "2026-09-17",
    symbol: "ABC",
    direction: "long",
    accountSize: 25_000,
    entry: 100,
    stop: 99,
    target: 103,
    size: 250,
    exit: null,
    exitReason: "open",
    setup: "Opening range breakout",
    planNote: "Broke the range high on volume and I took the retest.",
    stopMovedAgainst: false,
    tradesToday: 2,
    minutesSincePriorLoss: null,
    screenshotId: "s1",
    ...overrides,
  };
}

describe("a stop has to be on the side that makes it a stop", () => {
  it("a long stop above the entry is not a stop", () => {
    expect(riskPerUnit({ entry: 100, stop: 101, direction: "long" })).toBeNaN();
  });

  it("a short stop below the entry is not a stop", () => {
    expect(riskPerUnit({ entry: 100, stop: 99, direction: "short" })).toBeNaN();
  });

  it("the normal cases still work", () => {
    expect(riskPerUnit({ entry: 100, stop: 99, direction: "long" })).toBeCloseTo(1, 10);
    expect(riskPerUnit({ entry: 100, stop: 101.5, direction: "short" })).toBeCloseTo(1.5, 10);
  });

  it("a trade whose stop is on the wrong side cannot pass the stop check", () => {
    const g = gradeTrade(trade({ stop: 101 }));
    const check = g.checks.find((c) => c.id === "stop-set")!;
    expect(check.passed).toBe(false);
    expect(check.detail.toLowerCase()).toMatch(/above|wrong side|below/);
    expect(g.letter).not.toBe("A");
  });
});

describe("a target has to be on the side you profit from", () => {
  it("a long target below the entry is not a reward", () => {
    expect(plannedRR({ entry: 100, stop: 99, target: 97, direction: "long" })).toBeNaN();
  });

  it("a short target above the entry is not a reward", () => {
    expect(plannedRR({ entry: 100, stop: 101, target: 104, direction: "short" })).toBeNaN();
  });

  it("the normal cases still work", () => {
    expect(plannedRR({ entry: 100, stop: 99, target: 103, direction: "long" })).toBeCloseTo(3, 10);
    expect(plannedRR({ entry: 100, stop: 101, target: 97, direction: "short" })).toBeCloseTo(3, 10);
  });

  it("a long with its target below entry does not score a reward, and cannot be an A", () => {
    const g = gradeTrade(trade({ target: 97 }));
    const check = g.checks.find((c) => c.id === "reward-risk")!;
    expect(check.passed).toBe(false);
    expect(check.score).toBe(0);
    expect(g.letter).not.toBe("A");
  });

  it("a short with its target above entry does not score a reward", () => {
    const g = gradeTrade(trade({ direction: "short", stop: 101, target: 104 }));
    expect(g.checks.find((c) => c.id === "reward-risk")!.passed).toBe(false);
    expect(g.letter).not.toBe("A");
  });
});

describe("breaking a hard rule cannot be averaged away", () => {
  /*
   * Risking more than the limit, and trading with no stop at all, are not
   * ordinary deductions. Letting nine good habits carry a trade that broke the
   * one rule that decides survival is precisely the lesson this site argues
   * against everywhere else.
   */
  it("risking twice the limit cannot earn an A", () => {
    const g = gradeTrade(trade({ size: 500 })); // 2% of 25k
    expect(g.checks.find((c) => c.id === "risk-size")!.passed).toBe(false);
    expect(g.letter).not.toBe("A");
  });

  it("risking four times the limit is worse than twice", () => {
    const twice = gradeTrade(trade({ size: 500 }));
    const four = gradeTrade(trade({ size: 1000 }));
    expect(four.score).toBeLessThan(twice.score);
    expect(["D", "F"]).toContain(four.letter);
  });

  it("no stop at all cannot earn better than a D, however tidy the rest is", () => {
    const g = gradeTrade(trade({ stop: null }));
    expect(["D", "F"]).toContain(g.letter);
  });

  it("a trade that breaks no hard rule is unaffected by the cap", () => {
    const g = gradeTrade(trade());
    expect(g.letter).toBe("A");
    expect(g.score).toBeCloseTo(1, 6);
  });

  it("the grade explains which hard rule capped it", () => {
    const g = gradeTrade(trade({ size: 500 }));
    expect(g.cappedBy).toBeTruthy();
    expect(g.cappedBy!.toLowerCase()).toContain("risk");
  });
});

describe("direction sanity does not break the money maths", () => {
  it("a short that works still reports a profit and a positive R", () => {
    const g = gradeTrade(
      trade({ direction: "short", stop: 101, target: 97, exit: 97, exitReason: "target" }),
    );
    expect(g.pnl).toBeGreaterThan(0);
    expect(g.profitable).toBe(true);
  });
});
