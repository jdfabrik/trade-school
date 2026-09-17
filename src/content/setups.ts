import type { Setup } from "./types";

/**
 * A short, deliberately incomplete list. The lessons argue that a new trader
 * should work with two setups, not ten, so this offers a handful of well-known
 * ones to pick from rather than a catalogue to collect.
 *
 * These are described so they can be recognised and reviewed. None of them is a
 * recommendation, and none of them works reliably on its own.
 */
export const SETUPS: Setup[] = [
  {
    id: "opening-range-breakout",
    name: "Opening range breakout",
    description:
      "Let the first stretch of the session establish a high and a low, then trade a decisive break of one side.",
    conditions: [
      "Wait for a defined range — usually the first 15 to 30 minutes.",
      "Price closes beyond the range edge rather than just poking through it.",
      "Volume rises into the break rather than fading.",
    ],
    stopPlacement: "Just inside the opposite edge of the range.",
    failureMode:
      "The break fails and price snaps back through the range — common on quiet days when there is no real reason for the move.",
  },
  {
    id: "pullback-to-moving-average",
    name: "Pullback in a trend",
    description:
      "In a market that is already trending, wait for a pause back toward a moving average the trend has been respecting, then join in the direction of the trend.",
    conditions: [
      "An established trend, not a single big candle.",
      "A shallow pullback rather than a collapse.",
      "Some sign that the pullback is ending — a reversal candle, a hold of the average.",
    ],
    stopPlacement: "Beyond the low of the pullback, or the far side of the average.",
    failureMode:
      "The 'pullback' turns out to be the start of a reversal, and you are buying the first leg down.",
  },
  {
    id: "range-reversion",
    name: "Range fade",
    description:
      "In a market going sideways between two clear levels, sell near the top of the range and buy near the bottom.",
    conditions: [
      "At least two touches of each side, so the range is real.",
      "No strong trend and no major news pending.",
      "Entry close to the edge, so the stop can be tight.",
    ],
    stopPlacement: "Just beyond the range edge you are trading against.",
    failureMode:
      "The range breaks while you are positioned against it, which is precisely when the move is largest.",
  },
  {
    id: "vwap-reclaim",
    name: "VWAP reclaim",
    description:
      "Price falls below the volume-weighted average price, then pushes back above it and holds.",
    conditions: [
      "A clear loss of VWAP earlier in the session.",
      "A reclaim that holds for more than one bar.",
      "Entry on the retest from above rather than on the first touch.",
    ],
    stopPlacement: "Below the low of the reclaim attempt.",
    failureMode:
      "Price chops either side of VWAP repeatedly, stopping you out several times in a row.",
  },
  {
    id: "other",
    name: "Something else",
    description:
      "Your own setup. If you use this option, write the name into the reason field so the journal can still group it later.",
    conditions: ["You can describe it precisely enough for someone else to recognise it."],
    stopPlacement: "Wherever your idea is proved wrong.",
    failureMode: "Varies — which is why it needs writing down.",
  },
];

export function setupById(id: string): Setup | undefined {
  return SETUPS.find((s) => s.id === id);
}

/**
 * The named setups only. The "something else" catch-all is deliberately excluded:
 * a form offering it needs to pair it with a free-text field, so it adds that
 * option itself. Including it here too put it in the list twice.
 */
export const SETUP_NAMES = SETUPS.filter((s) => s.id !== "other").map((s) => s.name);

/** The id of the catch-all entry, for anything that needs to treat it specially. */
export const OTHER_SETUP_ID = "other";
