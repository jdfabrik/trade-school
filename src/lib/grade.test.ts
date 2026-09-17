/**
 * The grader is the heart of the site, so it gets tested hard.
 *
 * The single most important property: the grade must not move when the money
 * does. A reckless trade that got lucky still fails; a disciplined trade that
 * lost still passes. If that ever stops being true, the site is teaching the
 * exact habit it exists to break.
 */
import { describe, it, expect } from "vitest";

import {
  riskPerUnit,
  riskAmount,
  riskPercent,
  plannedRR,
  realisedR,
  profitLoss,
  expectancy,
  breakevenWinRate,
  positionSize,
} from "./trade";
import { gradeTrade, letterFor } from "./grade";
import type { Trade } from "./trade";

/** A clean, by-the-book long. Risks 1% with a 3:1 target and hits it. */
function goodTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: "t1",
    date: "2026-09-17",
    symbol: "ABC",
    direction: "long",
    accountSize: 25_000,
    entry: 100,
    stop: 99,
    target: 103,
    size: 250, // 250 * $1 stop = $250 = 1% of 25k
    exit: 103,
    exitReason: "target",
    setup: "Opening range breakout",
    planNote:
      "Broke the opening range high on rising volume, taking the retest with a stop under the range.",
    stopMovedAgainst: false,
    tradesToday: 2,
    minutesSincePriorLoss: null,
    screenshotId: "shot-1",
    ...overrides,
  };
}

describe("trade arithmetic", () => {
  it("risk per unit is the distance from entry to stop", () => {
    expect(riskPerUnit(goodTrade())).toBeCloseTo(1, 10);
    expect(
      riskPerUnit(goodTrade({ direction: "short", entry: 100, stop: 101.5 })),
    ).toBeCloseTo(1.5, 10);
  });

  it("risk amount and percent describe what is actually at stake", () => {
    const t = goodTrade();
    expect(riskAmount(t)).toBeCloseTo(250, 10);
    expect(riskPercent(t)).toBeCloseTo(1, 10);
  });

  it("planned reward:risk compares target distance to stop distance", () => {
    expect(plannedRR(goodTrade())).toBeCloseTo(3, 10);
    expect(plannedRR(goodTrade({ target: 101 }))).toBeCloseTo(1, 10);
    expect(plannedRR(goodTrade({ target: null }))).toBeNaN();
  });

  it("a trade with no stop has no measurable risk", () => {
    const t = goodTrade({ stop: null });
    expect(riskPerUnit(t)).toBeNaN();
    expect(riskAmount(t)).toBeNaN();
    expect(plannedRR(t)).toBeNaN();
  });

  it("realised R is profit measured in units of what you risked", () => {
    expect(realisedR(goodTrade())).toBeCloseTo(3, 10);
    expect(realisedR(goodTrade({ exit: 99 }))).toBeCloseTo(-1, 10);
    expect(realisedR(goodTrade({ exit: 101 }))).toBeCloseTo(1, 10);
  });

  it("realised R works the same way for a short", () => {
    const short = goodTrade({
      direction: "short",
      entry: 100,
      stop: 101,
      target: 97,
      exit: 97,
    });
    expect(realisedR(short)).toBeCloseTo(3, 10);
    expect(profitLoss(short)).toBeCloseTo(750, 10);
  });

  it("profit and loss is just price difference times size", () => {
    expect(profitLoss(goodTrade())).toBeCloseTo(750, 10);
    expect(profitLoss(goodTrade({ exit: 99 }))).toBeCloseTo(-250, 10);
    expect(profitLoss(goodTrade({ exit: null }))).toBeNaN();
  });

  it("position size is derived from the stop, never guessed", () => {
    // risking 1% of 25,000 with a $1 stop means 250 shares
    expect(positionSize(25_000, 1, 100, 99)).toBeCloseTo(250, 10);
    // a wider stop means a SMALLER position for the same risk
    expect(positionSize(25_000, 1, 100, 97.5)).toBeCloseTo(100, 10);
    expect(positionSize(25_000, 1, 100, 100)).toBeNaN();
  });

  it("expectancy is the average R across a set of trades", () => {
    expect(expectancy([1, 1, -1, -1])).toBeCloseTo(0, 10);
    expect(expectancy([3, -1, -1, -1])).toBeCloseTo(0, 10);
    expect(expectancy([3, 3, -1, -1])).toBeCloseTo(1, 10);
    expect(expectancy([])).toBeNaN();
  });

  it("breakeven win rate falls as reward:risk rises", () => {
    expect(breakevenWinRate(1)).toBeCloseTo(50, 6);
    expect(breakevenWinRate(2)).toBeCloseTo(33.333, 3);
    expect(breakevenWinRate(3)).toBeCloseTo(25, 6);
  });
});

describe("the grade measures process, never profit", () => {
  it("an identical trade grades the same whether it won or lost", () => {
    const won = gradeTrade(goodTrade({ exit: 103, exitReason: "target" }));
    const lost = gradeTrade(goodTrade({ exit: 99, exitReason: "stop" }));
    expect(won.score).toBeCloseTo(lost.score, 10);
    expect(won.letter).toBe(lost.letter);
  });

  it("a disciplined losing trade still earns a good grade", () => {
    const g = gradeTrade(goodTrade({ exit: 99, exitReason: "stop" }));
    expect(g.letter).toBe("A");
    expect(g.profitable).toBe(false);
  });

  it("a reckless winning trade still fails", () => {
    const g = gradeTrade(
      goodTrade({
        stop: null,
        target: null,
        size: 2000,
        exit: 108,
        exitReason: "manual",
        setup: "",
        planNote: "",
        screenshotId: undefined,
      }),
    );
    expect(g.letter).toBe("F");
    expect(g.profitable).toBe(true);
  });
});

