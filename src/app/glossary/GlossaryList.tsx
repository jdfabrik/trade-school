"use client";

import { useMemo, useState } from "react";
import { GLOSSARY } from "@/content/glossary";
import { TOPIC_LABELS } from "@/content/lessons";
import { Rich } from "@/components/ui";

/**
 * Only the topics that actually have terms, kept in the order TOPIC_LABELS
 * declares them so the chips do not reshuffle when the glossary grows.
 */
const TOPICS = Object.keys(TOPIC_LABELS).filter((topic) =>
  GLOSSARY.some((term) => term.topic === topic),
);

export default function GlossaryList() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("all");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((t) => {
      if (topic !== "all" && t.topic !== topic) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.meaning.toLowerCase().includes(q) ||
        (t.detail ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, topic]);

  const filtered = topic !== "all" || query.trim() !== "";

  return (
    <>
      <div className="sticky top-[57px] z-20 -mx-4 bg-bg/95 px-4 py-3 backdrop-blur">
        <label className="block">
          <span className="sr-only">Search the glossary</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms and definitions…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {[{ id: "all", label: "All topics" }].concat(
            TOPICS.map((t) => ({ id: t, label: TOPIC_LABELS[t] })),
          ).map((t) => {
            const active = topic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTopic(t.id)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-4 font-mono text-xs uppercase tracking-widest text-muted"
      >
        {matches.length} of {GLOSSARY.length} term{GLOSSARY.length === 1 ? "" : "s"}
      </p>

      {matches.length === 0 ? (
        <div className="card mt-3 p-6">
          <p className="text-muted">
            Nothing here matches that. Try a shorter word, or a different topic.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTopic("all");
            }}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            Show every term
          </button>
        </div>
      ) : (
        <dl className="mt-3 space-y-3">
          {matches.map((t) => (
            <div key={t.id} id={t.id} className="card scroll-mt-32 p-4">
              <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display font-semibold">{t.term}</span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  {TOPIC_LABELS[t.topic]}
                </span>
                <a
                  href={`#${t.id}`}
                  aria-label={`Link to ${t.term}`}
                  className="ml-auto font-mono text-xs text-muted transition-colors hover:text-accent"
                >
                  #
                </a>
              </dt>
              <dd className="mt-1 text-sm">
                <Rich text={t.meaning} />
                {t.detail && (
                  <p className="mt-2 text-muted">
                    <Rich text={t.detail} />
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {filtered && matches.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setTopic("all");
          }}
          className="mt-4 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Clear the filters
        </button>
      )}
    </>
  );
}
