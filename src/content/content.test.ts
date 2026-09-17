/**
 * Integrity checks on the content itself. These catch the failure mode that
 * matters most for a teaching site: content that contradicts the engine, or a
 * quiz answer that disagrees with the reference page it links to.
 */
import { describe, it, expect } from "vitest";

import { FORMULAS } from "./formulas";
import { QUESTIONS } from "./questions";
import { GLOSSARY } from "./glossary";
import { CONFUSIONS, COMPARISONS } from "./confusions";
import { CODE_BLOCKS } from "./codeblocks";
import { SECTIONS } from "./sections";

const SLUGS = new Set(SECTIONS.map((s) => s.slug));

describe("formula calculators agree with the guide's worked answers", () => {
  for (const f of FORMULAS) {
    if (!f.example) continue;
    it(`${f.name}: ${f.example.note}`, () => {
      // compared at the precision the guide itself prints the answer to
      expect(f.compute(f.example!.values)).toBeCloseTo(
        f.example!.expected,
        f.example!.precision,
      );
    });
  }
});

describe("content integrity", () => {
  it("every id is unique across each collection", () => {
    const collections = [
      ["formulas", FORMULAS.map((x) => x.id)],
      ["questions", QUESTIONS.map((x) => x.id)],
      ["glossary", GLOSSARY.map((x) => x.id)],
      ["confusions", CONFUSIONS.map((x) => x.id)],
      ["comparisons", COMPARISONS.map((x) => x.id)],
      ["codeblocks", CODE_BLOCKS.map((x) => x.id)],
    ] as const;
    for (const [name, ids] of collections) {
      expect(new Set(ids).size, `${name} has duplicate ids`).toBe(ids.length);
    }
  });

  it("every cross-reference points at a section that exists", () => {
    const refs = [
      ...QUESTIONS.map((q) => q.sectionSlug),
      ...FORMULAS.map((f) => f.sectionSlug),
      ...CONFUSIONS.map((c) => c.sectionSlug),
      ...COMPARISONS.map((c) => c.sectionSlug),
      ...CODE_BLOCKS.map((c) => c.sectionSlug),
    ];
    for (const slug of refs) {
      expect(SLUGS.has(slug), `unknown section slug: ${slug}`).toBe(true);
    }
  });

  it("the fifteen confusion points are numbered 1..15 with no gaps", () => {
    const numbers = CONFUSIONS.map((c) => c.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it("every question carries an explanation", () => {
    for (const q of QUESTIONS) {
      expect(q.explanation.length, `${q.id} has no explanation`).toBeGreaterThan(20);
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

  it("error-spotting questions have both real errors and decoys, and no token is both", () => {
    const codeQs = QUESTIONS.filter((q) => q.kind === "code-errors");
    expect(codeQs.length).toBeGreaterThan(0);
    for (const q of codeQs) {
      if (q.kind !== "code-errors") continue;
      expect(q.errors.length).toBeGreaterThan(0);
      expect(q.decoys.length).toBeGreaterThan(0);

      const errorIds = new Set(q.errors.map((e) => e.tokenId));
      const decoyIds = new Set(q.decoys.map((d) => d.tokenId));
      for (const id of errorIds) {
        expect(decoyIds.has(id), `${q.id}: ${id} is both an error and a decoy`).toBe(false);
      }

      // every referenced token must actually exist in the rendered code
      const present = new Set(
        q.lines.flat().map((t) => t.tokenId).filter((x): x is string => Boolean(x)),
      );
      for (const id of [...errorIds, ...decoyIds]) {
        expect(present.has(id), `${q.id}: token ${id} is not in the code`).toBe(true);
      }
    }
  });

  it("anything not in the source PDF is marked as authored", () => {
    // The guide's question section starts at Q5, so Q1-Q4 must be authored.
    const authored = QUESTIONS.filter((q) => q.source === "authored");
    expect(authored.length).toBeGreaterThanOrEqual(4);
    for (const q of QUESTIONS) {
      expect(["guide", "authored"]).toContain(q.source);
    }
  });

  it("numeric questions have a tolerance that is not accidentally negative", () => {
    for (const q of QUESTIONS) {
      if (q.kind !== "numeric") continue;
      expect(q.tolerance).toBeGreaterThanOrEqual(0);
    }
  });
});
