import type { Formula } from "./types";
import {
  simpleReturn,
  sharpe,
  riskPremium,
  cumulativeToPct,
  feeFromPercent,
  windowInBars,
} from "@/lib/metrics";
import { bandwidth } from "@/lib/bollinger";

/**
 * Each formula carries its own `compute`, so the reference page and the live
 * calculator cannot drift apart — they are the same function. The `example`
 * field holds the guide's worked answer, which the calculator page offers as a
 * preset so a learner can confirm the tool agrees with the source.
 */
export const FORMULAS: Formula[] = [
  {
    id: "return",
    name: "Return",
    expression: "(Ending value − Beginning value) / Beginning value",
    inputs: [
      { key: "begin", label: "Beginning value", default: 148.745, step: 0.001 },
      { key: "end", label: "Ending value", default: 138.857, step: 0.001 },
    ],
    compute: (v) => simpleReturn(v.begin, v.end) * 100,
    unit: "percent",
    example: {
      values: { begin: 148.745, end: 138.857 },
      expected: -6.65,
      precision: 2,
      note: "Agilent. Negative means the value decreased 6.65%.",
    },
    sectionSlug: "formulas",
    source: "guide",
  },
  {
    id: "risk-premium",
    name: "Risk premium",
    expression: "Expected return − risk-free rate",
    inputs: [
      { key: "expected", label: "Expected return (decimal)", default: 0.0919, step: 0.0001 },
      { key: "rf", label: "Risk-free rate (decimal)", default: 0.0016667, step: 0.0001 },
    ],
    compute: (v) => riskPremium(v.expected, v.rf),
    unit: "raw",
    sectionSlug: "formulas",
    source: "guide",
  },
  {
    id: "sharpe",
    name: "Sharpe ratio",
    expression: "(Expected return − risk-free rate) / SD of returns",
    inputs: [
      { key: "expected", label: "Expected monthly return (decimal)", default: 0.0919, step: 0.0001 },
      { key: "rf", label: "Monthly risk-free rate (decimal)", default: 0.0016667, step: 0.0001 },
      { key: "sd", label: "SD of monthly returns (decimal)", default: 0.14, step: 0.001 },
    ],
    compute: (v) => sharpe(v.expected, v.rf, v.sd),
    unit: "ratio",
    example: {
      values: { expected: 0.0919, rf: 0.02 / 12, sd: 0.14 },
      expected: 0.645,
      precision: 3,
      note: "A 2% annual risk-free rate becomes 0.02/12 = 0.0016667 monthly.",
    },
    sectionSlug: "formulas",
    source: "guide",
  },
  {
    id: "bandwidth",
    name: "Bandwidth",
    expression: "(alpha_upper + alpha_lower) × σ",
    inputs: [
      { key: "au", label: "Upper alpha", default: 3.6, step: 0.1 },
      { key: "al", label: "Lower alpha", default: 3.1, step: 0.1 },
      { key: "sigma", label: "σ (rolling SD)", default: 1, step: 0.1 },
    ],
    compute: (v) => bandwidth(v.au, v.al, v.sigma),
    unit: "raw",
    example: {
      values: { au: 3.6, al: 3.1, sigma: 1 },
      expected: 6.7,
      precision: 3,
      note: "Upper alpha 3.6 and lower alpha 3.1 give a gap of 6.7σ.",
    },
    sectionSlug: "formulas",
    source: "guide",
  },
  {
    id: "window",
    name: "Window in bars",
    expression: "Minutes desired ÷ minutes per bar",
    inputs: [
      { key: "minutes", label: "Minutes of moving average", default: 75, step: 5 },
      { key: "perBar", label: "Minutes per bar", default: 5, step: 1 },
    ],
    compute: (v) => windowInBars(v.minutes, v.perBar),
    unit: "bars",
    example: {
      values: { minutes: 75, perBar: 5 },
      expected: 15,
      precision: 0,
      note: "A 75-minute MA on 5-minute bars is window=15, not window=75.",
    },
    sectionSlug: "formulas",
    source: "guide",
  },
  {
    id: "cumulative",
    name: "Cumulative value to percent",
    expression: "(value − 1) × 100",
    inputs: [{ key: "value", label: "Cumulative value", default: 1.00794, step: 0.00001 }],
    compute: (v) => cumulativeToPct(v.value),
    unit: "percent",
    example: {
      values: { value: 1.00794 },
      expected: 0.794,
      precision: 3,
      note: "A cumulative value of 1.00794 is a profit of 0.794%.",
    },
    sectionSlug: "formulas",
    source: "guide",
  },
  {
    id: "fee",
    name: "Fee conversion",
    expression: "percent ÷ 100",
    inputs: [{ key: "percent", label: "Fee (%)", default: 0.1, step: 0.01 }],
    compute: (v) => feeFromPercent(v.percent),
    unit: "raw",
    example: {
      values: { percent: 0.1 },
      expected: 0.001,
      precision: 4,
      note: "0.1% is 0.001. Not 0.01, and not 0.1.",
    },
    sectionSlug: "formulas",
    source: "guide",
  },
];

export function formulaById(id: string): Formula | undefined {
  return FORMULAS.find((f) => f.id === id);
}
