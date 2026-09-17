import type { CodeBlock } from "@/content/types";

/**
 * Renders a code block with its line notes attached beneath, each pointing at a
 * line number. Deliberately not syntax-highlighted: the annotations are the
 * point, and colouring every keyword competes with them for attention.
 */
export default function CodeSample({ block }: { block: CodeBlock }) {
  const lines = block.code.split("\n");
  const noted = new Set(block.notes?.map((n) => n.line) ?? []);

  return (
    <figure className="card overflow-hidden">
      <figcaption className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
        <h3 className="font-display text-sm font-semibold">{block.title}</h3>
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {block.language}
        </span>
      </figcaption>

      {block.blurb && (
        <p className="border-b border-border px-4 py-3 text-sm text-muted">
          {block.blurb}
        </p>
      )}

      <div className="overflow-x-auto bg-surface-2">
        <pre className="min-w-full p-4 text-[13px] leading-6">
          <code>
            {lines.map((line, i) => (
              <span
                key={i}
                className={`grid grid-cols-[2.25rem_1fr] ${
                  noted.has(i) ? "bg-accent-soft/40" : ""
                }`}
              >
                <span aria-hidden className="select-none pr-3 text-right text-muted/60">
                  {i + 1}
                </span>
                <span>{line || " "}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>

      {block.notes && block.notes.length > 0 && (
        <ul className="divide-y divide-border border-t border-border text-sm">
          {block.notes.map((n) => (
            <li key={n.line} className="flex gap-3 px-4 py-2.5">
              <span className="tabular shrink-0 font-mono text-xs text-accent">
                L{n.line + 1}
              </span>
              <span className="text-muted">{n.text}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
