import Link from "next/link";
import { Narrow } from "@/components/ui";

export default function NotFound() {
  return (
    <Narrow>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold">No such page</h1>
      <p className="mt-3 text-muted">
        That link does not point anywhere on this site. Your journal is
        untouched — it is saved in this browser, not on a page.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg">
          Home
        </Link>
        <Link
          href="/journal/"
          className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Log a trade
        </Link>
        <Link
          href="/learn/"
          className="rounded-xl border border-border px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Lessons
        </Link>
      </div>
    </Narrow>
  );
}
