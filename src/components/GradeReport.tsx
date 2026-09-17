import type { Grade } from "@/lib/grade";
import { GradePill } from "@/components/ui";

/**
 * Money, formatted the same way everywhere and without Intl, so the number
 * rendered at build time matches the one the browser renders on hydration.
 */
export function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const [whole, frac] = Math.abs(n).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "−" : ""}$${grouped}.${frac}`;
}

/** R, always signed, so +1.8R and −1.0R read as opposites at a glance. */
export function rValue(r: number): string {
  if (!Number.isFinite(r)) return "—";
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(2)}R`;
}

/*
 * Colour discipline in this file: green and red belong to the money, and only
 * to the money. The rubric marks use the accent and warning colours instead.
 * That is not decoration — it is the argument the whole site makes, made in
 * paint: a green number never means you did the right thing.
 */

function Mark({ passed }: { passed: boolean }) {
  return (
    <span
      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
        passed
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-warn/40 bg-warn-soft text-warn"
      }`}
    >
      <span aria-hidden>{passed ? "✓" : "✗"}</span>
      <span className="sr-only">{passed ? "Passed" : "Failed"}</span>
    </span>
  );
}

export default function GradeReport({
  grade,
  title = "Process grade",
}: {
  grade: Grade;
  title?: string;
}) {
  /* Failures first: the things to fix are worth more of your attention than
     the things you already did right. */
  const ordered = [...grade.failed, ...grade.checks.filter((c) => c.passed)];
  const good = grade.letter === "A" || grade.letter === "B";
  const open = grade.profitable === null;
  const contrast = !open && good !== grade.profitable;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <GradePill letter={grade.letter} size="lg" />
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {title} · {Math.round(grade.score * 100)}%
          </p>
          <p className="mt-1 font-display text-lg font-semibold leading-snug">
            {grade.headline}
          </p>
          <p className="mt-1 text-sm text-muted">
            {grade.failed.length === 0
              ? "Every item on the checklist passed."
              : `${grade.failed.length} of ${grade.checks.length} checks need work.`}
          </p>
        </div>
      </div>

      {/* The money, kept in its own box on purpose. */}
      <div className="rounded-xl border border-dashed border-border bg-bg p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Money result
          </h3>
          <p
            className={`tabular text-2xl font-semibold ${
              open ? "text-muted" : grade.profitable ? "text-buy" : "text-sell"
            }`}
          >
            {open ? "Still open" : money(grade.pnl)}
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">
          This is reported separately and does not affect your grade. You control
          how you take a trade. You do not control what the market does next.
        </p>
        {contrast && (
          <p className="mt-2 border-t border-border pt-2 text-sm">
            {grade.profitable
              ? "You broke your own rules and got paid for it. That is the outcome to be most careful with: it rewards a habit that will not keep paying, and it feels like skill while it does."
              : "You did the job properly and still lost. There is nothing here to fix. A method that works still loses often, and losing trades taken correctly are the cost of the ones that pay."}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {ordered.map((check) => (
          <li
            key={check.id}
            className={`rounded-xl border p-3 ${
              check.passed ? "border-border bg-surface" : "border-warn/30 bg-surface"
            }`}
          >
            <div className="flex gap-3">
              <Mark passed={check.passed} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="mt-0.5 text-sm text-muted">{check.detail}</p>
                {!check.passed && (
                  <p className="mt-2 border-l-2 border-warn/40 pl-3 text-sm">
                    {check.advice}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
