"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import QuestionCard from "@/components/QuestionCard";
import { Callout, GradePill, Stat } from "@/components/ui";
import { LESSONS, lessonBySlug } from "@/content/lessons";
import { QUESTIONS } from "@/content/questions";
import type { Question } from "@/content/types";
import { progressStore } from "@/lib/clientStore";
import { letterFor } from "@/lib/grade";
import { summarise, weakest } from "@/lib/progress";

interface Run {
  /** The set the questions were drawn from, kept so a reshuffle is one click. */
  pool: Question[];
  queue: Question[];
  at: number;
  results: { id: string; correct: boolean }[];
}

/**
 * Deterministic shuffle. The seed is taken when the trader presses Start, never
 * while rendering, so the page that gets built is always the same page.
 */
function shuffle(items: Question[], seed: number): Question[] {
  const out = items.slice();
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const j = Math.floor(r * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

export default function DrillRunner() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("lesson");
  const lessonSlug = LESSONS.some((l) => l.slug === requested) ? requested : null;

  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.snapshot,
    progressStore.serverSnapshot,
  );

  const [run, setRun] = useState<Run | null>(null);

  const filtered = useMemo(
    () =>
      lessonSlug === null
        ? QUESTIONS
        : QUESTIONS.filter((q) => q.lessonSlug === lessonSlug),
    [lessonSlug],
  );

  const weakIds = useMemo(() => new Set(weakest(progress)), [progress]);
  const weakPool = useMemo(
    () => filtered.filter((q) => weakIds.has(q.id)),
    [filtered, weakIds],
  );

  const totals = summarise(progress);

  function start(pool: Question[]) {
    if (pool.length === 0) return;
    setRun({
      pool,
      queue: shuffle(pool, Date.now()),
      at: 0,
      results: [],
    });
  }

  function handleGraded(id: string, correct: boolean) {
    progressStore.record(id, correct);
    setRun((prev) =>
      prev === null ? prev : { ...prev, results: [...prev.results, { id, correct }] },
    );
  }

  function next() {
    setRun((prev) => (prev === null ? prev : { ...prev, at: prev.at + 1 }));
  }

  /* ------------------------------- results ------------------------------- */

  if (run !== null && run.at >= run.queue.length) {
    const right = run.results.filter((r) => r.correct).length;
    const score = run.results.length === 0 ? 0 : right / run.results.length;
    const missed = run.results.filter((r) => !r.correct);

    return (
      <section aria-labelledby="results-heading">
        <div className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <GradePill letter={letterFor(score)} size="lg" />
          <div>
            <h2 id="results-heading" className="font-display text-xl font-semibold">
              {right} of {run.results.length} right
            </h2>
            <p className="mt-1 text-sm text-muted">
              {right === run.results.length
                ? "Every one. Come back in a few days and see whether it holds."
                : "The ones you missed are the useful part. They are listed below."}
            </p>
          </div>
        </div>

        {missed.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display text-lg font-semibold">What to go back over</h3>
            <ul className="mt-3 space-y-3">
              {missed.map(({ id }) => {
                const question = run.queue.find((q) => q.id === id);
                if (!question) return null;
                const lesson = lessonBySlug(question.lessonSlug);
                return (
                  <li key={id} className="card p-4">
                    <p className="text-sm font-medium">{question.prompt}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {question.explanation}
                    </p>
                    {lesson && (
                      <p className="mt-2.5">
                        <Link
                          href={`/learn/${lesson.slug}/`}
                          className="text-sm text-accent underline underline-offset-4"
                        >
                          Lesson {lesson.number}: {lesson.title} &rarr;
                        </Link>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => start(run.pool)}
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg"
          >
            Again, reshuffled
          </button>
          {missed.length > 0 && (
            <button
              type="button"
              onClick={() =>
                start(run.queue.filter((q) => missed.some((m) => m.id === q.id)))
              }
              className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
            >
              Just the {missed.length} I missed
            </button>
          )}
          <button
            type="button"
            onClick={() => setRun(null)}
            className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Back to the drill list
          </button>
        </div>
      </section>
    );
  }

  /* ------------------------------- running -------------------------------- */

  if (run !== null) {
    const question = run.queue[run.at];
    const right = run.results.filter((r) => r.correct).length;
    const done = run.results.length;

    return (
      <section aria-label="Drill in progress">
        <div className="mb-5">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-mono uppercase tracking-widest text-muted">
              {run.at + 1} / {run.queue.length}
            </span>
            <span className="tabular font-mono text-muted">
              {right} right{done > 0 ? ` of ${done} answered` : ""}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Drill progress"
            aria-valuemin={0}
            aria-valuemax={run.queue.length}
            aria-valuenow={run.at}
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${(run.at / run.queue.length) * 100}%` }}
            />
          </div>
        </div>

        <QuestionCard
          key={question.id}
          question={question}
          index={run.at}
          total={run.queue.length}
          onGraded={handleGraded}
          onNext={next}
          isLast={run.at === run.queue.length - 1}
        />

        <button
          type="button"
          onClick={() => setRun(null)}
          className="mt-5 text-sm text-muted underline underline-offset-4 hover:text-fg"
        >
          Stop and go back
        </button>
      </section>
    );
  }

  /* -------------------------------- setup --------------------------------- */

  const activeLesson = lessonSlug === null ? null : lessonBySlug(lessonSlug);

  return (
    <section aria-label="Choose a drill">
      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Pick what to practise</h2>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link
            href="/drills/"
            aria-current={lessonSlug === null ? "page" : undefined}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
              lessonSlug === null
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            Everything
          </Link>
          {LESSONS.map((lesson) => {
            const count = QUESTIONS.filter((q) => q.lessonSlug === lesson.slug).length;
            if (count === 0) return null;
            const active = lessonSlug === lesson.slug;
            return (
              <Link
                key={lesson.slug}
                href={`/drills/?lesson=${lesson.slug}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:text-fg"
                }`}
              >
                {lesson.title}
              </Link>
            );
          })}
        </div>

        {activeLesson && (
          <p className="mt-3 text-sm text-muted">{activeLesson.blurb}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => start(filtered)}
            disabled={filtered.length === 0}
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start &mdash; {filtered.length} question
            {filtered.length === 1 ? "" : "s"}
          </button>
          <button
            type="button"
            onClick={() => start(weakPool)}
            disabled={weakPool.length === 0}
            className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg"
          >
            Drill what I keep getting wrong
            {weakPool.length > 0 ? ` (${weakPool.length})` : ""}
          </button>
        </div>

        {weakPool.length === 0 && (
          <p className="mt-2.5 text-xs text-muted">
            Once you have missed a question, it goes on that list until you get it
            right more often than you get it wrong.
          </p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="font-display text-lg font-semibold">Your record so far</h2>
        <p className="mt-1 text-sm text-muted">
          Kept in this browser only. Clearing your browser data deletes it.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Questions seen" value={`${totals.seen} / ${QUESTIONS.length}`} />
          <Stat label="Answers given" value={String(totals.attempts)} />
          <Stat
            label="Answered right"
            value={totals.rate === null ? "—" : `${Math.round(totals.rate * 100)}%`}
          />
        </div>
        {totals.attempts > 0 && (
          <button
            type="button"
            onClick={() => progressStore.reset()}
            className="mt-3 text-sm text-muted underline underline-offset-4 hover:text-fg"
          >
            Clear my record
          </button>
        )}
      </div>

      <Callout tone="note">
        A high score here is not evidence that you can trade. It is evidence that
        you know what a good trade looks like, which is the part you can learn
        away from the market.
      </Callout>
    </section>
  );
}
