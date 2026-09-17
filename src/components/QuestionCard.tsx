"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Question } from "@/content/types";
import { sectionBySlug } from "@/content/sections";
import { Rich, SourceBadge } from "@/components/ui";

export interface Graded {
  correct: boolean;
  /** Partial credit for error-spotting: found N of M, minus decoys clicked. */
  detail?: string;
}

function Verdict({
  graded,
  question,
  extra,
}: {
  graded: Graded;
  question: Question;
  extra?: React.ReactNode;
}) {
  const section = sectionBySlug(question.sectionSlug);
  return (
    <div
      className={`mt-4 rounded-xl border p-4 text-sm ${
        graded.correct
          ? "border-buy/40 bg-buy/5"
          : "border-sell/40 bg-sell/5"
      }`}
    >
      <p className={`font-display font-semibold ${graded.correct ? "text-buy" : "text-sell"}`}>
        {graded.correct ? "Correct" : "Not quite"}
        {graded.detail && (
          <span className="ml-2 font-mono text-xs font-normal opacity-80">
            {graded.detail}
          </span>
        )}
      </p>
      {extra}
      <p className="mt-2 text-muted">
        <Rich text={question.explanation} />
      </p>
      {section && (
        <p className="mt-2.5">
          <Link
            href={`/learn/${section.slug}/`}
            className="text-accent underline underline-offset-4"
          >
            Read §{section.number} {section.title} →
          </Link>
        </p>
      )}
    </div>
  );
}

