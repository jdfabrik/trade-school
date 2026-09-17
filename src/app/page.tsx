import Link from "next/link";
import { Card, GradePill, Shell } from "@/components/ui";
import { LESSONS } from "@/content/lessons";
import { QUESTIONS } from "@/content/questions";
import { GLOSSARY } from "@/content/glossary";
import { TOOLS } from "@/content/tools";

const STEPS = [
  {
    n: "1",
    title: "Take the trade, screenshot the chart",
    body: "Trade on paper or at a size where the money does not matter. Save a picture of the chart the moment you take it, before you know how it turns out.",
  },
  {
    n: "2",
    title: "Log what you planned",
    body: "Entry, stop, target, size, and how big the account was. You type the numbers yourself — the site reads those, never the picture — so the plan is on record before the market answers.",
  },
  {
    n: "3",
    title: "Get a grade on the decisions",
    body: "A letter for the process, a separate line for the money, and a short list of what to do differently on the next one.",
  },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Practice for new day traders
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] sm:text-6xl">
            You get graded on how you traded, not on what you made.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Log your own real trades — entry, stop, target, size, and a
            screenshot of your chart. This site checks the decisions you
            controlled: how much you risked, where the stop went, whether the
            reward was worth it, whether you followed your own plan. Whether the
            trade made money is reported next to the grade, never inside it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/journal/"
              className="rounded-xl bg-accent px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
            >
              Log a trade
            </Link>
            <Link
              href="/learn/"
              className="rounded-xl border border-border px-5 py-3 font-medium transition-colors hover:border-accent hover:text-accent"
            >
              Start with the lessons
            </Link>
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted">Lessons</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {LESSONS.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Drill questions</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {QUESTIONS.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Calculators</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {TOOLS.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Terms explained</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {GLOSSARY.length}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Shell>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          How it works
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-5">
              <span
                aria-hidden
                className="tabular inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 font-display font-bold text-accent"
              >
                {s.n}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-2xl text-sm text-muted">
          The grade comes back as a letter with the reasons behind it, like this
          one.{" "}
          <span className="inline-flex translate-y-1 items-center gap-2">
            <GradePill letter="B" size="sm" />
          </span>{" "}
          A B usually means the plan was sound and one habit slipped. The reasons
          matter more than the letter.
        </p>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Every trade has two results
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Whether you traded well and whether you made money are separate
            questions, and they come apart often. A single trade tells you almost
            nothing about your skill, because luck is loud in the short run. This
            is the idea the whole site is built around, so it is worth sitting
            with for a minute.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-buy">
              Made money
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-sell">
              Lost money
            </p>

            <h3 className="col-span-2 mt-2 border-t border-border pt-3 font-display text-base font-semibold">
              You traded well
            </h3>

            <div className="card p-4">
              <h4 className="sr-only">Traded well, made money</h4>
              <p className="font-display font-semibold">Do it again</p>
              <p className="mt-1.5 text-sm text-muted">
                The plan was sound and it paid. Write down what you did so you
                can repeat it on purpose rather than by accident.
              </p>
            </div>

            <div className="card p-4">
              <h4 className="sr-only">Traded well, lost money</h4>
              <p className="font-display font-semibold">Nothing to fix</p>
              <p className="mt-1.5 text-sm text-muted">
                You followed your rules and the market went the other way. This
                is a normal cost of doing business. Changing your method here is
                the mistake.
              </p>
            </div>

            <h3 className="col-span-2 mt-3 border-t border-border pt-3 font-display text-base font-semibold">
              You traded badly
            </h3>

            <div className="rounded-xl border border-warn/40 bg-warn-soft p-4 text-warn">
              <h4 className="sr-only">Traded badly, made money</h4>
              <p className="font-display font-semibold">The dangerous one</p>
              <p className="mt-1.5 text-sm">
                You got paid for skipping the stop, sizing too big, or chasing.
                The money tells you it worked, so you do it again — bigger. This
                box is how most new accounts are eventually emptied.
              </p>
            </div>

            <div className="card p-4">
              <h4 className="sr-only">Traded badly, lost money</h4>
              <p className="font-display font-semibold">Honest feedback</p>
              <p className="mt-1.5 text-sm text-muted">
                It hurts, and it is the cheapest lesson on this grid. The
                mistake and the loss line up, so it is easy to learn from.
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-muted">
            Grading yourself on profit teaches you whatever happened to work
            today. Grading yourself on process teaches you the thing that keeps
            working. That is why the letter here never moves when the money does.
          </p>
        </section>

        <section className="mt-16 max-w-2xl">
          <h2 className="font-display text-xl font-semibold">
            The part most sites leave out
          </h2>
          <p className="mt-2 text-muted">
            Most people who try day trading lose money. Brokers in several
            countries have to publish the share of their own customers who lose,
            and no course or checklist changes those figures. Practising well
            makes you more likely to be in the smaller group, and nothing makes
            it certain.{" "}
            <Link
              href="/reality/"
              className="text-accent underline underline-offset-4"
            >
              The honest odds, in full
            </Link>
            .
          </p>
        </section>

        <h2 className="mt-16 font-display text-sm font-semibold uppercase tracking-widest text-muted">
          What is here
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card href="/learn/" title="Learn" meta={`${LESSONS.length} lessons`}>
            Risk, position size, stops, R-multiples, setups and the mistakes
            that end accounts. Plain English, with the arithmetic worked out.
          </Card>
          <Card
            href="/drills/"
            title="Drills"
            meta={`${QUESTIONS.length} questions`}
          >
            Quick questions, plus trades to judge. Some of them made money and
            were still badly taken, which is the habit the drill exists to break.
          </Card>
          <Card href="/drills/chart/" title="Chart practice" meta="Markup">
            Mark your entry, stop and target on a chart before you know what
            happens next, then see what your plan was actually worth.
          </Card>
          <Card href="/tools/" title="Calculators" meta={`${TOOLS.length} calculators`}>
            Position size, risk in money and percent, reward against risk,
            breakeven win rate. The sums you should do before every trade.
          </Card>
          <Card
            href="/glossary/"
            title="Glossary"
            meta={`${GLOSSARY.length} terms`}
          >
            Every term this site uses, defined once and without assuming you
            already know the next one.
          </Card>
          <Card href="/journal/history/" title="Your journal" meta="Statistics">
            Your logged trades, your average grade, your habits ranked by how
            often they slip, and what your results look like measured in risk.
          </Card>
        </div>

        <div className="card mt-12 p-6">
          <h2 className="font-display text-xl font-semibold">
            Everything stays in your browser
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            There is no account, no sign-up and no server. Your trades and your
            screenshots are saved in this browser only, and nothing is uploaded
            anywhere. That also means they do not follow you to another device,
            and clearing your browser data deletes them.
          </p>
        </div>
      </Shell>
    </>
  );
}
