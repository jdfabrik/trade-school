/**
 * Content types.
 *
 * Everything from the study guide is stored as data rather than prose, because
 * each record is consumed three times over: once by a reference page, once by
 * the quiz generator, and once by search. Writing it as JSX would mean
 * maintaining the same fact in three places.
 *
 * `source` marks provenance. "guide" means the fact is in the source PDF.
 * "authored" means it was written for this site — most importantly the four
 * missing questions, since the PDF's question section begins at Q5.
 */
export type Source = "guide" | "authored";

export type UnitId =
  | "intro"
  | "assets"
  | "portfolio"
  | "bands"
  | "strategies";

export interface Unit {
  id: UnitId;
  number: string;
  title: string;
  covers: string;
}

export interface Section {
  slug: string;
  number: number;
  title: string;
  blurb: string;
  unit: UnitId | "all";
}

export interface GlossaryTerm {
  id: string;
  term: string;
  meaning: string;
  /** Extra context written for a newcomer, beyond the guide's one-liner. */
  detail?: string;
  unit: UnitId;
  source: Source;
}

export interface Formula {
  id: string;
  name: string;
  /** Plain-text formula as the guide states it. */
  expression: string;
  /** Named inputs for the live calculator. */
  inputs: { key: string; label: string; default: number; step?: number }[];
  /** Pure function of the inputs, in the same order as `inputs`. */
  compute: (values: Record<string, number>) => number;
  /** How to render the result. */
  unit: "percent" | "ratio" | "bars" | "raw";
  /**
   * A worked example straight from the guide, used to self-check the calculator.
   * `precision` is the number of decimal places the guide states the answer to —
   * the guide prints Agilent as -6.65%, but the exact value is -6.647618...
   */
  example?: {
    values: Record<string, number>;
    expected: number;
    precision: number;
    note: string;
  };
  sectionSlug: string;
  source: Source;
}

export interface Confusion {
  id: string;
  number: number;
  title: string;
  body: string;
  sectionSlug: string;
  source: Source;
}

export interface Comparison {
  id: string;
  a: string;
  b: string;
  distinction: string;
  sectionSlug: string;
  source: Source;
}

export interface CodeBlock {
  id: string;
  title: string;
  language: "python";
  code: string;
  /** Line-by-line annotations, keyed by zero-based line index. */
  notes?: { line: number; text: string }[];
  blurb?: string;
  sectionSlug: string;
  source: Source;
}

/* ---------- quiz ---------- */

export interface BaseQuestion {
  id: string;
  prompt: string;
  explanation: string;
  sectionSlug: string;
  unit: UnitId;
  source: Source;
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
  /** Absolute tolerance, so 0.645 and 0.6445 both pass. */
  tolerance: number;
  suffix?: string;
  /** Shown after submitting: the formula with the numbers substituted in. */
  working?: string;
}

/**
 * Error-spotting. The code is split into tokens; some are genuinely wrong and
 * some are the guide's explicit NON-errors, which are there to be left alone.
 * Clicking a decoy costs you, because telling the two apart is the whole skill.
 */
export interface CodeErrorQuestion extends BaseQuestion {
  kind: "code-errors";
  /** Lines of code, each an array of tokens. */
  lines: { text: string; tokenId?: string }[][];
  errors: { tokenId: string; why: string }[];
  decoys: { tokenId: string; why: string }[];
}

export type Question =
  | McqQuestion
  | TrueFalseQuestion
  | NumericQuestion
  | CodeErrorQuestion;
