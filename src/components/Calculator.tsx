"use client";

import Link from "next/link";
import { useState } from "react";
import { toolById } from "@/content/tools";
import { lessonBySlug } from "@/content/lessons";
import type { Tool } from "@/content/types";

function format(value: number, unit: Tool["unit"]): string {
  if (!Number.isFinite(value)) return "—";
  switch (unit) {
    case "money":
      return `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "percent":
      return `${value.toFixed(2)}%`;
    case "ratio":
      return value.toFixed(2);
    case "units": {
      const whole = Math.floor(value);
      return whole.toLocaleString("en-US");
    }
  }
}

/**
 * Takes an id rather than the Tool itself: a Tool carries a `compute` function,
 * and functions cannot be handed from a server component to a client one. The
 * lookup happens here, on the client.
 */
export default function Calculator({ toolId }: { toolId: string }) {
  const tool = toolById(toolId);

  /*
   * Inputs are held as the text the trader typed, not as numbers, so a field
   * can be emptied while they retype it instead of snapping back to zero.
   */
  const [raw, setRaw] = useState<Record<string, string>>(() =>
    Object.fromEntries((tool?.inputs ?? []).map((i) => [i.key, String(i.default)])),
  );

  if (!tool) return null;

  const values: Record<string, number> = Object.fromEntries(
    tool.inputs.map((i) => {
      const text = (raw[i.key] ?? "").trim();
      return [i.key, text === "" ? NaN : Number(text)];
    }),
  );

  const result = tool.compute(values);
  const example = tool.example;
  const atExample =
    example !== undefined &&
    tool.inputs.every(
      (i) => Math.abs((values[i.key] ?? NaN) - (example.values[i.key] ?? NaN)) < 1e-9,
    );

  const lesson = lessonBySlug(tool.lessonSlug);
  const fractionalUnits =
    tool.unit === "units" && Number.isFinite(result) && result !== Math.floor(result);

  return (
    <section id={tool.id} className="card scroll-mt-24 p-5">
      <h2 className="font-display text-lg font-semibold">{tool.name}</h2>
      <p className="mt-1 text-sm text-muted">{tool.purpose}</p>

      {/* The chip never wraps, so it gets its own scroller rather than widening the page. */}
      <p className="mt-3 overflow-x-auto py-0.5 font-mono text-xs text-muted">
        <span className="chip">{tool.formula}</span>
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3 sm:grid-cols-2">
          {tool.inputs.map((input) => (
            <label key={input.key} className="block text-sm">
              <span className="block text-xs text-muted">{input.label}</span>
              <span className="relative mt-1 block">
                <input
                  type="number"
                  inputMode="decimal"
                  step={input.step ?? 0.01}
                  value={raw[input.key] ?? ""}
                  onChange={(e) =>
                    setRaw((v) => ({ ...v, [input.key]: e.target.value }))
                  }
                  className={`tabular w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-sm ${
                    input.suffix ? "pr-8" : ""
                  }`}
                />
                {input.suffix && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-mono text-xs text-muted"
                  >
                    {input.suffix}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>

        <div className="rounded-xl border border-accent bg-accent-soft px-4 py-3 md:min-w-40 md:text-right">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted">
            {tool.unit === "units" ? "Shares" : "Answer"}
          </div>
          <output className="tabular block break-words font-display text-3xl font-bold text-accent">
            {format(result, tool.unit)}
          </output>
        </div>
      </div>

      {!Number.isFinite(result) && (
        <p className="mt-3 text-xs text-muted">
          Fill in every box with a number that makes sense. A stop at the same price
          as the entry has no risk to divide by, so there is no answer to give.
        </p>
      )}

      {fractionalUnits && (
        <p className="mt-3 text-xs text-muted">
          The exact figure is{" "}
          <strong className="tabular font-mono text-fg">{result.toFixed(2)}</strong>.
          Always round down. Rounding up risks more than you decided to.
        </p>
      )}

      {example && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setRaw(
                Object.fromEntries(
                  tool.inputs.map((i) => [
                    i.key,
                    String(example.values[i.key] ?? i.default),
                  ]),
                ),
              );
            }}
            disabled={atExample}
            className="rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {atExample ? "Showing the worked example" : "Load the worked example"}
          </button>
          <span className="text-muted">
            {example.note} The answer should come out at{" "}
            <strong className="tabular font-mono text-fg">
              {format(example.expected, tool.unit)}
            </strong>
          </span>
        </div>
      )}

      {lesson && (
        <p className="mt-3 text-xs">
          <Link
            href={`/learn/${tool.lessonSlug}/`}
            className="text-accent hover:underline"
          >
            Where this comes from: {lesson.title}
          </Link>
        </p>
      )}
    </section>
  );
}
