/**
 * Three defects found by independent review, each reproduced on the live site
 * before being written up here.
 *
 * 1. The position-size hint recommended 24,999 shares — $2.5m of stock — for a
 *    $25,000 account, because nothing compared the position against the money
 *    available to buy it. The site's own button filled it in and the grader
 *    called it well set up.
 *
 * 2. "Did you decide the stop before you got in?" was answered, used to lower
 *    the grade on screen, and then thrown away at save, because Trade had no
 *    field for it. The same trade graded D on the form and B in the journal.
 *
 * 3. The headline was baked from the pre-penalty letter, so a D could render
 *    under "Nothing to fix" in the largest type on the card.
 *
 * All three came from patching a Grade object inside a component instead of
 * grading the trade properly. The fix is to make the answer part of the trade.
 */
import { describe, it, expect } from "vitest";

import { gradeTrade } from "./grade";
import { affordableSize, positionSize } from "./trade";
import { blankTrade, toCsv, fromCsv } from "./journal";
import type { Trade } from "./trade";

function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    ...blankTrade(),
    id: "c1",
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
    stopPlannedBeforeEntry: true,
    ...overrides,
  };
}

describe("a position you could not actually buy", () => {
  it("never recommends more stock than the account can pay for", () => {
    // a 1-cent stop on a $100 share: the 1% rule alone says 24,999 shares
    expect(positionSize(25_000, 1, 100, 99.99)).toBeGreaterThan(24_000);
    expect(affordableSize(25_000, 1, 100, 99.99)).toBe(250);
  });

  it("leaves a normal trade alone", () => {
    expect(affordableSize(25_000, 1, 100, 99)).toBe(250);
    expect(affordableSize(25_000, 1, 50, 48.75)).toBe(200);
  });

  it("reports when the cap bound, so the trader is told why", () => {
    expect(affordableSize(25_000, 1, 100, 99.99, { explain: true })).toMatchObject({
      size: 250,
      limitedByCash: true,
    });
    expect(affordableSize(25_000, 1, 100, 99, { explain: true })).toMatchObject({
      limitedByCash: false,
    });
  });

  it("a position larger than the account cannot grade well", () => {
    const g = gradeTrade(trade({ entry: 100, stop: 99.99, size: 24_999 }));
    expect(g.checks.find((c) => c.id === "affordable")!.passed).toBe(false);
    expect(["D", "F"]).toContain(g.letter);
  });

  it("an ordinary position passes the affordability check", () => {
    expect(gradeTrade(trade()).checks.find((c) => c.id === "affordable")!.passed).toBe(true);
  });
});

describe("the stop-timing answer is part of the trade, not a screen effect", () => {
  it("a stop decided after entering fails the stop check", () => {
    const g = gradeTrade(trade({ stopPlannedBeforeEntry: false }));
    const check = g.checks.find((c) => c.id === "stop-set")!;
    expect(check.passed).toBe(false);
    expect(check.detail.toLowerCase()).toContain("after");
  });

  it("grades the same wherever it is graded, because it is saved with the trade", () => {
    const t = trade({ stopPlannedBeforeEntry: false });
    const onTheForm = gradeTrade(t);
    const inTheJournal = gradeTrade(JSON.parse(JSON.stringify(t)));
    expect(inTheJournal.letter).toBe(onTheForm.letter);
    expect(inTheJournal.score).toBeCloseTo(onTheForm.score, 12);
  });

  it("survives an export and re-import", () => {
    const { trades } = fromCsv(toCsv([trade({ stopPlannedBeforeEntry: false })]));
    expect(trades[0].stopPlannedBeforeEntry).toBe(false);
  });

  it("an older trade with no answer recorded is not retroactively marked down", () => {
    const legacy = { ...trade() } as Partial<Trade>;
    delete legacy.stopPlannedBeforeEntry;
    const g = gradeTrade(legacy as Trade);
    expect(g.checks.find((c) => c.id === "stop-set")!.passed).toBe(true);
  });
});

describe("the headline always describes the grade beside it", () => {
  it("never says there is nothing to fix on a failing grade", () => {
    const g = gradeTrade(
      trade({ stopPlannedBeforeEntry: false, exit: 99, exitReason: "stop" }),
    );
    expect(g.failed.length).toBeGreaterThan(0);
    expect(g.headline.toLowerCase()).not.toContain("nothing to fix");
  });

  it("still says there is nothing to fix on a good trade that lost", () => {
    const g = gradeTrade(trade({ exit: 99, exitReason: "stop" }));
    expect(g.letter).toBe("A");
    expect(g.headline.toLowerCase()).toContain("nothing to fix");
  });

  it("the headline matches the letter for every combination", () => {
    const cases: Trade[] = [
      trade({ exit: 103, exitReason: "target" }),
      trade({ exit: 99, exitReason: "stop" }),
      trade({ stopPlannedBeforeEntry: false, exit: 103, exitReason: "target" }),
      trade({ stop: null, exit: 103, exitReason: "manual" }),
      trade({ size: 2000, exit: 99, exitReason: "stop" }),
    ];
    for (const t of cases) {
      const g = gradeTrade(t);
      const good = g.letter === "A" || g.letter === "B";
      if (!good) {
        expect(g.headline.toLowerCase(), `letter ${g.letter}`).not.toContain("nothing to fix");
      }
    }
  });
});
