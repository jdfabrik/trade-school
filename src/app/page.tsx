import Link from "next/link";
import { Card, Shell } from "@/components/ui";
import { UNITS, SECTIONS } from "@/content/sections";
import { QUESTIONS } from "@/content/questions";
import { GLOSSARY } from "@/content/glossary";

export default function Home() {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Algorithmic trading with Python
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] sm:text-6xl">
            Learn the software by moving the sliders, not by reading about them.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Bollinger Bands, portfolio optimization and backtesting — the whole
            workflow, rebuilt so you can run it, get it wrong, and see exactly
            where the money went. No install, no API keys, no account.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/lab/bollinger/"
              className="rounded-xl bg-accent px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
            >
              Open the lab →
            </Link>
            <Link
              href="/learn/overview/"
              className="rounded-xl border border-border px-5 py-3 font-medium transition-colors hover:border-accent hover:text-accent"
            >
              Start from the beginning
            </Link>
            <Link
              href="/quiz/"
              className="rounded-xl border border-border px-5 py-3 font-medium transition-colors hover:border-accent hover:text-accent"
            >
              Test yourself
            </Link>
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="text-muted">Sections</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {SECTIONS.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Graded questions</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {QUESTIONS.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Terms defined</dt>
              <dd className="tabular font-display text-2xl font-bold">
                {GLOSSARY.length}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <Shell>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          Three ways in
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card href="/learn/overview/" title="Learn" meta="Read">
            The nine sections of the guide, in order, with the jargon explained
            the first time it appears.
          </Card>
          <Card href="/lab/bollinger/" title="Lab" meta="Do">
            Live bands and a real backtest. Widen the window, break the signal
            logic on purpose, watch the fees eat the returns.
          </Card>
          <Card href="/quiz/" title="Drill" meta="Prove">
            Graded questions with worked explanations, and a weak-spot list that
            remembers what you keep missing.
          </Card>
        </div>

        <h2 className="mt-14 font-display text-sm font-semibold uppercase tracking-widest text-muted">
          The five units
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {UNITS.map((u) => (
            <div key={u.id} className="card p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Unit {u.number}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">{u.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{u.covers}</p>
            </div>
          ))}
        </div>

        <div className="card mt-14 p-6">
          <h2 className="font-display text-xl font-semibold">
            Why the numbers here can be trusted
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Every formula on this site is a single tested function, and the tests
            are pinned to the study guide&rsquo;s own worked answers — the Agilent
            return of −6.65%, the Sharpe ratio of 0.645, the 6.7σ bandwidth. If
            the site ever disagreed with the guide, the build would fail.
          </p>
          <p className="mt-3 max-w-2xl text-muted">
            What it cannot promise is that a backtest here matches one you run at
            home. Yahoo revises its adjusted closes, and the guide says so
            itself: trust your own run.
          </p>
        </div>
      </Shell>
    </>
  );
}
