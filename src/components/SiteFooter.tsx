import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <strong className="font-semibold">Practice material, not advice.</strong>{" "}
          Nothing here is a recommendation to buy or sell anything. Most people who
          try day trading lose money. Never risk money you need.{" "}
          <Link href="/reality/" className="underline underline-offset-4">
            The honest version →
          </Link>
        </div>

        <div className="mt-8 grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <h2 className="font-display text-sm font-semibold">Practise</h2>
            <ul className="mt-2 space-y-1.5 text-muted">
              <li><Link href="/journal/" className="hover:text-fg">Log a trade</Link></li>
              <li><Link href="/journal/history/" className="hover:text-fg">Your journal</Link></li>
              <li><Link href="/drills/" className="hover:text-fg">Drills</Link></li>
              <li><Link href="/drills/chart/" className="hover:text-fg">Chart practice</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">Learn</h2>
            <ul className="mt-2 space-y-1.5 text-muted">
              <li><Link href="/learn/" className="hover:text-fg">All lessons</Link></li>
              <li><Link href="/tools/" className="hover:text-fg">Calculators</Link></li>
              <li><Link href="/glossary/" className="hover:text-fg">Glossary</Link></li>
              <li><Link href="/reality/" className="hover:text-fg">The odds</Link></li>
              <li><Link href="/settings/" className="hover:text-fg">Your rules</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">Your data</h2>
            <p className="mt-2 text-muted">
              Your trades and screenshots are saved in this browser and nowhere
              else. There is no account and no server, so nothing is uploaded.
            </p>
            <p className="mt-2 text-muted">
              Clearing your browser data deletes them, and they do not follow you
              to another device.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
