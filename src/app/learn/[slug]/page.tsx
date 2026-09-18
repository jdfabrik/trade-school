import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  LESSONS,
  TOPIC_LABELS,
  lessonBySlug,
  lessonNeighbours,
} from "@/content/lessons";
import { questionsForLesson } from "@/content/questions";
import { TOOLS } from "@/content/tools";
import type { Block } from "@/content/types";
import { Callout, Narrow, PageHeader, Rich } from "@/components/ui";
import LessonWidget from "@/components/widgets/registry";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) return {};
  return {
    title: `${lesson.number}. ${lesson.title}`,
    description: lesson.blurb,
  };
}

function anchor(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/*
 * Cells that open with a digit, a sign or a currency mark are figures, and read
 * better lined up in the monospace face. Anything starting with a word is prose
 * and stays in the body face.
 */
function looksNumeric(cell: string) {
  return /^[+\-−$£€\d]/.test(cell) && cell.length <= 28;
}

function LessonTable({ head, rows }: NonNullable<Block["table"]>) {
  // Long cells need a floor on column width, or they shred into one word per
  // line on a phone. Short numeric tables fit as they are, so they get no floor.
  const wordy = rows.some((row) => row.some((cell) => cell.length > 44));
  const cellWidth = wordy ? "min-w-[15rem]" : "";

  return (
    <div className="card mt-5 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 font-display text-xs font-semibold uppercase tracking-wide text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) =>
                j === 0 ? (
                  <th
                    key={j}
                    scope="row"
                    className={`px-4 py-3 text-left font-semibold text-fg ${
                      looksNumeric(cell) ? "tabular" : ""
                    } ${cellWidth}`}
                  >
                    <Rich text={cell} />
                  </th>
                ) : (
                  <td
                    key={j}
                    className={`px-4 py-3 text-muted ${
                      looksNumeric(cell) ? "tabular text-fg" : ""
                    } ${cellWidth}`}
                  >
                    <Rich text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Worked({ title, lines, answer }: NonNullable<Block["worked"]>) {
  return (
    <figure className="card mt-5 overflow-hidden">
      <figcaption className="border-b border-border bg-surface-2 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted">
        {title}
      </figcaption>
      <div className="overflow-x-auto px-4 py-4">
        <div className="tabular min-w-0 space-y-1.5 text-sm">
          {lines.map((line, i) =>
            line === "" ? (
              <div key={i} aria-hidden className="h-2" />
            ) : (
              <div key={i} className="text-muted">
                {line}
              </div>
            ),
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2 border-t border-border pt-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Answer
          </span>
          <span className="tabular text-lg font-semibold text-accent">
            {answer}
          </span>
        </div>
      </div>
    </figure>
  );
}

function BlockView({ block }: { block: Block }) {
  return (
    <section className="mt-9 first:mt-0">
      {block.heading && (
        <h2
          id={anchor(block.heading)}
          className="scroll-mt-24 font-display text-xl font-semibold sm:text-2xl"
        >
          {block.heading}
        </h2>
      )}

      {block.paragraphs?.map((p, i) => (
        <p key={i} className="mt-3 text-[15px] leading-7 text-muted sm:text-base">
          <Rich text={p} />
        </p>
      ))}

      {block.bullets && (
        <ul className="mt-4 space-y-2.5">
          {block.bullets.map((b, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-muted">
              <span
                aria-hidden
                className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              <span>
                <Rich text={b} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {block.table && <LessonTable {...block.table} />}
      {block.worked && <Worked {...block.worked} />}
      {block.widget && (
        <LessonWidget id={block.widget.id} caption={block.widget.caption} />
      )}
      {block.callout && (
        <Callout tone={block.callout.tone}>
          <Rich text={block.callout.text} />
        </Callout>
      )}
    </section>
  );
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();

  const { prev, next } = lessonNeighbours(slug);
  const questions = questionsForLesson(slug);
  // Only the name and id cross the boundary; a Tool carries a function, which
  // cannot be handed to a client component.
  const tools = TOOLS.filter((t) => t.lessonSlug === slug);
  const headings = lesson.blocks
    .map((b) => b.heading)
    .filter((h): h is string => Boolean(h));

  return (
    <Narrow>
      <PageHeader
        eyebrow={`Lesson ${lesson.number} of ${LESSONS.length} · ${TOPIC_LABELS[lesson.topic]}`}
        title={lesson.title}
        lede={lesson.blurb}
      />

      <p className="-mt-4 font-mono text-xs uppercase tracking-widest text-muted">
        {lesson.minutes} min read
      </p>

      {headings.length >= 3 && (
        <nav aria-label="On this page" className="card mt-6 p-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            On this page
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {headings.map((h) => (
              <li key={h}>
                <a
                  href={`#${anchor(h)}`}
                  className="text-sm text-muted underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  {h}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <article className="mt-8">
        {lesson.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </article>

      <aside className="mt-12 rounded-xl border border-accent/40 bg-accent-soft p-5">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          Remember this
        </h2>
        <p className="mt-2 text-lg leading-8 font-medium">
          <Rich text={lesson.takeaway} />
        </p>
      </aside>

      {tools.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="font-display text-lg font-semibold">
            Work the numbers yourself
          </h2>
          <p className="mt-2 text-sm text-muted">
            {tools.length === 1
              ? "There is a calculator for the sum in this lesson, so you do not have to do it in your head mid-trade."
              : "There are calculators for the sums in this lesson, so you do not have to do them in your head mid-trade."}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {tools.map((t) => (
              <li key={t.id}>
                <Link
                  href="/tools/"
                  className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="font-display text-lg font-semibold">
            Check you have it
          </h2>
          <p className="mt-2 text-sm text-muted">
            {questions.length} question{questions.length === 1 ? "" : "s"} on this
            lesson. Getting one wrong is more useful than getting it right, so
            answer before you look.
          </p>
          <Link
            href={`/drills/?lesson=${lesson.slug}`}
            className="mt-4 inline-block rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Drill this lesson
          </Link>
        </div>
      )}

      <nav
        aria-label="Lessons"
        className="mt-12 flex flex-col items-stretch gap-3 border-t border-border pt-6 sm:flex-row"
      >
        {prev ? (
          <Link
            href={`/learn/${prev.slug}/`}
            className="card flex-1 p-4 transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              ← Lesson {prev.number}
            </span>
            <span className="mt-1 block font-display font-semibold">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span className="hidden flex-1 sm:block" />
        )}
        {next ? (
          <Link
            href={`/learn/${next.slug}/`}
            className="card flex-1 p-4 transition-colors hover:border-accent sm:text-right"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              Lesson {next.number} →
            </span>
            <span className="mt-1 block font-display font-semibold">
              {next.title}
            </span>
          </Link>
        ) : (
          <Link
            href="/journal/"
            className="card flex-1 p-4 transition-colors hover:border-accent sm:text-right"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              Last lesson →
            </span>
            <span className="mt-1 block font-display font-semibold">
              Now log a real trade
            </span>
          </Link>
        )}
      </nav>

      <p className="mt-6 text-center text-sm text-muted">
        <Link
          href="/learn/"
          className="underline decoration-border underline-offset-4 hover:text-accent"
        >
          All nine lessons
        </Link>
      </p>
    </Narrow>
  );
}