export default function QuestionCard({
  question,
  index,
  total,
  onGraded,
  onNext,
  isLast,
}: {
  question: Question;
  index: number;
  total: number;
  onGraded: (id: string, correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const [graded, setGraded] = useState<Graded | null>(null);

  // mcq / truefalse
  const [choice, setChoice] = useState<number | null>(null);
  // numeric
  const [entry, setEntry] = useState("");
  // code-errors
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const tokenInfo = useMemo(() => {
    if (question.kind !== "code-errors") return null;
    const errors = new Map(question.errors.map((e) => [e.tokenId, e.why]));
    const decoys = new Map(question.decoys.map((d) => [d.tokenId, d.why]));
    return { errors, decoys };
  }, [question]);

  function grade() {
    let result: Graded;
    switch (question.kind) {
      case "mcq":
        result = { correct: choice === question.answerIndex };
        break;
      case "truefalse":
        result = { correct: (choice === 0) === question.answer };
        break;
      case "numeric": {
        const value = Number(entry.trim());
        result = {
          correct:
            entry.trim() !== "" &&
            Number.isFinite(value) &&
            Math.abs(value - question.answer) <= question.tolerance,
        };
        break;
      }
      case "code-errors": {
        const found = question.errors.filter((e) => picked.has(e.tokenId)).length;
        const wrong = question.decoys.filter((d) => picked.has(d.tokenId)).length;
        result = {
          correct: found === question.errors.length && wrong === 0,
          detail: `${found}/${question.errors.length} errors found${
            wrong > 0 ? `, ${wrong} false positive${wrong === 1 ? "" : "s"}` : ""
          }`,
        };
        break;
      }
    }
    setGraded(result);
    onGraded(question.id, result.correct);
  }

  const canSubmit =
    question.kind === "numeric"
      ? entry.trim() !== ""
      : question.kind === "code-errors"
        ? picked.size > 0
        : choice !== null;

  function toggleToken(id: string) {
    if (graded) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Question {index + 1} of {total}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {question.kind === "code-errors"
            ? "find the errors"
            : question.kind === "truefalse"
              ? "true or false"
              : question.kind}
        </span>
      </div>

      <h2 className="mt-3 font-display text-xl font-semibold">
        <Rich text={question.prompt} />
        <SourceBadge source={question.source} />
      </h2>

      {/* ---------- multiple choice ---------- */}
      {question.kind === "mcq" && (
        <div role="radiogroup" aria-label="Answer" className="mt-4 space-y-2">
          {question.choices.map((c, i) => {
            const chosen = choice === i;
            const isAnswer = i === question.answerIndex;
            const after = graded !== null;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={after}
                onClick={() => setChoice(i)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${
                  after && isAnswer
                    ? "border-buy bg-buy/10"
                    : after && chosen
                      ? "border-sell bg-sell/10"
                      : chosen
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:border-accent"
                }`}
              >
                <span className="font-mono text-xs text-muted">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>
                  <Rich text={c} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- true / false ---------- */}
      {question.kind === "truefalse" && (
        <div role="radiogroup" aria-label="Answer" className="mt-4 flex gap-2">
          {["True", "False"].map((label, i) => {
            const chosen = choice === i;
            const isAnswer = (i === 0) === question.answer;
            const after = graded !== null;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={after}
                onClick={() => setChoice(i)}
                className={`flex-1 rounded-xl border p-3 font-display font-semibold transition-colors ${
                  after && isAnswer
                    ? "border-buy bg-buy/10"
                    : after && chosen
                      ? "border-sell bg-sell/10"
                      : chosen
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:border-accent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- numeric ---------- */}
      {question.kind === "numeric" && (
        <div className="mt-4">
          <label className="block text-sm">
            <span className="text-muted">Your answer</span>
            <span className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={entry}
                disabled={graded !== null}
                onChange={(e) => setEntry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit && !graded) grade();
                }}
                className="tabular w-40 rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono"
                placeholder="0.00"
              />
              {question.suffix && (
                <span className="text-sm text-muted">{question.suffix}</span>
              )}
            </span>
          </label>
        </div>
      )}

      {/* ---------- error spotting ---------- */}
      {question.kind === "code-errors" && tokenInfo && (
        <>
          <p className="mt-3 text-xs text-muted">
            Click the highlighted parts you believe are wrong. Clicking something
            that is actually correct counts against you.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface-2 p-4">
            <pre className="text-[13px] leading-7">
              <code>
                {question.lines.map((line, li) => (
                  <div key={li}>
                    {line.map((tok, ti) => {
                      if (!tok.tokenId) return <span key={ti}>{tok.text}</span>;
                      const id = tok.tokenId;
                      const chosen = picked.has(id);
                      const after = graded !== null;
                      const isError = tokenInfo.errors.has(id);
                      // px + equal negative mx, so highlighting a token does
                      // not open a gap in the middle of the code
                      let cls =
                        "cursor-pointer rounded px-1 -mx-1 underline decoration-dotted decoration-muted/60 underline-offset-4 transition-colors";
                      if (after) {
                        cls =
                          "rounded px-1 -mx-1 " +
                          (isError
                            ? chosen
                              ? "bg-buy/25 ring-1 ring-buy"
                              : "bg-sell/20 ring-1 ring-sell"
                            : chosen
                              ? "bg-sell/25 ring-1 ring-sell line-through"
                              : "opacity-70");
                      } else if (chosen) {
                        cls += " bg-accent-soft ring-1 ring-accent";
                      } else {
                        cls += " hover:bg-accent-soft";
                      }
                      return (
                        <span
                          key={ti}
                          role="checkbox"
                          aria-checked={chosen}
                          aria-label={`Mark ${tok.text} as an error`}
                          tabIndex={after ? -1 : 0}
                          onClick={() => toggleToken(id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleToken(id);
                            }
                          }}
                          className={cls}
                        >
                          {tok.text}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </>
      )}

      {/* ---------- actions ---------- */}
      {graded === null ? (
        <button
          type="button"
          disabled={!canSubmit}
          onClick={grade}
          className="mt-5 rounded-xl bg-accent px-5 py-2.5 font-medium text-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit
        </button>
      ) : (
        <>
          <Verdict
            graded={graded}
            question={question}
            extra={
              question.kind === "numeric" ? (
                <p className="mt-2">
                  <span className="text-muted">Answer: </span>
                  <span className="tabular font-mono font-semibold">
                    {question.answer}
                    {question.suffix ? ` ${question.suffix}` : ""}
                  </span>
                  {question.working && (
                    <span className="mt-1 block font-mono text-xs text-muted">
                      {question.working}
                    </span>
                  )}
                </p>
              ) : question.kind === "code-errors" && tokenInfo ? (
                <ul className="mt-2 space-y-1.5">
                  {question.errors.map((e) => (
                    <li key={e.tokenId} className="flex gap-2 text-xs">
                      <span className="text-sell">✗</span>
                      <span className="text-muted">{e.why}</span>
                    </li>
                  ))}
                  {question.decoys
                    .filter((d) => picked.has(d.tokenId))
                    .map((d) => (
                      <li key={d.tokenId} className="flex gap-2 text-xs">
                        <span className="text-warn">!</span>
                        <span className="text-muted">
                          You marked this, but it is fine — {d.why}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : null
            }
          />
          <button
            type="button"
            onClick={onNext}
            className="mt-4 rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            {isLast ? "See results →" : "Next question →"}
          </button>
        </>
      )}
    </div>
  );
}
