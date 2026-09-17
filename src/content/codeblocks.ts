import type { CodeBlock } from "./types";

export const CODE_BLOCKS: CodeBlock[] = [
  {
    id: "asset-selection",
    title: "Asset selection — the canonical question",
    language: "python",
    blurb:
      "Pull the index membership, download three years of monthly prices, turn them into returns, and rank. Almost every exam question about unit 1.2 is a variation on these nine lines.",
    code: `!pip install --upgrade yfinance
from pandas import read_csv
from yfinance import download

SP1500 = read_csv("http://bit.ly/ASSETS_csv").Symbol.tolist()
PRICES = download(tickers=SP1500, start="2023-1-1", end="2026-1-2",
                  auto_adjust=False, interval="1mo")

ADJUSTED = PRICES["Adj Close"].dropna(axis=1)
MONTHLY  = ADJUSTED.pct_change().dropna()
EXPECTED = MONTHLY.mean()
TOP10    = EXPECTED.nlargest(10) * 100
round(TOP10.iloc[3], 2)`,
    notes: [
      { line: 0, text: "Installing is a one-off. The import on the next line is needed every session." },
      { line: 4, text: ".Symbol is capitalised — attribute access is case sensitive." },
      { line: 5, text: "end= is exclusive. To include 1 Dec 2025 you would pass \"2025-12-2\"." },
      { line: 6, text: "auto_adjust=False keeps the separate Adj Close column alongside the raw prices." },
      { line: 8, text: "axis=1 drops whole assets that have any missing history." },
      { line: 9, text: "The second dropna() removes the NaN first row that pct_change() always creates." },
      { line: 11, text: "Multiply by 100 BEFORE rounding, or 0.0234 rounds to 0.02 instead of 2.34." },
      { line: 12, text: "Zero-indexed: .iloc[3] is the 4th-highest asset." },
    ],
    sectionSlug: "code",
    source: "guide",
  },
  {
    id: "nlargest-equivalent",
    title: "Equivalent to nlargest(10)",
    language: "python",
    code: `EXPECTED.sort_values(ascending=False).head(n=10)`,
    blurb: "Same result, more typing. head() returns 5 rows by default and n is its first argument.",
    sectionSlug: "code",
    source: "guide",
  },
  {
    id: "read-excel",
    title: "Reading intraday data from Excel",
    language: "python",
    code: `from pandas import read_excel

DATA = read_excel(io="BITCOIN.xlsx", index_col=0)`,
    blurb:
      "The 60-day ceiling on 5-minute history is why intraday Bitcoin and Apple data comes from a spreadsheet rather than from yfinance.",
    sectionSlug: "code",
    source: "guide",
  },
  {
    id: "skfolio-minrisk",
    title: "Portfolio optimization — minimize risk",
    language: "python",
    code: `!pip install skfolio
from skfolio import RiskMeasure
from skfolio.optimization import ObjectiveFunction, MeanRisk

ENGINE = MeanRisk(objective_function=ObjectiveFunction.MINIMIZE_RISK,
                  risk_measure=RiskMeasure.STANDARD_DEVIATION)
CALM = ENGINE.fit_predict(MONTHLY[TOP10])
CALM.composition * 25000`,
    notes: [
      { line: 4, text: "MINIMIZE_RISK needs no risk-free rate — there is no ratio being maximised." },
      { line: 6, text: "fit_predict fits the optimizer to historic data and predicts the optimal portfolio." },
      { line: 7, text: "composition is a PROPERTY. Adding () raises TypeError. Weights are decimal ratios, so multiply by the investment amount for dollars." },
    ],
    sectionSlug: "code",
    source: "guide",
  },
  {
    id: "skfolio-sharpe",
    title: "Portfolio optimization — maximize Sharpe",
    language: "python",
    code: `engine = MeanRisk(objective_function=ObjectiveFunction.MAXIMIZE_RATIO,
                  risk_measure=RiskMeasure.STANDARD_DEVIATION,
                  risk_free_rate=0.02/12)
SHARP = engine.fit_predict(MONTHLY[TOP10])
SHARP.composition * 25000`,
    notes: [
      { line: 2, text: "MAXIMIZE_RATIO requires risk_free_rate=. An annual 2% becomes 0.02/12 monthly." },
    ],
    sectionSlug: "code",
    source: "guide",
  },
  {
    id: "vectorbt-bbands",
    title: "Bollinger Bands and backtest",
    language: "python",
    code: `!pip install vectorbt
from vectorbt import *

BB   = BBANDS.run(COIN.Close, window=20, alpha=2)
BUY  = BB.close_crossed_below(BB.lower)
SELL = BB.close_crossed_above(BB.upper)

STRATEGY = Portfolio.from_signals(COIN.Close, entries=BUY, exits=SELL, fees=0.001)
STRATEGY.plots(["orders","cum_returns"]).show()`,
    notes: [
      { line: 3, text: "Close, not Adj Close — a strategy must trade at prices that actually existed." },
      { line: 4, text: "crossed_below, not <. Crossing is True only on the transition bar; < is true on every bar the price sits outside the band." },
      { line: 5, text: "BB.lower and BB.upper are properties, so no parentheses." },
      { line: 7, text: "fees=0.001 is 0.1%." },
    ],
    blurb:
      "Single-plot methods: plot_orders, plot_cum_returns, plot_cash, plot_drawdowns, plot_trades, plot_value, plot_underwater.",
    sectionSlug: "code",
    source: "guide",
  },
  {
    id: "range-split",
    title: "Splitting history into regimes",
    language: "python",
    code: `PRICES, DATES = DATA.Close.vbt.range_split(n=50, range_len=1100)

CHART = DATA.Close.vbt.range_split(n=50, range_len=1100, plot=True)
CHART.update_layout(height=500, template="plotly_dark")
CHART.show()`,
    notes: [
      { line: 0, text: "Output order is prices first, dates second. n=50 gives columns split_0 … split_49, so the 6th split is split_5. Result shape is 1100 × 50, and intervals may overlap." },
      { line: 3, text: "Plotly themes: ggplot2, none, plotly, plotly_white, plotly_dark, seaborn, simple_white." },
    ],
    blurb:
      "Splitting the history into intervals tests whether a strategy survives more than one market regime — the direct defence against overfitting.",
    sectionSlug: "code",
    source: "guide",
  },
];

export const DOWNLOAD_ARGS = [
  { arg: "tickers=", meaning: "One symbol string or a list." },
  { arg: "start=", meaning: '"YYYY-M-D", inclusive.' },
  { arg: "end=", meaning: 'Always exclusive. To include 1 Dec 2025 pass "2025-12-2".' },
  {
    arg: "auto_adjust=False",
    meaning: "Returns raw traded prices AND keeps the separate Adj Close column.",
  },
  { arg: "interval=", meaning: "Bar size, lowercase string." },
  { arg: "multi_level_index=False", meaning: "Single-level columns, easier for one asset." },
];

export const INTERVAL_LIMITS = [
  { interval: '"1m"', maxHistory: "7 days" },
  { interval: '"2m", "5m", "15m", "30m"', maxHistory: "60 days" },
  { interval: '"60m", "90m"', maxHistory: "730 days" },
  { interval: '"1d", "5d", "1wk", "1mo", "3mo"', maxHistory: "No limit" },
];
