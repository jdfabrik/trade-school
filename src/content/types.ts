/**
 * Content types.
 *
 * Everything the site teaches is stored as data rather than as prose inside a
 * page, because each piece gets used more than once: a lesson feeds the lesson
 * page, the drill questions and the search. Writing it into components would
 * mean keeping the same fact correct in three places.
 */

export type Topic =
  | "risk"
  | "sizing"
  | "stops"
  | "measuring"
  | "setups"
  | "journal"
  | "psychology";

export interface Lesson {
  slug: string;
  number: number;
  title: string;
  /** One line, shown on cards and in search results. */
  blurb: string;
  topic: Topic;
  /** Roughly how long it takes to read. */
  minutes: number;
  blocks: Block[];
  /** The one thing to remember. */
  takeaway: string;
}

export interface Block {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  /** A worked number, shown in a box. */
  worked?: { title: string; lines: string[]; answer: string };
  callout?: { tone: "warn" | "note"; text: string };
  table?: { head: string[]; rows: string[][] };
}

export interface Term {
  id: string;
  term: string;
  meaning: string;
  /** Why it matters in practice, for someone meeting it for the first time. */
  detail?: string;
  topic: Topic;
}

export interface Tool {
  id: string;
  name: string;
  /** Plain-English statement of what it works out. */
  purpose: string;
  formula: string;
  inputs: { key: string; label: string; default: number; step?: number; suffix?: string }[];
  compute: (values: Record<string, number>) => number;
  /** How to show the answer. */
  unit: "money" | "units" | "percent" | "ratio";
  /** A worked example, used as a preset and checked by a test. */
  example?: {
    values: Record<string, number>;
    expected: number;
    precision: number;
    note: string;
  };
  lessonSlug: string;
}

export interface Setup {
  id: string;
  name: string;
  /** What you are actually looking at. */
  description: string;
  /** What has to be true before you take it. */
  conditions: string[];
  /** Where the stop belongs for this pattern. */
  stopPlacement: string;
  /** The way this setup usually goes wrong. */
  failureMode: string;
}

/* ---------------------------------- drills --------------------------------- */

export interface BaseQuestion {
  id: string;
  prompt: string;
  explanation: string;
  lessonSlug: string;
  topic: Topic;
}

export interface McqQuestion extends BaseQuestion {
  kind: "mcq";
  choices: string[];
  answerIndex: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  kind: "truefalse";
  answer: boolean;
}

export interface NumericQuestion extends BaseQuestion {
  kind: "numeric";
  answer: number;
  /** Absolute tolerance, so sensible rounding still counts as right. */
  tolerance: number;
  suffix?: string;
  /** The sum, shown after answering. */
  working?: string;
}

/**
 * Show a trade and ask whether it was well taken. The catch is that some of
 * these made money and were still bad trades, which is the habit the drill is
 * built to break.
 */
export interface JudgementQuestion extends BaseQuestion {
  kind: "judgement";
  scenario: {
    summary: string;
    facts: string[];
    /** What happened to the money. Deliberately not the answer. */
    outcome: string;
  };
  /** Was this a well-taken trade? */
  answer: boolean;
}

export type Question =
  | McqQuestion
  | TrueFalseQuestion
  | NumericQuestion
  | JudgementQuestion;
