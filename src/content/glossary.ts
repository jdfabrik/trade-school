import type { GlossaryTerm } from "./types";

/**
 * `meaning` is the guide's own wording. `detail` is written for this site, for a
 * reader meeting the idea for the first time — the guide assumes a lecture has
 * already happened, and a newcomer arriving cold has not had one.
 */
export const GLOSSARY: GlossaryTerm[] = [
  {
    id: "return",
    term: "Return",
    meaning: "Proportional change in value: (end − begin) / begin.",
    detail:
      "Always a proportion, never a dollar amount. That is what makes a $3 move on a $30 stock comparable to a $300 move on a $3,000 one — both are 10%.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "monthly-return",
    term: "Monthly return",
    meaning: "Proportional change over one month. What .pct_change() computes.",
    detail:
      "Run on a monthly price series, `.pct_change()` gives one return per month — and a NaN in the first slot, because the first month has no month before it.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "expected-return",
    term: "Expected monthly return",
    meaning: "The long-run (arithmetic) average of monthly returns. .mean()",
    detail:
      "'Expected' is a statistician's word for 'average', not a forecast. It is what the asset did on average, offered as the best guess for what it does next.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "risk",
    term: "Risk",
    meaning: "Standard deviation of monthly returns. Higher SD = more volatile = riskier.",
    detail:
      "Note what this definition does NOT say: it does not mean the chance of losing money. A stock that reliably doubles every month has enormous 'risk' by this measure.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "risk-free-rate",
    term: "Risk-free rate",
    meaning: "Guaranteed return (T-bills, bank interest). Government cannot go bankrupt.",
    detail:
      "Quoted annually, so convert before mixing it with monthly returns: 2% annual is 0.02/12 per month.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "risk-premium",
    term: "Risk premium",
    meaning: "Expected return − risk-free return. Predicted reward for taking risk.",
    detail:
      "The part of a return you were paid for taking a chance. If an asset returns less than a T-bill, its risk premium is negative and you were not paid at all.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "sharpe",
    term: "Sharpe ratio",
    meaning: "Risk premium per unit of risk. Measure of risk-adjusted performance.",
    detail:
      "Lets you compare a calm asset with a wild one. A bigger Sharpe means more reward per unit of volatility endured — higher is better.",
    unit: "portfolio",
    source: "guide",
  },
  {
    id: "adj-close",
    term: "Adjusted close",
    meaning: "Price adjusted for dividends and splits. Used for returns.",
    detail:
      "Without the adjustment a 2-for-1 split looks like the stock halved overnight. Adjusted close rewrites history so the return series reflects what a holder actually earned. It also gets revised over time, which is why your numbers may not match a key exactly.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "close",
    term: "Close",
    meaning: "Raw traded price. Used for strategies and Bollinger Bands.",
    detail:
      "A strategy has to trade at prices that existed. Adjusted closes are retroactively rewritten, so backtesting on them would mean buying at prices nobody could have paid.",
    unit: "bands",
    source: "guide",
  },
  {
    id: "floating-shares",
    term: "Floating shares",
    meaning: "Shares actually available to the public, not insider-locked.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "adj-market-cap",
    term: "Adjusted market cap",
    meaning: "Stock price × floating shares.",
    unit: "assets",
    source: "guide",
  },
  {
    id: "bollinger-bands",
    term: "Bollinger Bands",
    meaning: "Moving average with bands at ± alpha standard deviations.",
    detail:
      "Three lines: a moving average in the middle, and one band above and one below, each set a chosen number of standard deviations away. The bands breathe as volatility changes.",
    unit: "bands",
    source: "guide",
  },
  {
    id: "benchmark",
    term: "Benchmark",
    meaning: "Passive buy-and-hold, used as the comparison line.",
    detail:
      "The honest question is never 'did my strategy make money?' but 'did it beat simply buying and holding?' Most do not.",
    unit: "strategies",
    source: "guide",
  },
  {
    id: "overfitting",
    term: "Overfitting",
    meaning:
      "Tuning a strategy to one segment of history so it fails in other regimes.",
    detail:
      "Search hard enough over enough parameters and you will always find a combination that would have worked beautifully on the past. That is a property of searching, not of the strategy.",
    unit: "strategies",
    source: "guide",
  },
  {
    id: "split",
    term: "Split (range split)",
    meaning:
      "One evenly spaced interval of the series, assumed to be a different market regime.",
    detail:
      "Not to be confused with a stock split. Here it means slicing the price history into chunks to see whether a strategy survives more than one stretch of market.",
    unit: "strategies",
    source: "guide",
  },
  {
    id: "library",
    term: "Library / package",
    meaning: "A set of functions and tools. Must be installed AND imported.",
    detail:
      "Installing puts the files on the machine, once. Importing makes them available to this session, every time.",
    unit: "intro",
    source: "guide",
  },
  {
    id: "module",
    term: "Module",
    meaning: "A single Python file inside a package (e.g. skfolio.optimization).",
    unit: "intro",
    source: "guide",
  },
  {
    id: "list",
    term: "List",
    meaning: "Data combined using square brackets.",
    unit: "intro",
    source: "guide",
  },
  {
    id: "mean-reversion",
    term: "Mean reversion",
    meaning:
      "The assumption that a price which has moved far from its average will move back toward it.",
    detail:
      "This is the bet the Bollinger strategy makes: buy when price falls far below the average, sell when it rises far above. It fails badly in a sustained trend, where 'far from average' just keeps getting farther.",
    unit: "bands",
    source: "authored",
  },
  {
    id: "drawdown",
    term: "Drawdown",
    meaning: "The fall from a portfolio's peak value to its subsequent trough.",
    detail:
      "Not in the source guide, but it is what `plot_drawdowns` charts, and it is the number that tells you whether a strategy was survivable in practice.",
    unit: "strategies",
    source: "authored",
  },
];

export function termById(id: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.id === id);
}
