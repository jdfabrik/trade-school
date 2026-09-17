"use client";

import { useMemo, useState } from "react";
import { GLOSSARY } from "@/content/glossary";
import { UNITS } from "@/content/sections";
import { Rich, SourceBadge } from "@/components/ui";

export default function GlossaryList() {
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<string>("all");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((t) => {
      if (unit !== "all" && t.unit !== unit) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.meaning.toLowerCase().includes(q) ||
        (t.detail ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, unit]);

  return (
    <>
      <div className="sticky top-[57px] z-20 -mx-4 bg-bg/95 px-4 py-3 backdrop-blur">
        <label className="block">
          <span className="sr-only">Search terms</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms, definitions…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {[{ id: "all", title: "All units" }, ...UNITS].map((u) => {
            const active = unit === u.id;
            return (
              <button
                key={u.id}
                type="button"
                aria-pressed={active}
                onClick={() => setUnit(u.id)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:text-fg"
                }`}
              >
                {u.title}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">
        {matches.length} of {GLOSSARY.length} term{matches.length === 1 ? "" : "s"}
      </p>

      {matches.length === 0 ? (
        <p className="card mt-3 p-6 text-muted">
          Nothing matches that. Try a shorter search.
        </p>
      ) : (
        <dl className="mt-3 space-y-3">
          {matches.map((t) => (
            <div key={t.id} id={t.id} className="card p-4 scroll-mt-32">
              <dt className="font-display font-semibold">
                {t.term}
                <SourceBadge source={t.source} />
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
    </>
  );
}
