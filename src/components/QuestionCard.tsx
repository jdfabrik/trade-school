"use client";

import Link from "next/link";
import { useState } from "react";
import type { Question } from "@/content/types";
import { lessonBySlug } from "@/content/lessons";
import { Rich } from "@/components/ui";

const KIND_LABEL: Record<Question["kind"], string> = {
  mcq: "multiple choice",
  truefalse: "true or false",
  numeric: "work it out",
  judgement: "judgement call",
};

function Verdict({
  correct,
  question,
  children,
}: {
  correct: boolean;
  question: Question;
  children?: React.ReactNode;
}) {
  const lesson = lessonBySlug(question.lessonSlug);
  return (
    <div
      className={`mt-5 rounded-xl border p-4 text-sm sm:p-5 ${
        correct ? "border-buy/40 bg-buy/5" : "border-sell/40 bg-sell/5"
      }`}
    >
      <p
        className={`font-display text-base font-semibold ${
          correct ? "text-buy" : "text-sell"
        }`}
      >
        {correct ? "Correct" : "Not quite"}
      </p>

      {children}

      <p className="mt-3 leading-relaxed text-muted">
        <Rich text={question.explanation} />
      </p>

      {lesson && (
        <p className="mt-3.5">
          <Link
            href={`/learn/${lesson.slug}/`}
            className="text-accent underline underline-offset-4"
          >
            Read lesson {lesson.number}: {lesson.title} &rarr;
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
  const [correct, setCorrect] = useState<boolean | null>(null);
  /** mcq uses the index; true/false and judgement use 0 for yes, 1 for no. */
  const [choice, setChoice] = useState<number | null>(null);
  const [entry, setEntry] = useState("");

  const answered = correct !== null;

  const canSubmit =
    question.kind === "numeric" ? entry.trim() !== "" : choice !== null;

  function grade() {
    let result: boolean;
    switch (question.kind) {
      case "mcq":
        result = choice === question.answerIndex;
        break;
      case "truefalse":
      case "judgement":
        result = (choice === 0) === question.answer;
        break;
      case "numeric": {
        const value = Number(entry.trim());
        result =
          Number.isFinite(value) &&
          Math.abs(value - question.answer) <= question.tolerance;
        break;
      }
    }
    setCorrect(result);
    onGraded(question.id, result);
  }

  /** Shared look for the two-option and multiple-choice buttons. */
  function optionClass(chosen: boolean, isAnswer: boolean) {
    if (answered && isAnswer) return "border-buy bg-buy/10";
    if (answered && chosen) return "border-sell bg-sell/10";
    if (chosen) return "border-accent bg-accent-soft";
    return "border-border hover:border-accent";
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Question {index + 1} of {total}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {KIND_LABEL[question.kind]}
        </span>
      </div>

      {/* The scenario comes before the question, because the question is
          always the same sentence and the trade is what you are reading. */}
      {question.kind === "judgement" && (
        <div className="mt-4">
          <p className="text-sm text-muted">{question.scenario.summary}</p>

          <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-2">
            {question.scenario.facts.map((fact, i) => (
              <div key={i} className="flex gap-3 px-4 py-2.5 text-sm">
                <dt className="sr-only">Detail {i + 1}</dt>
                <span aria-hidden className="font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <dd className="leading-relaxed">{fact}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 rounded-xl border border-dashed border-border px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              What happened to the money
            </p>
            <p className="mt-1 text-sm text-muted">{question.scenario.outcome}</p>
          </div>
        </div>
      )}

      <h2 className="mt-4 font-display text-xl font-semibold">
        <Rich text={question.prompt} />
      </h2>

      {question.kind === "mcq" && (
        <div role="radiogroup" aria-label="Answer" className="mt-4 space-y-2">
          {question.choices.map((c, i) => {
            const chosen = choice === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={answered}
                onClick={() => setChoice(i)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${optionClass(
                  chosen,
                  i === question.answerIndex,
                )}`}
              >
                <span aria-hidden className="font-mono text-xs text-muted">
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

      {(question.kind === "truefalse" || question.kind === "judgement") && (
        <div role="radiogroup" aria-label="Answer" className="mt-4 flex gap-2">
          {(question.kind === "judgement"
            ? ["Yes, well taken", "No, badly taken"]
            : ["True", "False"]
          ).map((label, i) => {
            const chosen = choice === i;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={answered}
                onClick={() => setChoice(i)}
                className={`flex-1 rounded-xl border p-3 font-display text-sm font-semibold transition-colors sm:text-base ${optionClass(
                  chosen,
                  (i === 0) === question.answer,
                )}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {question.kind === "numeric" && (
        <div className="mt-4">
          <label className="block text-sm">
            <span className="text-muted">Your answer</span>
            <span className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={entry}
                disabled={answered}
                onChange={(e) => setEntry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit && !answered) grade();
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

      {correct === null ? (
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
          <Verdict correct={correct} question={question}>
            {question.kind === "numeric" && (
              <p className="mt-2">
                <span className="text-muted">Answer: </span>
                <span className="tabular font-mono font-semibold">
                  {question.answer}
                  {question.suffix ? ` ${question.suffix}` : ""}
                </span>
                {question.working && (
                  <span className="tabular mt-1 block font-mono text-xs text-muted">
                    {question.working}
                  </span>
                )}
              </p>
            )}
            {question.kind === "judgement" && (
              <p className="mt-2 font-medium">
                {question.answer
                  ? "This was a well-taken trade."
                  : "This was not a well-taken trade."}
              </p>
            )}
          </Verdict>

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
