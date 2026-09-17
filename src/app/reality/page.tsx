import type { Metadata } from "next";
import Link from "next/link";
import { Callout, Narrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "The odds",
  description:
    "The honest picture of day trading: most people who try it lose money, costs are paid on every trade, and progress is slow to see. Then what a sensible approach actually looks like.",
};

export default function Reality() {
  return (
    <Narrow>
      <PageHeader
        eyebrow="The odds"
        title="What you are walking into"
        lede="No site that wants you to keep reading will tell you this first, so here it is first."
      />

      <div className="space-y-4 text-muted">
        <p>
          Most people who try day trading lose money. You can check that for
          yourself rather than taking it from us: brokers in several countries
          are required by their regulators to publish the share of their own
          customers who lose money, and the figures sit on the brokers&rsquo; own
          pages. It is not a slogan and it is not a marketing trick. It is simply
          the shape of the activity.
        </p>
        <p>
          Losing is also not the only outcome. Some people do learn to do this
          well. But you should start from the assumption that you are unlikely
          to be one of them by default, and that becoming one takes the kind of
          effort you would put into any other skilled trade.
        </p>
      </div>

      <h2 className="mt-12 font-display text-xl font-semibold">
        Why it is hard, specifically
      </h2>

      <div className="mt-4 space-y-5">
        <section>
          <h3 className="font-display font-semibold">You pay to play, every time</h3>
          <p className="mt-1.5 text-muted">
            Three costs come off every trade whether you are right or wrong. The
            spread is the gap between the price to buy and the price to sell, so
            you start each trade slightly behind. Commission is what your broker
            charges. Slippage is the difference between the price you wanted and
            the price you got, and it is worst exactly when you most want out.
            Trade more often and you pay all three more often. A strategy can be
            genuinely good and still lose money once these are counted.
          </p>
        </section>

        <section>
          <h3 className="font-display font-semibold">The feedback lies to you</h3>
          <p className="mt-1.5 text-muted">
            In most skills, doing the right thing tends to produce the right
            result fairly quickly. Here it does not. A careless trade can pay,
            and a well-planned one can lose, and you will not be able to tell
            which was which from a day or a week of results. That means the
            market will happily teach you bad habits by rewarding them, and it
            takes a long stretch of trades before real skill becomes visible in
            the money.
          </p>
        </section>

        <section>
          <h3 className="font-display font-semibold">
            Nobody can promise you an income
          </h3>
          <p className="mt-1.5 text-muted">
            Anyone selling a signal service, a course with a lifestyle attached,
            or a guaranteed monthly return is selling you something they cannot
            deliver. Nobody knows what the market will do next, including them.
            Treat a promised return the way you would treat any other promise a
            stranger cannot possibly keep.
          </p>
        </section>
      </div>

      <Callout tone="warn">
        If you are trading money you need for rent, debt, or anything else with a
        deadline, stop now. Needing a particular trade to work is the most
        reliable way to make bad decisions, and no technique survives that
        pressure.
      </Callout>

      <h2 className="mt-14 font-display text-2xl font-bold">
        What a sensible approach looks like
      </h2>
      <p className="mt-3 text-muted">
        The odds above describe people who start with real money, no rules, and
        no record of what they did. You do not have to start that way. None of
        what follows guarantees anything, but it is the difference between
        learning slowly and losing quickly.
      </p>

      <div className="mt-6 space-y-6">
        <section>
          <h3 className="font-display text-lg font-semibold">
            Practise at a size where the money does not matter
          </h3>
          <p className="mt-1.5 text-muted">
            On paper, or with an amount so small that a bad day is an
            irrelevance. The point of the first few hundred trades is not to
            make money. It is to find out whether you can follow your own rules
            while the screen is moving, and that question is answered just as
            well at a size you can shrug off. Scale up only after your process
            holds steady for months, and scale up slowly.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg font-semibold">
            Expect months, not weeks
          </h3>
          <p className="mt-1.5 text-muted">
            Because the feedback is noisy, you need a lot of trades before your
            results mean anything. Nobody becomes competent at a skilled trade in
            a fortnight, and there is no reason this one would be the exception.
            Plan for a long apprenticeship and you will not be tempted to force
            results out of a handful of trades.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg font-semibold">
            Judge yourself on process
          </h3>
          <p className="mt-1.5 text-muted">
            Ask whether you had a plan, sized it so a loss was survivable, put a
            stop where the idea was wrong, and followed both. Those are the only
            parts you controlled, so those are the only parts worth scoring. The
            money is a separate line, and on any single trade it is mostly noise.
            That is what the{" "}
            <Link
              href="/journal/"
              className="text-accent underline underline-offset-4"
            >
              trade log
            </Link>{" "}
            on this site is for.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg font-semibold">
            Keep your income coming from somewhere else
          </h3>
          <p className="mt-1.5 text-muted">
            Trading to pay this month&rsquo;s bills changes every decision you
            make. You take trades you would otherwise skip, hold losers hoping
            they come back, and cut winners early to bank something. A wage from
            elsewhere buys you the patience the job actually requires.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg font-semibold">
            Set a daily loss limit and honour it
          </h3>
          <p className="mt-1.5 text-muted">
            Decide before the session how much you are willing to lose in a day
            and how many losing trades end it. When you hit that limit you are
            finished for the day, whatever the chart looks like. Nearly every
            account-ending day is a normal bad day that somebody tried to trade
            their way out of.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg font-semibold">
            Never trade money you need
          </h3>
          <p className="mt-1.5 text-muted">
            This is the one rule with no exceptions and no clever version. If
            losing the money would change how you live, it does not belong in a
            trading account. Not this month, not with a small position, not just
            this once.
          </p>
        </section>
      </div>

      <div className="card mt-14 p-6">
        <h2 className="font-display text-lg font-semibold">
          What this site is, plainly
        </h2>
        <p className="mt-2 text-muted">
          This is practice material. It is not financial advice, and it does not
          tell you what to buy or sell, when to trade, or which market to be in.
          It grades the habits behind trades you chose for yourself, and the
          decision to trade at all is yours. If you want advice about your own
          money, get it from someone licensed to give it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/learn/the-odds/"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-bg"
          >
            Read the first lesson
          </Link>
          <Link
            href="/learn/account-enders/"
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            The mistakes that end accounts
          </Link>
        </div>
      </div>
    </Narrow>
  );
}
