"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { QUESTIONS } from "@/content/questions";
import { SECTIONS, sectionBySlug } from "@/content/sections";
import type { Question } from "@/content/types";
import QuestionCard from "@/components/QuestionCard";
import { summarise, weakest } from "@/lib/progress";
import { progressStore } from "@/lib/clientStore";

/** Deterministic shuffle so a given seed always yields the same order. */
function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function QuizRunner({ mode = "all" }: { mode?: "all" | "review" }) {
  const params = useSearchParams();
  const sectionSlug = params.get("section");

  /*
   * Progress is read through an external store rather than loaded in an effect,
   * so the first render already has the real value and there is no flash of an
   * empty score line.
   */
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.snapshot,
    progressStore.serverSnapshot,
  );

  // Seeded only when the learner presses Start, so the server and client agree
  // on the very first render.
  const [seed, setSeed] = useState(1);
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>([]);
  const [started, setStarted] = useState(false);

  const pool: Question[] = useMemo(() => {
    if (mode === "review") {
      const weak = new Set(weakest(progress));
      return QUESTIONS.filter((q) => weak.has(q.id));
    }
    if (sectionSlug) return QUESTIONS.filter((q) => q.sectionSlug === sectionSlug);
    return QUESTIONS;
  }, [mode, progress, sectionSlug]);

  const deck = useMemo(() => shuffle(pool, seed), [pool, seed]);

  const section = sectionSlug ? sectionBySlug(sectionSlug) : undefined;
  const stats = summarise(progress);

  function handleGraded(id: string, correct: boolean) {
    setResults((prev) => [...prev, { id, correct }]);
    progressStore.record(id, correct);
  }

  function restart() {
    setSeed(Math.floor(Math.random() * 1e9));
    setCursor(0);
    setResults([]);
    setStarted(true);
  }

  /* ---------- nothing to drill ---------- */
  if (deck.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="font-display text-xl font-semibold">
          {mode === "review" ? "No weak spots yet" : "No questions here"}
        </h2>
        <p className="mt-2 text-muted">
          {mode === "review"
            ? "Take a quiz first. Anything you get wrong will collect here so you can drill it."
            : "That section has no questions attached to it."}
        </p>
        <Link
          href="/quiz/"
          className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-medium text-bg"
        >
          Take a quiz →
        </Link>
      </div>
    );
  }

  /* ---------- start screen ---------- */
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold">
            {mode === "review"
              ? `${deck.length} question${deck.length === 1 ? "" : "s"} you have missed`
              : section
                ? `${deck.length} question${deck.length === 1 ? "" : "s"} on ${section.title}`
                : `${deck.length} questions, whole syllabus`}
          </h2>
          <p className="mt-2 text-muted">
            Answers are graded immediately with a worked explanation and a link
            back to the section that teaches it. Nothing is timed.
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-5 rounded-xl bg-accent px-5 py-2.5 font-medium text-bg"
          >
            Start →
          </button>

          {stats.rate !== null && (
            <p className="mt-4 text-sm text-muted">
              So far: <strong className="tabular text-fg">{stats.correct}</strong> of{" "}
              <strong className="tabular text-fg">{stats.attempts}</strong> answers
              correct across {stats.seen} question
              {stats.seen === 1 ? "" : "s"} ({(stats.rate * 100).toFixed(0)}%).
            </p>
          )}
        </div>

        {mode === "all" && (
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
              Or drill one section
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/quiz/"
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  !sectionSlug
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border hover:border-accent"
                }`}
              >
                Everything
              </Link>
              {SECTIONS.filter((s) =>
                QUESTIONS.some((q) => q.sectionSlug === s.slug),
              ).map((s) => {
                const n = QUESTIONS.filter((q) => q.sectionSlug === s.slug).length;
                const active = sectionSlug === s.slug;
                return (
                  <Link
                    key={s.slug}
                    href={`/quiz/?section=${s.slug}`}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    {s.title}{" "}
                    <span className="tabular font-mono text-xs text-muted">{n}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- results ---------- */
  if (cursor >= deck.length) {
    const correct = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct);
    const pct = Math.round((correct / results.length) * 100);

    return (
      <div className="space-y-5">
        <div className="card p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Result
          </p>
          <p className="tabular mt-2 font-display text-5xl font-bold">
            {correct}
            <span className="text-muted">/{results.length}</span>
          </p>
          <p className="mt-1 text-lg text-muted">{pct}% correct</p>

          {missed.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-sm font-semibold">
                Worth another look
              </h3>
              <ul className="mt-2 space-y-2">
                {missed.map((m) => {
                  const q = QUESTIONS.find((x) => x.id === m.id);
                  if (!q) return null;
                  const s = sectionBySlug(q.sectionSlug);
                  return (
                    <li key={m.id} className="text-sm">
                      <span className="text-muted">{q.prompt.slice(0, 90)}</span>
                      {s && (
                        <Link
                          href={`/learn/${s.slug}/`}
                          className="ml-1 whitespace-nowrap text-accent underline underline-offset-4"
                        >
                          §{s.number} →
                        </Link>
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
              onClick={restart}
              className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg"
            >
              Again, reshuffled →
            </button>
            <Link
              href="/quiz/review/"
              className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
            >
              Drill my weak spots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- the question ---------- */
  const q = deck[cursor];
  const answeredCorrect = results.filter((r) => r.correct).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={cursor}
          aria-valuemin={0}
          aria-valuemax={deck.length}
          aria-label="Quiz progress"
        >
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${(cursor / deck.length) * 100}%` }}
          />
        </div>
        <span className="tabular font-mono text-xs text-muted">
          {answeredCorrect}/{results.length} correct
        </span>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        index={cursor}
        total={deck.length}
        onGraded={handleGraded}
        onNext={() => setCursor((c) => c + 1)}
        isLast={cursor === deck.length - 1}
      />
    </div>
  );
}
