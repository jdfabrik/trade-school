import type { Metadata } from "next";
import Link from "next/link";
import BollingerLab from "./BollingerLab";
import { PageHeader, Shell } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bollinger lab",
  description:
    "Interactive Bollinger Bands with a live backtest: move the window and alpha sliders, switch between crossing and plain comparison signals, and watch the fees.",
};

export default function BollingerLabPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Lab"
        title="Bollinger Bands, live"
        lede="Every number below is computed in your browser from the bundled series. Drag something and watch what moves."
      />

      <BollingerLab />

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold">Four things to try</h2>
          <ol className="mt-3 space-y-2.5 text-sm text-muted">
            <li>
              <strong className="text-fg">Drag the window to 60.</strong> The shaded
              dead zone on the left grows to 59 bars, and the middle band gets
              slower and flatter. Fewer signals fire.
            </li>
            <li>
              <strong className="text-fg">Push both alphas to 4.</strong> The
              envelope gets so wide that the price almost never escapes it, and the
              strategy stops trading entirely.
            </li>
            <li>
              <strong className="text-fg">Set upper 3.6, lower 3.1.</strong> That is
              the guide&rsquo;s worked example — bandwidth 6.7σ, and a middle band
              that is visibly off-centre.
            </li>
            <li>
              <strong className="text-fg">Switch to the trending regime.</strong> The
              same settings that beat buy-and-hold in a choppy market now lose to it
              badly. Nothing about the strategy changed.
            </li>
          </ol>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold">
            What this is really showing you
          </h2>
          <p className="mt-3 text-sm text-muted">
            A Bollinger strategy is a bet on mean reversion: that a price which has
            run far from its average will come back. The bands are just a way of
            measuring &ldquo;far&rdquo; in units of recent volatility, which is why
            they widen when the market gets noisy.
          </p>
          <p className="mt-2.5 text-sm text-muted">
            The bet pays in a range-bound market and loses in a trend, where every
            sell at the upper band takes you out of a rally you never rejoin. No
            parameter search fixes that, because it is not a tuning problem — it is
            the shape of the bet.
          </p>
          <p className="mt-3 text-sm">
            <Link
              href="/learn/bollinger-logic/"
              className="text-accent underline underline-offset-4"
            >
              Read the full band logic →
            </Link>
          </p>
        </div>
      </section>
    </Shell>
  );
}
