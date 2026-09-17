import type { Tool } from "./types";
import {
  positionSize,
  breakevenWinRate,
  expectancy,
  plannedRR,
  riskPercent,
} from "@/lib/trade";

/**
 * Each calculator carries its own `compute`, so the lesson that explains it and
 * the tool that runs it cannot drift apart — they are the same function. The
 * `example` is checked by a test, so a tool here can never quietly start
 * disagreeing with the worked example printed in the lesson.
 */
export const TOOLS: Tool[] = [
  {
    id: "position-size",
    name: "Position size",
    purpose: "How many shares to take so that hitting your stop costs exactly what you intended.",
    formula: "(account × risk %) ÷ (entry − stop)",
    inputs: [
      { key: "account", label: "Account size", default: 25000, step: 500, suffix: "$" },
      { key: "riskPct", label: "Risk per trade", default: 1, step: 0.1, suffix: "%" },
      { key: "entry", label: "Entry price", default: 100, step: 0.01, suffix: "$" },
      { key: "stop", label: "Stop price", default: 99, step: 0.01, suffix: "$" },
    ],
    compute: (v) => positionSize(v.account, v.riskPct, v.entry, v.stop),
    unit: "units",
    example: {
      values: { account: 25000, riskPct: 1, entry: 100, stop: 99 },
      expected: 250,
      precision: 6,
      note: "Risking 1% of $25,000 with a $1 stop means 250 shares.",
    },
    lessonSlug: "position-sizing",
  },
  {
    id: "risk-check",
    name: "Risk check",
    purpose: "What percentage of your account a position you are already planning would actually risk.",
    formula: "(size × (entry − stop)) ÷ account × 100",
    inputs: [
      { key: "account", label: "Account size", default: 25000, step: 500, suffix: "$" },
      { key: "entry", label: "Entry price", default: 100, step: 0.01, suffix: "$" },
      { key: "stop", label: "Stop price", default: 99, step: 0.01, suffix: "$" },
      { key: "size", label: "Shares", default: 250, step: 10 },
    ],
    compute: (v) =>
      riskPercent({ entry: v.entry, stop: v.stop, size: v.size, accountSize: v.account }),
    unit: "percent",
    example: {
      values: { account: 25000, entry: 100, stop: 99, size: 250 },
      expected: 1,
      precision: 6,
      note: "250 shares with a $1 stop risks $250, which is 1% of $25,000.",
    },
    lessonSlug: "risk-first",
  },
  {
    id: "reward-risk",
    name: "Reward:risk",
    purpose: "How many times your risk you stand to make if the target is reached.",
    formula: "(target − entry) ÷ (entry − stop)",
    inputs: [
      { key: "entry", label: "Entry price", default: 100, step: 0.01, suffix: "$" },
      { key: "stop", label: "Stop price", default: 99, step: 0.01, suffix: "$" },
      { key: "target", label: "Target price", default: 103, step: 0.01, suffix: "$" },
    ],
    compute: (v) => plannedRR({ entry: v.entry, stop: v.stop, target: v.target }),
    unit: "ratio",
    example: {
      values: { entry: 100, stop: 99, target: 103 },
      expected: 3,
      precision: 6,
      note: "A $3 target against a $1 stop is 3:1.",
    },
    lessonSlug: "r-multiples",
  },
  {
    id: "breakeven",
    name: "Breakeven win rate",
    purpose: "How often you need to be right, at a given reward:risk, just to break even.",
    formula: "1 ÷ (1 + reward:risk) × 100",
    inputs: [{ key: "rr", label: "Reward:risk", default: 2, step: 0.1 }],
    compute: (v) => breakevenWinRate(v.rr),
    unit: "percent",
    example: {
      values: { rr: 3 },
      expected: 25,
      precision: 6,
      note: "At 3:1 you can be wrong three times out of four and still break even.",
    },
    lessonSlug: "r-multiples",
  },
  {
    id: "expectancy",
    name: "Expectancy",
    purpose: "What an average trade is worth, in R, given a win rate and a reward:risk.",
    formula: "(win % × reward) − (loss % × 1)",
    inputs: [
      { key: "winRate", label: "Win rate", default: 40, step: 1, suffix: "%" },
      { key: "rr", label: "Reward:risk", default: 2, step: 0.1 },
    ],
    compute: (v) => {
      const w = v.winRate / 100;
      return expectancy([...Array(1000)].map((_, i) => (i / 1000 < w ? v.rr : -1)));
    },
    unit: "ratio",
    example: {
      values: { winRate: 40, rr: 2 },
      expected: 0.2,
      precision: 6,
      note: "Winning 40% of the time at 2:1 is worth 0.2R per trade — a real edge.",
    },
    lessonSlug: "r-multiples",
  },
  {
    id: "drawdown",
    name: "Losing streak cost",
    purpose: "What a run of consecutive losses does to your account at a given risk per trade.",
    formula: "(1 − (1 − risk %)^losses) × 100",
    inputs: [
      { key: "riskPct", label: "Risk per trade", default: 1, step: 0.5, suffix: "%" },
      { key: "losses", label: "Losses in a row", default: 10, step: 1 },
    ],
    compute: (v) => (1 - Math.pow(1 - v.riskPct / 100, v.losses)) * 100,
    unit: "percent",
    example: {
      values: { riskPct: 10, losses: 10 },
      expected: 65.13,
      precision: 2,
      note: "Ten losses at 10% per trade costs 65% of the account. At 1% it costs 9.6%.",
    },
    lessonSlug: "risk-first",
  },
];

export function toolById(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}
