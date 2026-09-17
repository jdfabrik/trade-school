import type { Question } from "./types";

/**
 * The source PDF's question section begins at Q5 — Q1 to Q4 are missing from the
 * document. The four questions marked `source: "authored"` at the top of this
 * file were written for this site to cover the units the surviving questions
 * skip. Everything marked `source: "guide"` is the guide's own question and its
 * own answer.
 */
export const QUESTIONS: Question[] = [
  /* ---------- authored, standing in for the missing Q1–Q4 ---------- */
  {
    id: "q1-naming",
    kind: "mcq",
    prompt: "Which of these is a legal Python object name?",
    choices: ["2023_returns", "import", "Import", "monthly returns"],
    answerIndex: 2,
    explanation:
      "Names may contain letters, numbers and underscores, and cannot start with a number or be a reserved keyword. Python is case sensitive, so `Import` is not the keyword `import` and is therefore legal. `2023_returns` starts with a digit, `import` is one of the 35 reserved keywords, and a name cannot contain a space.",
    sectionSlug: "python-syntax",
    unit: "intro",
    source: "authored",
  },
  {
    id: "q2-adjclose",
    kind: "mcq",
    prompt:
      "You are about to backtest a Bollinger Band strategy. Which price column do you feed it, and why?",
    choices: [
      "Adj Close, because it accounts for dividends and splits",
      "Close, because a strategy must trade at prices that actually existed",
      "Either — they are interchangeable for daily data",
      "Adj Close, because it is what pct_change() expects",
    ],
    answerIndex: 1,
    explanation:
      "Adj Close is for returns; Close is for strategies and Bollinger Bands. Adjusted closes are rewritten retroactively when dividends and splits occur, so backtesting on them means buying at prices nobody could ever have paid.",
    sectionSlug: "comparisons",
    unit: "bands",
    source: "authored",
  },
  {
    id: "q3-end-exclusive",
    kind: "mcq",
    prompt:
      "You want monthly prices up to and including December 2025. What do you pass as end=?",
    choices: ['end="2025-12-1"', 'end="2025-12-2"', 'end="2025-12-31"', 'end="2026-1-1"'],
    answerIndex: 1,
    explanation:
      'end= is always exclusive. To include 1 Dec 2025 you must pass a date after it, so "2025-12-2". start=, by contrast, is inclusive.',
    sectionSlug: "code",
    unit: "assets",
    source: "authored",
  },
  {
    id: "q4-dropna",
    kind: "numeric",
    prompt:
      "How many dropna() calls does the canonical asset-selection workflow need, and you should be able to say what each one is for?",
    answer: 2,
    tolerance: 0,
    explanation:
      "Two. One with axis=1 to drop whole assets that have missing price history, and one with the default axis=0 to drop the NaN first row that pct_change() always creates.",
    working: "dropna(axis=1) on the prices, then dropna() on the returns.",
    sectionSlug: "code",
    unit: "assets",
    source: "authored",
  },

  /* ---------- the guide's own questions ---------- */
  {
    id: "q5-sharpe",
    kind: "numeric",
    prompt:
      "SD of monthly returns is 14.00%, expected monthly return is 9.19%, and the annual risk-free rate is 2%. What is the Sharpe ratio?",
    answer: 0.645,
    tolerance: 0.005,
    explanation:
      "Convert the annual risk-free rate to monthly first: 0.02/12 = 0.0016667. Then (0.0919 − 0.0016667) / 0.14 = 0.645.",
    working: "(0.0919 − 0.02/12) / 0.14 = 0.0902333 / 0.14 = 0.645",
    sectionSlug: "formulas",
    unit: "portfolio",
    source: "guide",
  },
  {
    id: "q6-window",
    kind: "numeric",
    prompt:
      "Bollinger Bands use a 75-minute moving average on 5-minute bars. How many closes does the middle band average?",
    answer: 15,
    tolerance: 0,
    suffix: "closes",
    explanation:
      "75 ÷ 5 = 15 periods. The window is counted in BARS, not minutes — and the middle band is always a simple moving average, never a median and never a standard deviation.",
    working: "75 minutes ÷ 5 minutes per bar = 15 periods",
    sectionSlug: "bollinger-logic",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q7-bandwidth",
    kind: "numeric",
    prompt:
      "Upper alpha is 3.6 and lower alpha is 3.1. What is the distance between the bands, in multiples of σ?",
    answer: 6.7,
    tolerance: 0.001,
    suffix: "× σ",
    explanation:
      "Bandwidth is (alpha_upper + alpha_lower) × σ, so 3.6 + 3.1 = 6.7σ. Note that because the alphas differ, the middle band is NOT centred between the two bands.",
    working: "(3.6 + 3.1) × σ = 6.7σ",
    sectionSlug: "formulas",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q8-volatility",
    kind: "mcq",
    prompt: "As the volatility of closing prices increases, what happens to the bandwidth?",
    choices: [
      "It narrows, because the moving average smooths the noise",
      "It expands, because the half-widths are multiples of the rolling SD",
      "It is unchanged — only alpha controls the width",
      "It expands, but only if alpha is greater than 2",
    ],
    answerIndex: 1,
    explanation:
      "Both half-widths are alpha × σ, and σ is the rolling standard deviation of the closes. More volatile closes mean a larger σ, so the bands widen and fewer signals fire. When volatility falls the bands narrow — a 'squeeze' — and signals cluster.",
    sectionSlug: "bollinger-logic",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q9-errors",
    kind: "code-errors",
    prompt:
      "Click every error in this code. Some things that look wrong are perfectly fine — clicking those costs you.",
    lines: [
      [
        { text: 'SP1500 = read_csv("http://bit.ly/ASSETS_csv").' },
        { text: "symbol", tokenId: "symbol" },
        { text: "." },
        { text: "tolist()", tokenId: "tolist" },
      ],
      [
        { text: "PRICES = download(tickers=SP1500, " },
        { text: 'start="2022-12-1"', tokenId: "start" },
        { text: ", " },
        { text: 'end="2025-12-2"', tokenId: "end" },
        { text: "," },
      ],
      [
        { text: "                  " },
        { text: "auto_adjust=False", tokenId: "autoadjust" },
        { text: ", interval=" },
        { text: '"1mO"', tokenId: "interval" },
        { text: ")" },
      ],
    ],
    errors: [
      { tokenId: "symbol", why: "The column is Symbol with a capital S. Attribute access is case sensitive." },
      { tokenId: "interval", why: 'The interval string must be lowercase: "1mo", not "1mO".' },
    ],
    decoys: [
      { tokenId: "end", why: 'Correct as written — end= is exclusive, so "2025-12-2" is how you include 1 Dec 2025.' },
      { tokenId: "tolist", why: ".tolist() and .to_list() are both valid aliases." },
      { tokenId: "autoadjust", why: "Required, in fact — it is what keeps the separate Adj Close column." },
      { tokenId: "start", why: "Unpadded dates are fine. Python does not require 2022-12-01." },
    ],
    explanation:
      "Two errors: lowercase symbol should be .Symbol, and \"1mO\" should be \"1mo\". Everything else is correct as written.",
    sectionSlug: "code",
    unit: "assets",
    source: "guide",
  },
  {
    id: "q10-errors",
    kind: "code-errors",
    prompt:
      "The monthly risk-free rate is 0.1%. Click every error in this optimizer code.",
    lines: [
      [
        { text: "optimizer = MeanRisk(objective_function=ObjectiveFunction." },
        { text: "MAXIMIZE_RATIO", tokenId: "objective" },
        { text: "," },
      ],
      [
        { text: "                     risk_measure=RiskMeasure." },
        { text: "STANDARD_DEVIATION", tokenId: "riskmeasure" },
        { text: "," },
      ],
      [
        { text: "                     risk_free_rate=" },
        { text: "0.01", tokenId: "rate" },
        { text: ")" },
      ],
      [
        { text: "_SHARPEST", tokenId: "underscore" },
        { text: " = optimizer.fit_predict(MONTHLY[TOP5])" },
      ],
      [
        { text: "_SHARPEST." },
        { text: "composition()", tokenId: "composition" },
      ],
    ],
    errors: [
      { tokenId: "rate", why: "0.1% is 0.001, not 0.01. This is the single most expensive typo in the unit." },
      { tokenId: "composition", why: "composition is a property, so it never takes parentheses. Calling it raises TypeError." },
    ],
    decoys: [
      { tokenId: "underscore", why: "A leading underscore is a legal character in a Python name." },
      { tokenId: "objective", why: "MAXIMIZE_RATIO is correct here, and it is why risk_free_rate is required at all." },
      { tokenId: "riskmeasure", why: "MAXIMIZE_RATIO pairs with STANDARD_DEVIATION perfectly well." },
    ],
    explanation:
      "Two errors: 0.01 should be 0.001, and composition() should be composition. Also not an error: !pip install SKFolio would work, because pip package names are case insensitive.",
    sectionSlug: "code",
    unit: "portfolio",
    source: "guide",
  },

  /* ---------- drilled from the confusion list and the rapid review ---------- */
  {
    id: "q-iloc",
    kind: "mcq",
    prompt: "EXPECTED.nlargest(10) is in hand. How do you reach the 4th-highest asset?",
    choices: [".iloc[4]", ".iloc[3]", ".loc[4]", ".head(4)"],
    answerIndex: 1,
    explanation: "Zero-indexed. The 4th-highest is .iloc[3], just as the 6th split is split_5.",
    sectionSlug: "pitfalls",
    unit: "assets",
    source: "guide",
  },
  {
    id: "q-crossing",
    kind: "truefalse",
    prompt:
      "Using < instead of crossed_below produces the same trades, just written more simply.",
    answer: false,
    explanation:
      "It does not. Crossing is True only on the transition bar, while < is True on every bar the price sits outside the band. That fires more signals, pays more fees, and gives the wrong answer.",
    sectionSlug: "bollinger-logic",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q-middle-band",
    kind: "truefalse",
    prompt: "With an upper alpha of 3.6 and a lower alpha of 3.1, the middle band sits exactly halfway between the two bands.",
    answer: false,
    explanation:
      "When the alphas are asymmetric the middle band is not centred. The upper band is 3.6σ above it and the lower band only 3.1σ below it, so the midpoint of the envelope sits above the moving average.",
    sectionSlug: "bollinger-logic",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q-first-signal",
    kind: "mcq",
    prompt:
      "You start holding nothing. The chart shows an upper-band pierce, then a lower-band pierce, then another upper-band pierce. Which signal executes first?",
    choices: [
      "The first upper-band pierce — a sell",
      "The lower-band pierce — a buy",
      "Nothing executes; the signals conflict",
      "Both upper pierces, as short sales",
    ],
    answerIndex: 1,
    explanation:
      "You cannot sell what you do not own, so the first upper-band pierce is a distractor. The first signal that can execute is the buy at the lower band, and the sell is the first upper-band up-cross after it.",
    sectionSlug: "bollinger-logic",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q-nan-count",
    kind: "numeric",
    prompt: "With window=20, how many NaN values appear at the start of the band series?",
    answer: 19,
    tolerance: 0,
    suffix: "NaNs",
    explanation:
      "The first window − 1 values are NaN, so 19 of them. The bands start at bar 20. This is also why 'the second band value' means the second non-NaN value: .dropna().iloc[1].",
    working: "window − 1 = 20 − 1 = 19",
    sectionSlug: "bollinger-logic",
    unit: "bands",
    source: "guide",
  },
  {
    id: "q-composition",
    kind: "truefalse",
    prompt: "CALM.composition() returns the portfolio weights.",
    answer: false,
    explanation:
      "composition is a property, not a method. Adding parentheses raises TypeError. Properties — .index, .lower, .composition — never take them.",
    sectionSlug: "pitfalls",
    unit: "portfolio",
    source: "guide",
  },
  {
    id: "q-rf-required",
    kind: "mcq",
    prompt: "Which objective function requires you to pass risk_free_rate=?",
    choices: [
      "MINIMIZE_RISK",
      "MAXIMIZE_RATIO",
      "Both of them",
      "Neither — it always defaults to zero",
    ],
    answerIndex: 1,
    explanation:
      "MAXIMIZE_RATIO is maximising the Sharpe ratio, and the Sharpe ratio is defined in terms of the risk-free rate. MINIMIZE_RISK has no ratio to form, so it needs no rate.",
    sectionSlug: "comparisons",
    unit: "portfolio",
    source: "guide",
  },
  {
    id: "q-range-split-order",
    kind: "mcq",
    prompt: "What does DATA.Close.vbt.range_split(n=50, range_len=1100) return, in order?",
    choices: [
      "Dates first, then prices",
      "Prices first, then dates",
      "A single DataFrame of shape 50 × 1100",
      "A list of 50 Series",
    ],
    answerIndex: 1,
    explanation:
      "Prices first, dates second. n=50 gives columns split_0 through split_49, the result shape is 1100 × 50, and the intervals may overlap.",
    sectionSlug: "code",
    unit: "strategies",
    source: "guide",
  },
  {
    id: "q-fees",
    kind: "numeric",
    prompt: "A broker charges 0.1% per trade. What do you pass as fees=?",
    answer: 0.001,
    tolerance: 0.00001,
    explanation: "0.1% = 0.1/100 = 0.001. Not 0.01, and not 0.1.",
    working: "0.1 ÷ 100 = 0.001",
    sectionSlug: "pitfalls",
    unit: "strategies",
    source: "guide",
  },
  {
    id: "q-axis",
    kind: "mcq",
    prompt: "Which call drops the assets that have missing price history?",
    choices: [
      "ADJUSTED.dropna()",
      "ADJUSTED.dropna(axis=0)",
      "ADJUSTED.dropna(axis=1)",
      "ADJUSTED.dropna(how='all')",
    ],
    answerIndex: 2,
    explanation:
      "axis=1 drops columns, and each asset is a column. axis=0 drops rows and is the default — that is the one you use afterwards, on the returns, to remove the NaN first row.",
    sectionSlug: "comparisons",
    unit: "assets",
    source: "guide",
  },
  {
    id: "q-keywords",
    kind: "numeric",
    prompt: "How many reserved keywords does Python have?",
    answer: 35,
    tolerance: 0,
    suffix: "keywords",
    explanation:
      "35. They include from, import, True, False, None, and, or, not, if, class, def, lambda, global, nonlocal, assert, async, await and yield. None of them can be used as an object name.",
    sectionSlug: "python-syntax",
    unit: "intro",
    source: "guide",
  },
  {
    id: "q-case-sensitivity",
    kind: "mcq",
    prompt: "Where is Python NOT case sensitive?",
    choices: [
      "Attribute names like .Symbol",
      "Package names in pip install",
      "Boolean literals like True",
      "String arguments like interval=\"1mo\"",
    ],
    answerIndex: 1,
    explanation:
      "Everything in Python is case sensitive EXCEPT package names in pip install, so !pip install SKFolio works. That is why Import and install are legal object names while lowercase import is not, and why .symbol and \"1mO\" are both errors.",
    sectionSlug: "python-syntax",
    unit: "intro",
    source: "guide",
  },
  {
    id: "q-interval-limit",
    kind: "mcq",
    prompt: "Why does the 5-minute Bitcoin data come from an Excel file rather than from yfinance?",
    choices: [
      "yfinance does not support a 5-minute interval",
      "5-minute history is capped at 60 days",
      "Bitcoin is not on Yahoo Finance",
      "Excel files load faster",
    ],
    answerIndex: 1,
    explanation:
      'The intervals "2m", "5m", "15m" and "30m" are capped at 60 days of history. "1m" is capped at 7 days, "60m" and "90m" at 730 days, and the daily-and-longer intervals have no limit.',
    sectionSlug: "code",
    unit: "strategies",
    source: "guide",
  },
  {
    id: "q-shape",
    kind: "mcq",
    prompt: "A DataFrame has a Date index and 6 price columns. What is its shape?",
    choices: ["(n, 7)", "(n, 6)", "(6, n)", "(7, n)"],
    answerIndex: 1,
    explanation: "The index is not a column. Date plus 6 price columns gives shape (n, 6).",
    sectionSlug: "pitfalls",
    unit: "intro",
    source: "guide",
  },
  {
    id: "q-sp1500",
    kind: "mcq",
    prompt: "What makes up the S&P 1500?",
    choices: [
      "The 1500 largest US companies by market cap",
      "S&P 500 + S&P 400 MidCap + S&P 600 SmallCap",
      "S&P 500 + the 1000 next largest",
      "Every stock on the NYSE and NASDAQ",
    ],
    answerIndex: 1,
    explanation:
      "S&P 500 plus the S&P 400 MidCap ($8.0B–$22.7B) plus the S&P 600 SmallCap ($1.2B–$8.0B). Note that the S&P 500 holds more than 500 tickers, because some companies have multiple share classes — BRK-A and BRK-B, for instance.",
    sectionSlug: "rapid-review",
    unit: "assets",
    source: "guide",
  },
  {
    id: "q-overfitting",
    kind: "truefalse",
    prompt:
      "A strategy that beats buy-and-hold on every one of 50 range splits is definitely not overfitted.",
    answer: false,
    explanation:
      "Splits are the defence against overfitting, not a proof against it — and the guide notes the intervals may overlap, so they are not independent evidence. If the parameters were chosen by searching over the same history, strong results across splits still partly reflect that search.",
    sectionSlug: "pitfalls",
    unit: "strategies",
    source: "authored",
  },
];

export function questionsForSection(slug: string): Question[] {
  return QUESTIONS.filter((q) => q.sectionSlug === slug);
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
