// @vitest-environment happy-dom
/**
 * The journal, driven the way a trader reads it.
 *
 * The bug this layer actually shipped: a trade graded D on the form and B here,
 * because the stop-timing answer was never saved. So the first thing these check
 * is that a trade grades the same in both places — the property that makes a
 * journal worth keeping at all.
 *
 * Also covered: the statistics stay hidden until there are enough trades to mean
 * anything, which is the whole argument of the site applied to its own numbers.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import JournalHistory from "./JournalHistory";
import { clearJournal, loadTrades, blankTrade } from "@/lib/journal";
import { journalStore } from "@/lib/clientStore";
import { gradeTrade } from "@/lib/grade";
import { MIN_TRADES_FOR_STATS } from "@/lib/rules";
import type { Trade } from "@/lib/trade";

vi.mock("@/lib/screenshots", () => ({
  getShot: vi.fn(async () => undefined),
  shotUrl: vi.fn(async () => null),
  deleteShot: vi.fn(async () => {}),
  saveShot: vi.fn(async () => "x"),
  ACCEPTED_TYPES: ["image/png"],
  MAX_SHOT_BYTES: 1,
}));

function trade(i: number, over: Partial<Trade> = {}): Trade {
  return {
    ...blankTrade(),
    id: `t${i}`,
    date: `2026-09-${String(10 + (i % 18)).padStart(2, "0")}`,
    symbol: `SYM${i}`,
    direction: "long",
    accountSize: 25_000,
    entry: 100,
    stop: 99,
    target: 103,
    size: 250,
    exit: 103,
    exitReason: "target",
    setup: "Opening range breakout",
    planNote: "Broke the range high on volume and I took the retest.",
    stopMovedAgainst: false,
    tradesToday: 2,
    minutesSincePriorLoss: null,
    screenshotId: undefined,
    stopPlannedBeforeEntry: true,
    ...over,
  };
}

function seed(trades: Trade[]) {
  window.localStorage.setItem("ts:journal:v1", JSON.stringify(trades));
  journalStore.refresh(trades);
}

beforeEach(() => {
  clearJournal();
  window.localStorage.clear();
  journalStore.refresh([]);
});
afterEach(cleanup);

describe("an empty journal", () => {
  it("sends the trader to log their first trade rather than showing zeros", () => {
    render(<JournalHistory />);
    expect(screen.getAllByText(/first trade/i).length).toBeGreaterThan(0);
  });
});

describe("a trade grades the same here as it did on the form", () => {
  it("honours the saved stop-timing answer instead of regrading it away", () => {
    const t = trade(1, { stopPlannedBeforeEntry: false });
    seed([t]);
    render(<JournalHistory />);

    // whatever the form computed for this trade is what the journal must show
    const expected = gradeTrade(t);
    expect(expected.letter).not.toBe("A");
    expect(screen.getAllByLabelText(`Grade ${expected.letter}`).length).toBeGreaterThan(0);
  });

  it("shows an A for a trade that deserves one", () => {
    const t = trade(1);
    seed([t]);
    render(<JournalHistory />);
    expect(gradeTrade(t).letter).toBe("A");
    expect(screen.getAllByLabelText("Grade A").length).toBeGreaterThan(0);
  });
});

describe("statistics stay hidden until they mean something", () => {
  it("does not print a win rate off a handful of trades", () => {
    seed([trade(1), trade(2, { exit: 99, exitReason: "stop" })]);
    render(<JournalHistory />);
    expect(screen.getByText(/stay hidden until/i)).toBeTruthy();
    // the suppressed tiles render an em dash rather than a flattering number
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows them once there are enough closed trades", () => {
    seed(Array.from({ length: MIN_TRADES_FOR_STATS }, (_, i) => trade(i + 1)));
    render(<JournalHistory />);
    expect(screen.queryByText(/stay hidden until/i)).toBeNull();
  });

  it("counts the trades from the first one, since that is not a statistic", () => {
    seed([trade(1)]);
    render(<JournalHistory />);
    // the label and the value are siblings inside the Stat tile
    const tile = screen.getByText(/trades logged/i).parentElement!;
    expect(tile.textContent).toMatch(/1/);
  });
});

describe("correcting a trade", () => {
  it("can fix a mistyped price without deleting the trade", async () => {
    const user = userEvent.setup();
    seed([trade(1, { entry: 1000 })]); // fat-fingered
    render(<JournalHistory />);

    await user.click(screen.getByRole("button", { name: /SYM1|expand|show/i }));
    await user.click(screen.getByRole("button", { name: /fix the numbers/i }));

    const entry = screen.getByLabelText(/got in at/i);
    await user.clear(entry);
    await user.type(entry, "100");
    await user.click(screen.getByRole("button", { name: /save the corrections/i }));

    const saved = loadTrades();
    expect(saved).toHaveLength(1);
    expect(saved[0].entry).toBe(100);
  });
});

describe("removing a trade", () => {
  it("asks before deleting, and deletes on confirmation", async () => {
    const user = userEvent.setup();
    seed([trade(1), trade(2)]);
    render(<JournalHistory />);

    await user.click(screen.getAllByRole("button", { name: /SYM1|expand|show/i })[0]);
    await user.click(screen.getByRole("button", { name: /delete this trade/i }));
    // a confirmation step exists rather than deleting on the first click
    expect(screen.getByRole("button", { name: /yes, delete/i })).toBeTruthy();
    expect(loadTrades()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(loadTrades()).toHaveLength(1);
  });
});

describe("what to work on", () => {
  it("names the habit missed most often, not the most recent one", () => {
    seed([
      trade(1, { stop: null }),
      trade(2, { stop: null }),
      trade(3, { setup: "" }),
    ]);
    render(<JournalHistory />);
    const panel = screen.getByText(/what to work on/i).closest("section") ?? document.body;
    expect(panel.textContent).toMatch(/stop/i);
  });
});
