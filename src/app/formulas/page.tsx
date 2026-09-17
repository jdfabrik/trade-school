import type { Metadata } from "next";
import Link from "next/link";
import Calculator from "@/components/Calculator";
import { Callout, Narrow, PageHeader } from "@/components/ui";
import { FORMULAS } from "@/content/formulas";

export const metadata: Metadata = {
  title: "Formulas & calculators",
  description:
    "Every formula from the guide with a live calculator, preloaded with the guide's own worked example so you can check the tool against the source.",
};

export default function FormulasPage() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="Reference"
        title="Formulas, with the maths running"
        lede="Type into any of these and the answer updates. Each one is the same tested function the labs use, so the numbers cannot disagree."
      />

      <div className="space-y-4">
        {FORMULAS.map((f) => (
          <Calculator key={f.id} formulaId={f.id} />
        ))}
      </div>

      <Callout tone="note">
        Every &ldquo;load the guide&rsquo;s example&rdquo; button above is also a
        test in the build. If a calculator here stopped reproducing the
        guide&rsquo;s printed answer, <code className="chip">npm test</code> would
        fail before the site shipped.
      </Callout>

      <div className="card mt-8 p-5">
        <h2 className="font-display text-lg font-semibold">Two that trip everyone</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-muted">
          <li>
            <strong className="text-fg">The window is in bars.</strong> A 75-minute
            moving average on 5-minute bars is <code className="chip">window=15</code>
            , not 75. Get this wrong and every later number is wrong too.
          </li>
          <li>
            <strong className="text-fg">Convert before you round.</strong> 0.0234
            rounded to two places is 0.02; multiply by 100 first and you get 2.34.
          </li>
        </ul>
        <p className="mt-3 text-sm">
          <Link href="/learn/pitfalls/" className="text-accent underline underline-offset-4">
            All fifteen pitfalls →
          </Link>
        </p>
      </div>
    </Narrow>
  );
}
