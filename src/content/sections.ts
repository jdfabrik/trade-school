import type { Section, Unit } from "./types";

export const UNITS: Unit[] = [
  {
    id: "intro",
    number: "1.1",
    title: "Introduction",
    covers:
      "Python syntax, naming rules, data types, pip, libraries, function vs method vs property",
  },
  {
    id: "assets",
    number: "1.2",
    title: "Asset Selection",
    covers:
      "Pull S&P 1500 symbols, download prices with yfinance, compute returns, rank by expected return",
  },
  {
    id: "portfolio",
    number: "—",
    title: "Portfolio Optimization",
    covers:
      "skfolio: minimize risk or maximize Sharpe ratio, read composition weights",
  },
  {
    id: "bands",
    number: "2.2",
    title: "Bollinger Bands",
    covers: "Band construction, buy/sell logic, crossing signals",
  },
  {
    id: "strategies",
    number: "2.3",
    title: "Optimizing Strategies",
    covers:
      "vectorbt backtests, fees, benchmark comparison, range_split, overfitting, parameter grids",
  },
];

export const SECTIONS: Section[] = [
  {
    slug: "overview",
    number: 1,
    title: "Overview of Main Topics",
    blurb: "What each unit covers, and how the five fit together.",
    unit: "all",
  },
  {
    slug: "key-terms",
    number: 2,
    title: "Key Terms in Plain English",
    blurb: "Return, risk, Sharpe, adjusted close — the vocabulary everything else is built from.",
    unit: "all",
  },
  {
    slug: "python-syntax",
    number: 3,
    title: "Python Syntax Rules",
    blurb: "Naming, reserved keywords, data types, and the function/method/property distinction.",
    unit: "intro",
  },
  {
    slug: "formulas",
    number: 4,
    title: "Formulas Worth Memorizing",
    blurb: "Seven formulas and five worked examples to have in your head.",
    unit: "all",
  },
  {
    slug: "code",
    number: 5,
    title: "Core Code Blocks",
    blurb: "The canonical yfinance, skfolio and vectorbt workflows, annotated.",
    unit: "assets",
  },
  {
    slug: "bollinger-logic",
    number: 6,
    title: "Bollinger Bands Logic",
    blurb: "How the bands are built, what fires a signal, and why volatility changes everything.",
    unit: "bands",
  },
  {
    slug: "comparisons",
    number: 7,
    title: "Comparisons Likely to be Tested",
    blurb: "Eight pairs that look similar and are not.",
    unit: "all",
  },
  {
    slug: "pitfalls",
    number: 8,
    title: "Common Points of Confusion",
    blurb: "Fifteen mistakes that cost marks and money. Read this one twice.",
    unit: "all",
  },
  {
    slug: "rapid-review",
    number: 9,
    title: "Rapid Review",
    blurb: "The whole guide compressed to a single scannable list.",
    unit: "all",
  },
];

export function sectionBySlug(slug: string): Section | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

export function neighbours(slug: string): { prev?: Section; next?: Section } {
  const i = SECTIONS.findIndex((s) => s.slug === slug);
  if (i === -1) return {};
  return { prev: SECTIONS[i - 1], next: SECTIONS[i + 1] };
}

export function unitById(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}
