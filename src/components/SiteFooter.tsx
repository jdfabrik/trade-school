import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-border bg-warn-soft px-4 py-3 text-sm text-warn">
          <strong className="font-semibold">Not investment advice.</strong> This is
          teaching material. The strategy taught here loses money in plenty of
          markets — the guide&rsquo;s own demo shows a passive $10,000 falling to
          $9,964. Backtested results are not future results.
        </div>

        <div className="mt-8 grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <h2 className="font-display text-sm font-semibold">Study</h2>
            <ul className="mt-2 space-y-1.5 text-muted">
              <li>
                <Link href="/learn/overview/" className="hover:text-fg">
                  All sections
                </Link>
              </li>
              <li>
                <Link href="/glossary/" className="hover:text-fg">
                  Glossary
                </Link>
              </li>
              <li>
                <Link href="/formulas/" className="hover:text-fg">
                  Formulas &amp; calculators
                </Link>
              </li>
              <li>
                <Link href="/learn/rapid-review/" className="hover:text-fg">
                  Rapid review
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">Practise</h2>
            <ul className="mt-2 space-y-1.5 text-muted">
              <li>
                <Link href="/lab/bollinger/" className="hover:text-fg">
                  Bollinger lab
                </Link>
              </li>
              <li>
                <Link href="/quiz/" className="hover:text-fg">
                  Graded drills
                </Link>
              </li>
              <li>
                <Link href="/quiz/review/" className="hover:text-fg">
                  Weak spots
                </Link>
              </li>
              <li>
                <Link href="/code/" className="hover:text-fg">
                  Annotated code
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">About</h2>
            <p className="mt-2 text-muted">
              Built from a five-page exam study guide. Every calculation on this
              site runs in your browser, and the engine is pinned by tests to the
              guide&rsquo;s own worked answers.
            </p>
            <p className="mt-2 text-muted">
              <Link href="/setup/" className="hover:text-fg">
                How to run the Python yourself →
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted">
          Your quiz progress is stored in this browser only. Nothing is uploaded.
        </p>
      </div>
    </footer>
  );
}
