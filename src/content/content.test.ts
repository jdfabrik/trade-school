/**
 * Integrity checks on the teaching content.
 *
 * The one that matters most: every calculator on the site must still reproduce
 * the worked answer printed in the lesson that explains it. If a tool and a
 * lesson ever disagreed, a trader would be taught one thing and shown another.
 */
import { describe, it, expect } from "vitest";

import { LESSONS, lessonBySlug, lessonNeighbours } from "./lessons";
import { GLOSSARY } from "./glossary";
import { TOOLS } from "./tools";
import { QUESTIONS } from "./questions";
import { SETUPS, SETUP_NAMES } from "./setups";
import { DATA_NOTICE } from "@/data/index";

const SLUGS = new Set(LESSONS.map((l) => l.slug));

describe("calculators agree with the lessons", () => {
  for (const tool of TOOLS) {
    if (!tool.example) continue;
    it(`${tool.name}: ${tool.example.note}`, () => {
      expect(tool.compute(tool.example!.values)).toBeCloseTo(
        tool.example!.expected,
        tool.example!.precision,
      );
    });
  }
});

describe("content integrity", () => {
  it("ids are unique within each collection", () => {
    const groups = [
      ["lessons", LESSONS.map((x) => x.slug)],
      ["glossary", GLOSSARY.map((x) => x.id)],
      ["tools", TOOLS.map((x) => x.id)],
      ["questions", QUESTIONS.map((x) => x.id)],
      ["setups", SETUPS.map((x) => x.id)],
    ] as const;
    for (const [name, ids] of groups) {
      expect(new Set(ids).size, `${name} has duplicate ids`).toBe(ids.length);
    }
  });

  it("lessons are numbered 1..9 with no gaps", () => {
    const numbers = LESSONS.map((l) => l.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 9 }, (_, i) => i + 1));
  });

  it("every cross-reference points at a lesson that exists", () => {
    for (const q of QUESTIONS) {
      expect(SLUGS.has(q.lessonSlug), `question ${q.id} -> ${q.lessonSlug}`).toBe(true);
    }
    for (const t of TOOLS) {
      expect(SLUGS.has(t.lessonSlug), `tool ${t.id} -> ${t.lessonSlug}`).toBe(true);
    }
  });

  it("prev/next navigation is consistent in both directions", () => {
    for (let i = 0; i < LESSONS.length; i += 1) {
      const { prev, next } = lessonNeighbours(LESSONS[i].slug);
      expect(prev?.slug).toBe(LESSONS[i - 1]?.slug);
      expect(next?.slug).toBe(LESSONS[i + 1]?.slug);
    }
    expect(lessonBySlug("nope")).toBeUndefined();
  });

  it("every lesson has a takeaway and at least one block", () => {
    for (const l of LESSONS) {
      expect(l.takeaway.length, `${l.slug} takeaway`).toBeGreaterThan(30);
      expect(l.blocks.length, `${l.slug} blocks`).toBeGreaterThan(0);
      expect(l.minutes).toBeGreaterThan(0);
    }
  });

  it("every lesson table is rectangular", () => {
    for (const l of LESSONS) {
      for (const b of l.blocks) {
        if (!b.table) continue;
        for (const row of b.table.rows) {
          expect(row.length, `${l.slug}: ragged table row`).toBe(b.table.head.length);
        }
      }
    }
  });

  it("every question carries an explanation worth reading", () => {
    for (const q of QUESTIONS) {
      expect(q.explanation.length, `${q.id}`).toBeGreaterThan(40);
    }
  });

  it("multiple-choice answers point at a real choice", () => {
    for (const q of QUESTIONS) {
      if (q.kind !== "mcq") continue;
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(q.choices.length);
    }
  });

  it("judgement scenarios state an outcome separately from the verdict", () => {
    const judgements = QUESTIONS.filter((q) => q.kind === "judgement");
    expect(judgements.length).toBeGreaterThanOrEqual(4);
    for (const q of judgements) {
      if (q.kind !== "judgement") continue;
      expect(q.scenario.facts.length).toBeGreaterThan(1);
      expect(q.scenario.outcome.length).toBeGreaterThan(10);
    }
  });

  /**
   * The point of the judgement drill: at least one trade that MADE MONEY must
   * still be graded a bad trade, and at least one that LOST must be graded good.
   * Without both, the drill quietly teaches that profit equals quality.
   */
  it("includes profitable bad trades and losing good ones", () => {
    const judgements = QUESTIONS.filter((q) => q.kind === "judgement");
    const madeMoney = (text: string) => /profit|\bmade\b|\+\d/i.test(text);
    const lostMoney = (text: string) => /loss|stopped out/i.test(text);

    const profitableButBad = judgements.filter(
      (q) => q.kind === "judgement" && !q.answer && madeMoney(q.scenario.outcome),
    );
    const losingButGood = judgements.filter(
      (q) => q.kind === "judgement" && q.answer && lostMoney(q.scenario.outcome),
    );

    expect(profitableButBad.length).toBeGreaterThan(0);
    expect(losingButGood.length).toBeGreaterThan(0);
  });

  it("numeric tolerances are never negative", () => {
    for (const q of QUESTIONS) {
      if (q.kind !== "numeric") continue;
      expect(q.tolerance).toBeGreaterThanOrEqual(0);
    }
  });

  it("the setup picker list has no duplicates and excludes the catch-all", () => {
    // A form offering "something else" pairs it with a free-text field and adds
    // that option itself, so shipping it in this list too showed it twice.
    expect(new Set(SETUP_NAMES).size).toBe(SETUP_NAMES.length);
    expect(SETUP_NAMES).not.toContain("Something else");
    expect(SETUP_NAMES.length).toBe(SETUPS.length - 1);
  });

  it("every setup says where the stop goes and how it fails", () => {
    for (const s of SETUPS) {
      expect(s.stopPlacement.length, `${s.id}`).toBeGreaterThan(10);
      expect(s.failureMode.length, `${s.id}`).toBeGreaterThan(10);
    }
  });

  it("no content still refers to the programming course this site replaced", () => {
    const banned =
      /\bpython\b|pandas|vectorbt|skfolio|yfinance|\bnumpy\b|jupyter|backtest|\brepo\b|\bcodebase\b|localstorage|indexeddb|deterministic/i;
    const corpus = [
      ...LESSONS.flatMap((l) => [
        l.title,
        l.blurb,
        l.takeaway,
        ...l.blocks.flatMap((b) => [
          b.heading ?? "",
          ...(b.paragraphs ?? []),
          ...(b.bullets ?? []),
          b.callout?.text ?? "",
          ...(b.table ? [...b.table.head, ...b.table.rows.flat()] : []),
          ...(b.worked ? [b.worked.title, b.worked.answer, ...b.worked.lines] : []),
        ]),
      ]),
      ...GLOSSARY.flatMap((t) => [t.term, t.meaning, t.detail ?? ""]),
      ...QUESTIONS.flatMap((q) => [
        q.prompt,
        q.explanation,
        ...(q.kind === "mcq" ? q.choices : []),
        ...(q.kind === "judgement"
          ? [q.scenario.summary, q.scenario.outcome, ...q.scenario.facts]
          : []),
      ]),
      ...TOOLS.flatMap((t) => [t.name, t.purpose, t.formula, t.example?.note ?? ""]),
      ...SETUPS.flatMap((s) => [
        s.name,
        s.description,
        s.stopPlacement,
        s.failureMode,
        ...s.conditions,
      ]),
      DATA_NOTICE,
    ];
    for (const text of corpus) {
      expect(banned.test(text), `leftover jargon: "${text.slice(0, 70)}"`).toBe(false);
    }
  });
});
