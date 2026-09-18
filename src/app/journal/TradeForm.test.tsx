// @vitest-environment happy-dom
/**
 * The form, driven the way a trader drives it.
 *
 * Every test here corresponds to a bug that actually shipped. All three lived in
 * this file, none were caught by the 143 tests covering src/lib, and each would
 * have been caught by one of these:
 *
 *   - the size hint recommended 24,999 shares on a $25,000 account
 *   - "did you decide the stop before you got in?" was shown, used, and then
 *     discarded at save, so the same trade graded differently in the journal
 *   - a failing grade rendered under "Nothing to fix" in the largest type
 *
 * That is the argument for testing this layer at all.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TradeForm from "./TradeForm";
import { loadTrades, clearJournal } from "@/lib/journal";

// The screenshot store needs IndexedDB, which happy-dom does not provide. The
// form must work without it — someone with storage blocked can still log a trade.
vi.mock("@/lib/screenshots", () => ({
  saveShot: vi.fn(async () => {
    throw new Error("no storage here");
  }),
  getShot: vi.fn(async () => undefined),
  shotUrl: vi.fn(async () => null),
  deleteShot: vi.fn(async () => {}),
  ACCEPTED_TYPES: ["image/png"],
  MAX_SHOT_BYTES: 8 * 1024 * 1024,
}));

/** Fill the four numbers that make a gradeable trade. */
async function fillBasics(
  user: ReturnType<typeof userEvent.setup>,
  { entry = "100", stop = "99", size = "250", target = "103" } = {},
) {
  const nums = screen.getAllByRole("spinbutton");
  // order on the page: entry, stop, size, target, exit
  const set = async (el: HTMLElement, value: string) => {
    await user.clear(el);
    // typing "" throws; clearing is the whole intent in that case
    if (value !== "") await user.type(el, value);
  };
  await set(nums[0], entry);
  await set(nums[1], stop);
  await set(nums[2], size);
  await set(nums[3], target);
}

beforeEach(() => {
  clearJournal();
  window.localStorage.clear();
});
afterEach(cleanup);

describe("the form works at all", () => {
  it("renders without a screenshot store and without crashing", () => {
    render(<TradeForm />);
    expect(screen.getAllByText(/the numbers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThan(3);
  });

  it("shows no grade until there is something to grade", () => {
    render(<TradeForm />);
    expect(screen.getByText(/your grade appears here/i)).toBeTruthy();
  });

  it("grades as soon as an entry and a size are in", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user);
    expect(screen.getByText(/your grade so far/i)).toBeTruthy();
  });
});

describe("the size hint cannot recommend more than the account can buy", () => {
  /*
   * The bug: a 1-cent stop made the risk rule ask for 24,999 shares — $2.5m of
   * stock on a $25,000 account — and the button filled it in.
   */
  it("caps the suggestion at what the cash allows, and says so", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user, { entry: "100", stop: "99.99", size: "1" });

    const hint = screen.getByText(/only buys/i);
    expect(hint.textContent).toMatch(/250/);
    expect(hint.textContent).not.toMatch(/24,?999\s*$/);
    expect(hint.textContent?.toLowerCase()).toContain("too tight");
  });

  it("leaves an ordinary trade's suggestion alone", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user, { entry: "100", stop: "99", size: "1" });
    expect(screen.getByText(/limit allows/i).textContent).toMatch(/250/);
  });

  it("the use-that button fills in the capped number, not the raw one", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user, { entry: "100", stop: "99.99", size: "1" });
    await user.click(screen.getByRole("button", { name: /use that/i }));
    expect((screen.getAllByRole("spinbutton")[2] as HTMLInputElement).value).toBe("250");
  });
});

describe("the honest answers reach the saved trade", () => {
  /*
   * The bug: answering "no" lowered the grade on screen, then vanished at save,
   * so the journal regraded the trade as though the stop had been planned.
   */
  it("saves whether the stop was decided before entering", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user);

    const question = screen
      .getByText(/did you decide the stop before you got in/i)
      .closest("div")!.parentElement!;
    await user.click(within(question).getByRole("radio", { name: /^no$/i }));

    await user.click(screen.getByRole("button", { name: /save this trade/i }));

    const saved = loadTrades();
    expect(saved).toHaveLength(1);
    expect(saved[0].stopPlannedBeforeEntry).toBe(false);
  });

  it("saves the stop-moved answer too", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user);

    const question = screen
      .getByText(/did you move your stop further away/i)
      .closest("div")!.parentElement!;
    await user.click(within(question).getByRole("radio", { name: /^yes$/i }));
    await user.click(screen.getByRole("button", { name: /save this trade/i }));

    expect(loadTrades()[0].stopMovedAgainst).toBe(true);
  });

  it("a trade saved with a clean answer still grades clean", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user);
    await user.click(screen.getByRole("button", { name: /save this trade/i }));

    const saved = loadTrades()[0];
    expect(saved.stopPlannedBeforeEntry).toBe(true);
    expect(saved.entry).toBe(100);
    expect(saved.stop).toBe(99);
    expect(saved.size).toBe(250);
  });
});

describe("the headline never contradicts the grade beside it", () => {
  /*
   * The bug: the headline came from a pre-penalty letter, so a D could render
   * under "Nothing to fix" in the largest type on the card.
   */
  it("does not say nothing to fix when checks have failed", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user, { target: "" }); // no target -> a check fails

    const panel = screen.getByText(/your grade so far/i).closest("div")!.parentElement!;
    expect(panel.textContent?.toLowerCase()).not.toContain("nothing to fix");
    expect(panel.textContent).toMatch(/need work/i);
  });

  it("says nothing to fix only when the checklist is clean", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user);
    // a clean, closed, losing trade is the case that should say it
    const nums = screen.getAllByRole("spinbutton");
    await user.clear(nums[4]);
    await user.type(nums[4], "99");

    const panel = screen.getByText(/your grade so far/i).closest("div")!.parentElement!;
    expect(panel.textContent).toMatch(/nothing to fix|normal loss/i);
  });
});

describe("what the form refuses to do", () => {
  it("will not save without an entry and a size", () => {
    render(<TradeForm />);
    const save = screen.getByRole("button", { name: /save this trade/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    expect(loadTrades()).toHaveLength(0);
  });

  it("warns plainly when there is no stop rather than hiding it", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user, { stop: "" });
    await user.click(screen.getByRole("button", { name: /did not have a stop/i }));
    // it appears both beside the field and in the grade panel
    expect(screen.getAllByText(/no defined risk/i).length).toBeGreaterThan(0);
  });

  it("remembers the account size for the next trade", async () => {
    const user = userEvent.setup();
    render(<TradeForm />);
    await fillBasics(user);
    await user.click(screen.getByRole("button", { name: /save this trade/i }));
    expect(window.localStorage.getItem("ts:account:v1")).toBeTruthy();
  });
});