describe("the rubric", () => {
  it("gives a clean trade full marks", () => {
    const g = gradeTrade(goodTrade());
    expect(g.score).toBeCloseTo(1, 6);
    expect(g.letter).toBe("A");
    expect(g.failed).toHaveLength(0);
  });

  it("no stop is the heaviest single failure", () => {
    const g = gradeTrade(goodTrade({ stop: null }));
    const stopCheck = g.checks.find((c) => c.id === "stop-set")!;
    expect(stopCheck.passed).toBe(false);
    expect(stopCheck.weight).toBeGreaterThanOrEqual(
      Math.max(...g.checks.filter((c) => c.id !== "stop-set").map((c) => c.weight)),
    );
    expect(g.score).toBeLessThan(0.8);
  });

  it("flags risking more than one percent, and scales with how much more", () => {
    const fine = gradeTrade(goodTrade({ size: 250 })); // 1%
    const over = gradeTrade(goodTrade({ size: 500 })); // 2%
    const wild = gradeTrade(goodTrade({ size: 2000 })); // 8%

    const scoreOf = (g: ReturnType<typeof gradeTrade>) =>
      g.checks.find((c) => c.id === "risk-size")!.score;

    expect(scoreOf(fine)).toBeCloseTo(1, 6);
    expect(scoreOf(over)).toBeLessThan(1);
    expect(scoreOf(wild)).toBeLessThan(scoreOf(over));
    expect(scoreOf(wild)).toBe(0);
  });

  it("rewards a planned reward:risk of 2 or better", () => {
    const scoreOf = (t: Trade) =>
      gradeTrade(t).checks.find((c) => c.id === "reward-risk")!.score;
    expect(scoreOf(goodTrade({ target: 103 }))).toBeCloseTo(1, 6); // 3R
    expect(scoreOf(goodTrade({ target: 102 }))).toBeCloseTo(1, 6); // 2R
    expect(scoreOf(goodTrade({ target: 101 }))).toBeLessThan(1); // 1R
    expect(scoreOf(goodTrade({ target: 100.5 }))).toBeLessThan(
      scoreOf(goodTrade({ target: 101 })),
    );
  });

  it("catches a position size that does not match the stop", () => {
    // says it wants 1% but the size implies far more
    const mismatch = gradeTrade(goodTrade({ size: 900 }));
    expect(mismatch.checks.find((c) => c.id === "size-matches-stop")!.passed).toBe(
      false,
    );
  });

  it("penalises moving a stop against the position", () => {
    const g = gradeTrade(goodTrade({ stopMovedAgainst: true }));
    expect(g.checks.find((c) => c.id === "stop-held")!.passed).toBe(false);
    expect(g.score).toBeLessThan(1);
  });

  it("requires a named setup and a written reason", () => {
    const g = gradeTrade(goodTrade({ setup: "", planNote: "" }));
    expect(g.checks.find((c) => c.id === "setup-named")!.passed).toBe(false);
    expect(g.checks.find((c) => c.id === "reason-written")!.passed).toBe(false);
  });

  it("treats a two-word note as no reason at all", () => {
    const g = gradeTrade(goodTrade({ planNote: "looked good" }));
    expect(g.checks.find((c) => c.id === "reason-written")!.passed).toBe(false);
  });

  it("flags a trade taken within minutes of a loss as revenge risk", () => {
    const calm = gradeTrade(goodTrade({ minutesSincePriorLoss: 45 }));
    const revenge = gradeTrade(goodTrade({ minutesSincePriorLoss: 2 }));
    expect(calm.checks.find((c) => c.id === "composure")!.passed).toBe(true);
    expect(revenge.checks.find((c) => c.id === "composure")!.passed).toBe(false);
  });

  it("flags overtrading", () => {
    const g = gradeTrade(goodTrade({ tradesToday: 14 }));
    expect(g.checks.find((c) => c.id === "composure")!.passed).toBe(false);
  });

  it("asks for a screenshot but does not fail the trade over it alone", () => {
    const g = gradeTrade(goodTrade({ screenshotId: undefined }));
    expect(g.checks.find((c) => c.id === "evidence")!.passed).toBe(false);
    expect(g.letter).not.toBe("F");
  });

  it("every failed check comes with something to do about it", () => {
    const g = gradeTrade(
      goodTrade({ stop: null, setup: "", planNote: "", size: 2000 }),
    );
    expect(g.failed.length).toBeGreaterThan(0);
    for (const check of g.failed) {
      expect(check.advice.length).toBeGreaterThan(15);
    }
  });

  it("scores stay inside 0 and 1 however mad the trade is", () => {
    const mad = gradeTrade(
      goodTrade({
        stop: null,
        target: null,
        size: 100_000,
        setup: "",
        planNote: "",
        stopMovedAgainst: true,
        tradesToday: 60,
        minutesSincePriorLoss: 0,
        screenshotId: undefined,
      }),
    );
    expect(mad.score).toBeGreaterThanOrEqual(0);
    expect(mad.score).toBeLessThanOrEqual(1);
    for (const c of mad.checks) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(1);
    }
  });
});

describe("letter grades", () => {
  it("maps scores to letters on a fixed scale", () => {
    expect(letterFor(1)).toBe("A");
    expect(letterFor(0.9)).toBe("A");
    expect(letterFor(0.82)).toBe("B");
    expect(letterFor(0.72)).toBe("C");
    expect(letterFor(0.62)).toBe("D");
    expect(letterFor(0.4)).toBe("F");
    expect(letterFor(0)).toBe("F");
  });
});
