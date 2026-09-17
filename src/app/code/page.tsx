import type { Metadata } from "next";
import Link from "next/link";
import CodeSample from "@/components/CodeSample";
import { Callout, Narrow, PageHeader } from "@/components/ui";
import { CODE_BLOCKS, DOWNLOAD_ARGS, INTERVAL_LIMITS } from "@/content/codeblocks";

export const metadata: Metadata = {
  title: "Annotated code",
  description:
    "The canonical yfinance, skfolio and vectorbt code blocks, annotated line by line.",
};

export default function CodePage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Reference"
        title="The code, annotated"
        lede="Every block from the guide with notes on the lines that actually catch people. Highlighted rows have a note beneath."
      />

      <div className="space-y-8">
        {CODE_BLOCKS.map((b) => (
          <CodeSample key={b.id} block={b} />
        ))}
      </div>

      <h2 className="mt-12 font-display text-xl font-semibold">download() arguments</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-2.5 font-display text-xs uppercase tracking-wide text-muted">Argument</th>
              <th className="px-4 py-2.5 font-display text-xs uppercase tracking-wide text-muted">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {DOWNLOAD_ARGS.map((a) => (
              <tr key={a.arg}>
                <td className="px-4 py-2.5 align-top"><code className="chip">{a.arg}</code></td>
                <td className="px-4 py-2.5 align-top text-muted">{a.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Interval limits</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-2.5 font-display text-xs uppercase tracking-wide text-muted">Interval</th>
              <th className="px-4 py-2.5 font-display text-xs uppercase tracking-wide text-muted">Max history</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {INTERVAL_LIMITS.map((i) => (
              <tr key={i.interval}>
                <td className="px-4 py-2.5 align-top"><code className="text-sm">{i.interval}</code></td>
                <td className="tabular px-4 py-2.5 align-top text-muted">{i.maxHistory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout tone="warn">
        None of this code runs on this site — it needs Python 3.10 or newer and five
        installed libraries.{" "}
        <Link href="/setup/" className="underline underline-offset-4">
          The setup page
        </Link>{" "}
        walks through getting it working on your own machine.
      </Callout>
    </Narrow>
  );
}
