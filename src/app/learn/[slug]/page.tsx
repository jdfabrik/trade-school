import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SECTIONS, UNITS, neighbours, sectionBySlug } from "@/content/sections";
import { GLOSSARY } from "@/content/glossary";
import { FORMULAS } from "@/content/formulas";
import { CONFUSIONS, COMPARISONS } from "@/content/confusions";
import { CODE_BLOCKS, DOWNLOAD_ARGS, INTERVAL_LIMITS } from "@/content/codeblocks";
import {
  BOLLINGER_PROSE,
  CALLABLE_KINDS,
  DATA_TYPES,
  RAPID_REVIEW,
  RESERVED_KEYWORDS_SAMPLE,
  SYNTAX_PROSE,
  type ProseBlock,
} from "@/content/prose";
import { questionsForSection } from "@/content/questions";
import CodeSample from "@/components/CodeSample";
import { Callout, Narrow, PageHeader, Rich, SourceBadge } from "@/components/ui";

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = sectionBySlug(slug);
  if (!section) return {};
  return { title: section.title, description: section.blurb };
}

function Prose({ blocks }: { blocks: ProseBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <section key={i} className="mt-8">
          {b.heading && (
            <h2 className="font-display text-xl font-semibold">{b.heading}</h2>
          )}
          {b.paragraphs?.map((p, j) => (
            <p key={j} className="mt-3 text-muted">
              <Rich text={p} />
            </p>
          ))}
          {b.bullets && (
            <ul className="mt-3 space-y-2">
              {b.bullets.map((x, j) => (
                <li key={j} className="flex gap-3 text-muted">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  <span>
                    <Rich text={x} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {b.callout && <Callout tone={b.callout.tone}>{b.callout.text}</Callout>}
        </section>
      ))}
    </>
  );
}

function Table({
  head,
  rows,
}: {
  head: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="card mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-display text-xs uppercase tracking-wide text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Body({ slug }: { slug: string }) {
  switch (slug) {
    case "overview":
      return (
        <>
          <p className="text-muted">
            Five units, each building on the one before. Unit 1.1 teaches you to
            read Python; 1.2 teaches you to fetch and rank real prices; portfolio
            optimization turns a ranking into an allocation; 2.2 builds a trading
            signal; 2.3 tests whether that signal was ever worth trusting.
          </p>
          <Table
            head={["Unit", "What it covers"]}
            rows={UNITS.map((u) => [
              <span key="u" className="font-display font-semibold">
                {u.number !== "—" ? `${u.number} ` : ""}
                {u.title}
              </span>,
              u.covers,
            ])}
          />
          <h2 className="mt-10 font-display text-xl font-semibold">
            The through-line
          </h2>
          <p className="mt-3 text-muted">
            Every unit is answering one question in stages: given money and a
            universe of assets, what do you buy, when, and how do you know it
            worked? Keep that question in view and the parts stop feeling
            arbitrary.
          </p>
        </>
      );

    case "key-terms":
      return (
        <>
          <p className="text-muted">
            The vocabulary the rest of the guide assumes. If a later section stops
            making sense, the cause is usually one of these.
          </p>
          <div className="mt-6 space-y-3">
            {GLOSSARY.map((t) => (
              <div key={t.id} className="card p-4">
                <h3 className="font-display font-semibold">
                  {t.term}
                  <SourceBadge source={t.source} />
                </h3>
                <p className="mt-1 text-sm">
                  <Rich text={t.meaning} />
                </p>
                {t.detail && (
                  <p className="mt-2 text-sm text-muted">
                    <Rich text={t.detail} />
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      );

    case "python-syntax":
      return (
        <>
          <Prose blocks={SYNTAX_PROSE} />
          <h2 className="mt-10 font-display text-xl font-semibold">
            Some of the 35 reserved keywords
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {RESERVED_KEYWORDS_SAMPLE.map((k) => (
              <code key={k} className="chip">
                {k}
              </code>
            ))}
          </div>
          <h2 className="mt-10 font-display text-xl font-semibold">Data types</h2>
          <Table
            head={["Type", "Example", "Rule"]}
            rows={DATA_TYPES.map((d) => [
              <code key="t" className="chip">
                {d.type}
              </code>,
              <code key="e" className="chip">
                {d.example}
              </code>,
              d.rule,
            ])}
          />
          <h2 className="mt-10 font-display text-xl font-semibold">
            Function vs method vs property
          </h2>
          <Table
            head={["Kind", "Rule", "Example"]}
            rows={CALLABLE_KINDS.map((c) => [
              <span key="k" className="font-semibold">
                {c.kind}
              </span>,
              c.rule,
              <code key="e" className="chip">
                {c.example}
              </code>,
            ])}
          />
        </>
      );

    case "formulas":
      return (
        <>
          <p className="text-muted">
            Seven formulas. Each one has a live calculator on the{" "}
            <Link href="/formulas/" className="text-accent underline underline-offset-4">
              formulas page
            </Link>
            , preloaded with the guide&rsquo;s worked example so you can check the
            tool against the source.
          </p>
          <Table
            head={["Quantity", "Formula"]}
            rows={FORMULAS.map((f) => [
              <span key="n" className="font-semibold">
                {f.name}
              </span>,
              <code key="x" className="text-sm">
                {f.expression}
              </code>,
            ])}
          />
          <h2 className="mt-10 font-display text-xl font-semibold">
            Worked examples to have in your head
          </h2>
          <ul className="mt-3 space-y-2">
            {FORMULAS.filter((f) => f.example).map((f) => (
              <li key={f.id} className="card p-4 text-sm">
                <span className="font-semibold">{f.name}:</span>{" "}
                <span className="text-muted">{f.example!.note}</span>
              </li>
            ))}
          </ul>
        </>
      );

    case "code":
      return (
        <>
          <p className="text-muted">
            The canonical blocks, annotated line by line. These are also rendered
            on the{" "}
            <Link href="/code/" className="text-accent underline underline-offset-4">
              code page
            </Link>
            .
          </p>
          <div className="mt-6 space-y-6">
            {CODE_BLOCKS.slice(0, 2).map((b) => (
              <CodeSample key={b.id} block={b} />
            ))}
          </div>
          <h2 className="mt-10 font-display text-xl font-semibold">
            download() arguments
          </h2>
          <Table
            head={["Argument", "Meaning"]}
            rows={DOWNLOAD_ARGS.map((a) => [
              <code key="a" className="chip">
                {a.arg}
              </code>,
              a.meaning,
            ])}
          />
          <h2 className="mt-10 font-display text-xl font-semibold">Interval limits</h2>
          <Table
            head={["Interval", "Max history"]}
            rows={INTERVAL_LIMITS.map((i) => [
              <code key="i" className="text-sm">
                {i.interval}
              </code>,
              i.maxHistory,
            ])}
          />
          <Callout tone="note">
            The 60-day ceiling is why 5-minute Bitcoin and Apple data comes from an
            Excel file rather than from yfinance.
          </Callout>
          <div className="mt-6 space-y-6">
            {CODE_BLOCKS.slice(2).map((b) => (
              <CodeSample key={b.id} block={b} />
            ))}
          </div>
        </>
      );

    case "bollinger-logic":
      return (
        <>
          <Prose blocks={BOLLINGER_PROSE} />
          <div className="card mt-8 p-5">
            <h2 className="font-display text-lg font-semibold">
              Stop reading, go and try it
            </h2>
            <p className="mt-2 text-sm text-muted">
              Everything above is visible in the lab in about ten seconds. Drag
              the window slider and watch the bands lag; flip the signal mode to{" "}
              <code className="chip">&lt;</code> and watch the trade count jump.
            </p>
            <Link
              href="/lab/bollinger/"
              className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-bg"
            >
              Open the Bollinger lab →
            </Link>
          </div>
        </>
      );

    case "comparisons":
      return (
        <>
          <p className="text-muted">
            Ten pairs that look similar and are not. If you can state each
            distinction in one sentence, this section is done.
          </p>
          <Table
            head={["A", "B", "Distinction"]}
            rows={COMPARISONS.map((c) => [
              <code key="a" className="chip">
                {c.a}
              </code>,
              <code key="b" className="chip">
                {c.b}
              </code>,
              c.distinction,
            ])}
          />
        </>
      );

    case "pitfalls":
      return (
        <>
          <p className="text-muted">
            Fifteen mistakes, each of which has cost somebody marks or money.
            Number 1 is the one that cascades furthest.
          </p>
          <ol className="mt-6 space-y-3">
            {CONFUSIONS.map((c) => (
              <li key={c.id} className="card flex gap-4 p-4">
                <span className="tabular font-display text-lg font-bold text-accent">
                  {String(c.number).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">
                    <Rich text={c.title} />
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    <Rich text={c.body} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      );

    case "rapid-review":
      return (
        <>
          <p className="text-muted">
            The whole guide, compressed. If a line here does not immediately make
            sense, that is the section to go back to.
          </p>
          <ul className="mt-6 space-y-2">
            {RAPID_REVIEW.map((line, i) => (
              <li key={i} className="flex gap-3 border-b border-border pb-2 text-sm">
                <span aria-hidden className="tabular shrink-0 font-mono text-xs text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <Rich text={line} />
                </span>
              </li>
            ))}
          </ul>
          <Callout tone="warn">
            That last line is the guide&rsquo;s own demo, not a result reproduced
            on this site. Backtested figures depend on the exact date range and
            the data vintage — run it yourself before you believe it.
          </Callout>
        </>
      );

    default:
      return null;
  }
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = sectionBySlug(slug);
  if (!section) notFound();

  const { prev, next } = neighbours(slug);
  const questions = questionsForSection(slug);

  return (
    <Narrow>
      <PageHeader
        eyebrow={`Section ${section.number} of ${SECTIONS.length}`}
        title={section.title}
        lede={section.blurb}
      />

      <Body slug={slug} />

      {questions.length > 0 && (
        <div className="card mt-12 p-5">
          <h2 className="font-display text-lg font-semibold">
            {questions.length} graded question{questions.length === 1 ? "" : "s"} on
            this section
          </h2>
          <Link
            href={`/quiz/?section=${slug}`}
            className="mt-3 inline-block rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Drill this section →
          </Link>
        </div>
      )}

      <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-border pt-6">
        {prev ? (
          <Link
            href={`/learn/${prev.slug}/`}
            className="card flex-1 p-4 transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              ← Previous
            </span>
            <span className="mt-1 block font-display font-semibold">{prev.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/learn/${next.slug}/`}
            className="card flex-1 p-4 text-right transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              Next →
            </span>
            <span className="mt-1 block font-display font-semibold">{next.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </Narrow>
  );
}
