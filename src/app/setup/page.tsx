import type { Metadata } from "next";
import Link from "next/link";
import { Callout, Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Run the Python yourself",
  description:
    "How to actually get yfinance, skfolio and vectorbt running on your own machine, including the Python version trap.",
};

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="card flex gap-4 p-5">
      <span className="tabular shrink-0 font-display text-xl font-bold text-accent">
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="mt-2 space-y-2 text-sm text-muted">{children}</div>
      </div>
    </li>
  );
}

function Cmd({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px]">
      <code>{children}</code>
    </pre>
  );
}

export default function SetupPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Practical"
        title="Running it on your own machine"
        lede="This site computes everything in the browser so you can learn without installing anything. But the exam is about the Python, so here is how to get the Python working."
      />

      <Callout tone="warn">
        <strong>The version trap.</strong> macOS ships Python 3.9. Both{" "}
        <code className="chip">skfolio</code> and <code className="chip">vectorbt</code>{" "}
        require <strong>3.10 or newer</strong>, so the guide&rsquo;s code cannot run
        on the system Python at all. That failure looks like a confusing
        dependency-resolution error, not a version error, which is why it wastes
        so much time.
      </Callout>

      <ol className="mt-6 space-y-3">
        <Step n={1} title="Check what you have">
          <Cmd>python3 --version</Cmd>
          <p>
            If that prints 3.9.x, you need a newer interpreter before anything else
            will work. Installing a newer Python from python.org is the simplest
            route and leaves the system one untouched.
          </p>
        </Step>

        <Step n={2} title="Make a virtual environment">
          <p>
            Never install these into the system Python — it is externally managed
            and pip will refuse, or worse, succeed and break something.
          </p>
          <Cmd>{`python3.12 -m venv ~/algo-venv
source ~/algo-venv/bin/activate`}</Cmd>
          <p>
            Your prompt should now show <code className="chip">(algo-venv)</code>.
            That is the only place these packages will exist.
          </p>
        </Step>

        <Step n={3} title="Install the five libraries">
          <Cmd>pip install --upgrade yfinance pandas skfolio vectorbt openpyxl</Cmd>
          <p>
            <code className="chip">openpyxl</code> is the one the guide does not
            mention — <code className="chip">read_excel</code> needs it to open an
            .xlsx file, and without it you get an import error rather than a
            helpful message.
          </p>
          <p>
            Package names in <code className="chip">pip install</code> are the one
            case-insensitive thing in the whole workflow, so{" "}
            <code className="chip">SKFolio</code> works too.
          </p>
        </Step>

        <Step n={4} title="Confirm it imports">
          <Cmd>{`python -c "import yfinance, skfolio, vectorbt; print('ok')"`}</Cmd>
          <p>
            Installing is not importing. This is the line that proves both
            happened.
          </p>
        </Step>

        <Step n={5} title="Expect the data to disagree">
          <p>
            Yahoo revises adjusted closes and rebuilds index membership monthly,
            and it rate-limits hard if you request too much too fast. Your numbers
            will not match a printed answer key exactly, and the guide says so
            itself: trust your own run.
          </p>
          <p>
            If <code className="chip">download()</code> starts returning empty
            frames, you are almost certainly being throttled. Wait, and request
            fewer tickers.
          </p>
        </Step>
      </ol>

      <div className="card mt-8 p-5">
        <h2 className="font-display text-lg font-semibold">
          The interval ceiling, and why Excel shows up
        </h2>
        <p className="mt-2 text-sm text-muted">
          Yahoo caps intraday history: 7 days at{" "}
          <code className="chip">&quot;1m&quot;</code>, 60 days at{" "}
          <code className="chip">&quot;5m&quot;</code>, 730 days at{" "}
          <code className="chip">&quot;60m&quot;</code>, and no limit from{" "}
          <code className="chip">&quot;1d&quot;</code> upward. That 60-day ceiling
          is the entire reason the course hands you 5-minute Bitcoin data in a
          spreadsheet instead of a download call.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/code/" className="text-accent underline underline-offset-4">
            See the annotated code blocks →
          </Link>
        </p>
      </div>
    </Narrow>
  );
}
