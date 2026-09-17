import Link from "next/link";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>;
}

export function Narrow({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {lede && <p className="mt-3 max-w-2xl text-lg text-muted">{lede}</p>}
    </header>
  );
}

export function Callout({
  tone = "note",
  children,
}: {
  tone?: "warn" | "note";
  children: ReactNode;
}) {
  const warn = tone === "warn";
  return (
    <div
      className={`my-4 rounded-xl border px-4 py-3 text-sm ${
        warn
          ? "border-warn/30 bg-warn-soft text-warn"
          : "border-border bg-surface-2 text-muted"
      }`}
    >
      {children}
    </div>
  );
}

/** Letter grade pill, coloured by how good the grade is. */
export function GradePill({
  letter,
  size = "md",
}: {
  letter: "A" | "B" | "C" | "D" | "F";
  size?: "sm" | "md" | "lg";
}) {
  const tone =
    letter === "A" || letter === "B"
      ? "border-buy/50 bg-buy/10 text-buy"
      : letter === "C"
        ? "border-warn/50 bg-warn-soft text-warn"
        : "border-sell/50 bg-sell/10 text-sell";
  const dims =
    size === "lg"
      ? "h-16 w-16 text-3xl"
      : size === "sm"
        ? "h-7 w-7 text-sm"
        : "h-10 w-10 text-xl";
  return (
    <span
      aria-label={`Grade ${letter}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border font-display font-bold ${tone} ${dims}`}
    >
      {letter}
    </span>
  );
}

export function Card({
  href,
  title,
  children,
  meta,
}: {
  href: string;
  title: string;
  children: ReactNode;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="card group block p-5 transition-colors hover:border-accent"
    >
      {meta && (
        <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-muted">
          {meta}
        </p>
      )}
      <h3 className="font-display text-lg font-semibold group-hover:text-accent">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-muted">{children}</p>
    </Link>
  );
}

/** Renders text containing `backticked` spans as inline code chips. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
          <code key={i} className="chip">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "buy" | "sell" | "plain";
}) {
  const color =
    tone === "buy" ? "text-buy" : tone === "sell" ? "text-sell" : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <div className="font-mono text-[11px] uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={`tabular mt-0.5 text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}
