import Link from "next/link";
import type { Metadata } from "next";

import { LESSONS, TOPIC_LABELS } from "@/content/lessons";
import { Card, PageHeader, Shell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Nine short lessons for new traders: risk, position sizing, stops, measuring your results, and the habits that decide whether you are still trading next year.",
};

const [first, ...rest] = LESSONS;
const protective = rest.filter((l) => l.number <= 4);
const reflective = rest.filter((l) => l.number >= 5);

function LessonCard({ lesson }: { lesson: (typeof LESSONS)[number] }) {
  return (
    <Card
      href={`/learn/${lesson.slug}/`}
      title={`${lesson.number}. ${lesson.title}`}
      meta={TOPIC_LABELS[lesson.topic]}
    >
      {lesson.blurb}
      <span className="mt-2 block font-mono text-xs uppercase tracking-widest">
        {lesson.minutes} min read
      </span>
    </Card>
  );
}

export default function LearnIndex() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Learn"
        title="Nine lessons, in order"
        lede="Short enough to read in a sitting, in the order that keeps a beginner's account alive."
      />

      <div className="max-w-2xl space-y-3 text-muted">
        <p>
          The order is deliberate. The early lessons are about not losing money:
          how much to risk, how big a position that makes, and where the trade is
          wrong. Get those right and nothing that happens in a single day can end
          you.
        </p>
        <p>
          The later lessons are about learning from what you did — measuring a
          result honestly, naming the setup you traded, keeping a record, and
          noticing when your own head is the problem. That is the part that turns
          months of screen time into a skill instead of a story.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="start-here">
        <h2 id="start-here" className="sr-only">
          Start here
        </h2>
        <Link
          href={`/learn/${first.slug}/`}
          className="card group block overflow-hidden border-accent/40 p-0 transition-colors hover:border-accent"
        >
          <div className="bg-accent-soft px-5 py-2 font-mono text-xs uppercase tracking-widest text-accent">
            Start here · Lesson {first.number} · {first.minutes} min read
          </div>
          <div className="p-5">
            <h3 className="font-display text-xl font-semibold group-hover:text-accent sm:text-2xl">
              {first.title}
            </h3>
            <p className="mt-2 text-muted">{first.blurb}</p>
            <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
              Read this one even if you are impatient. It is the honest picture of
              what most people who try this end up with, and everything after it
              assumes you have seen those numbers.
            </p>
          </div>
        </Link>
      </section>

      <section className="mt-12" aria-labelledby="protective">
        <h2
          id="protective"
          className="font-display text-lg font-semibold sm:text-xl"
        >
          First, how not to lose money
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Three lessons that decide the size of your worst day. None of them are
          about picking what to trade.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {protective.map((lesson) => (
            <LessonCard key={lesson.slug} lesson={lesson} />
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="reflective">
        <h2
          id="reflective"
          className="font-display text-lg font-semibold sm:text-xl"
        >
          Then, how to tell whether you are any good
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Measuring a result, naming a setup, keeping a record, and staying out of
          your own way. This is where the profit and loss stops being the score.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {reflective.map((lesson) => (
            <LessonCard key={lesson.slug} lesson={lesson} />
          ))}
        </div>
      </section>

      <div className="card mt-12 p-5">
        <h2 className="font-display text-lg font-semibold">
          Reading is the easy half
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          None of this sticks until you apply it to a trade you actually took. Log
          one — the numbers you planned, not the ones you wish you had planned —
          and see how the process grades.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/journal/"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-bg"
          >
            Log a trade
          </Link>
          <Link
            href="/drills/"
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Practise with drills
          </Link>
        </div>
      </div>
    </Shell>
  );
}
