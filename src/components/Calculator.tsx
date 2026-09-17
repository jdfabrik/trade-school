"use client";

import { useState } from "react";
import type { Formula } from "@/content/types";
import { formulaById } from "@/content/formulas";
import { SourceBadge } from "@/components/ui";

function render(value: number, unit: Formula["unit"]): string {
  if (!Number.isFinite(value)) return "—";
  switch (unit) {
    case "percent":
      return `${value.toFixed(2)}%`;
    case "ratio":
      return value.toFixed(3);
    case "bars":
      return `${value} bar${value === 1 ? "" : "s"}`;
    default:
      return String(Number(value.toPrecision(6)));
  }
}

/**
 * Takes an id rather than the Formula itself: a Formula carries a `compute`
 * function, and functions cannot be passed from a Server Component to a Client
 * Component. The lookup happens here, on the client.
 */
export default function Calculator({ formulaId }: { formulaId: string }) {
  const formula = formulaById(formulaId) as Formula;
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((formula?.inputs ?? []).map((i) => [i.key, i.default])),
  );

  if (!formula) return null;

  const result = formula.compute(values);
  const example = formula.example;
  const atExample =
    example !== undefined &&
    formula.inputs.every(
      (i) => Math.abs((values[i.key] ?? 0) - (example.values[i.key] ?? NaN)) < 1e-9,
    );

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">
          {formula.name}
          <SourceBadge source={formula.source} />
        </h3>
        <code className="text-xs text-muted">{formula.expression}</code>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-3 sm:grid-cols-3">
          {formula.inputs.map((input) => (
            <label key={input.key} className="block text-sm">
              <span className="block text-xs text-muted">{input.label}</span>
              <input
                type="number"
                step={input.step ?? 0.01}
                value={values[input.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [input.key]: Number(e.target.value) }))
                }
                className="tabular mt-1 w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-sm"
              />
            </label>
          ))}
        </div>

        <div className="rounded-xl border border-accent bg-accent-soft px-4 py-2.5 text-right">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted">
            Result
          </div>
          <output className="tabular block font-display text-2xl font-bold text-accent">
            {render(result, formula.unit)}
          </output>
        </div>
      </div>

      {example && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs">
          <button
            type="button"
            onClick={() => setValues({ ...example.values })}
            disabled={atExample}
            className="rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {atExample ? "Showing the guide's example" : "Load the guide's example"}
          </button>
          <span className="text-muted">
            {example.note} Guide&rsquo;s answer:{" "}
            <strong className="tabular font-mono text-fg">
              {example.expected}
              {formula.unit === "percent" ? "%" : ""}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
