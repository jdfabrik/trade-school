/**
 * The three sections that are prose rather than tables, plus the small reference
 * tables that belong to them.
 */

export const DATA_TYPES = [
  { type: "int", example: "89", rule: "Whole number, quantitative." },
  { type: "float", example: "13.244", rule: "Decimal number, quantitative." },
  {
    type: "string",
    example: '"HSY", "2018-01-01"',
    rule: "Filenames, categories, colors, dates. Must be in straight quotes, single or double.",
  },
  {
    type: "Boolean",
    example: "True, False",
    rule: "Initial capital only, no quotes. What crossed_below() returns.",
  },
  { type: "list", example: "['AA','AAL']", rule: "Data in square brackets." },
];

export const RESERVED_KEYWORDS_SAMPLE = [
  "from",
  "import",
  "True",
  "False",
  "None",
  "and",
  "or",
  "not",
  "if",
  "class",
  "def",
  "lambda",
  "global",
  "nonlocal",
  "assert",
  "async",
  "await",
  "yield",
];

export const CALLABLE_KINDS = [
  {
    kind: "Function",
    rule: "Stands alone.",
    example: "round(TOP10.iloc[3], 2)",
  },
  {
    kind: "Method",
    rule: "Reached through the dot operator, and takes parentheses.",
    example: "EXPECTED.nlargest(10)",
  },
  {
    kind: "Property",
    rule: "Reached through the dot operator, and never takes parentheses.",
    example: "CALM.composition",
  },
];

export interface ProseBlock {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: { tone: "warn" | "note"; text: string };
}

export const SYNTAX_PROSE: ProseBlock[] = [
  {
    heading: "Naming an object",
    paragraphs: [
      "Letters, numbers and underscores only. A name cannot start with a number, and cannot be one of the reserved keywords. The = sign assigns right to left: the thing on the right becomes the name on the left.",
    ],
  },
  {
    heading: "Reserved keywords",
    paragraphs: [
      "There are 35 of them. They are the words Python has already claimed, so you cannot use them as names of your own.",
    ],
  },
  {
    heading: "Case sensitivity",
    paragraphs: [
      "Everything in Python is case sensitive EXCEPT package names in pip install. So Import and install are perfectly legal object names, while lowercase import is not — it is a keyword.",
    ],
    callout: {
      tone: "warn",
      text: 'This cuts both ways in practice. !pip install SKFolio works fine, but .symbol instead of .Symbol fails, and interval="1mO" fails.',
    },
  },
  {
    heading: "Installing is not importing",
    paragraphs: [
      "Installing puts the package on the machine, and you do it once. Importing makes it available to the current session, and you do it every single time. pip stands for Preferred Installer Program — or, if you prefer, 'pip installs packages'.",
    ],
  },
];

export const BOLLINGER_PROSE: ProseBlock[] = [
  {
    heading: "How the three lines are built",
    bullets: [
      "Middle band = the simple moving average of the previous `window` closes. Never a median, never a standard deviation.",
      "Upper = MA + alpha_upper × σ. Lower = MA − alpha_lower × σ.",
      "σ is the rolling standard deviation over the same window.",
      "The first `window − 1` values are NaN, so the bands start at bar `window`.",
    ],
  },
  {
    heading: "What fires a signal",
    bullets: [
      "BUY when the close crosses BELOW the lower band. The asset may be oversold, and a price increase may be imminent.",
      "SELL when the close crosses ABOVE the upper band. The asset may be overbought, and a price decline may be imminent.",
    ],
    paragraphs: [
      "This is a mean-reversion strategy: it bets that a price which has moved far from its average will move back toward it. That bet loses in a sustained trend, where 'far from average' simply keeps getting farther.",
    ],
  },
  {
    heading: "Cause and effect",
    bullets: [
      "Volatility of closes rises → σ rises → bands widen → fewer signals fire.",
      "Volatility falls → bands narrow (a 'squeeze') → signals cluster.",
    ],
    callout: {
      tone: "warn",
      text: "Using < or > instead of the crossing functions makes a signal fire on every bar the price sits outside the band. More trades, more fee drag, wrong answer. Try it yourself in the lab — the toggle is right there on the chart.",
    },
  },
  {
    heading: "Asymmetric alphas",
    paragraphs: [
      "If the alphas differ — say 3.6 up and 3.1 down — the middle band is NOT centred between the bands. The envelope is lopsided, even though the moving average running through it is not.",
    ],
  },
  {
    heading: "The chart-reading rule",
    paragraphs: [
      "If you start holding nothing, the first signal that can execute is a buy. An upper-band pierce before any buy is a distractor, because you cannot sell what you do not own. The sell is the first upper-band up-cross AFTER the buy.",
    ],
  },
];

export const RAPID_REVIEW: string[] = [
  "35 reserved keywords. Names: letters, numbers, underscore; no leading digit; no keyword.",
  "Expected monthly return = the long-run average of monthly returns.",
  "Risk = SD of monthly returns.",
  "Sharpe = (E[r] − rf) / σ. A bigger Sharpe is superior risk-adjusted performance.",
  "end= is exclusive, always. start= is inclusive.",
  "auto_adjust=False keeps the Adj Close column.",
  "Adj Close → returns. Close → strategies.",
  "axis=1 drops columns; axis=0 drops rows and is the default.",
  "4th-highest = .iloc[3].",
  "Window counts bars: minutes ÷ bar size.",
  "Upper = MA + ασ, Lower = MA − ασ, bandwidth = (α_up + α_low)σ.",
  "Buy below the lower band, sell above the upper band.",
  "Higher volatility → wider bands.",
  "fees=0.001 is 0.1%.",
  "range_split returns prices then dates; splits are zero-indexed and may overlap.",
  "Properties (.index, .lower, .composition) take no parentheses.",
  "Cumulative 1.00794 = +0.794%.",
  "S&P 1500 = S&P 500 + S&P 400 MidCap ($8.0B–$22.7B) + S&P 600 SmallCap ($1.2B–$8.0B).",
  "The S&P 500 holds more than 500 tickers because of multiple share classes (BRK-A, BRK-B).",
  "Tesla demo: $10,000 passive → $9,964; the Bollinger strategy → $14,869. The advantage comes from sitting out the drops.",
];
