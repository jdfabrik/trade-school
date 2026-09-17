# Provenance

Where the content and the numbers come from. This matters because the site
teaches beginners about money, and a reader should be able to check what is a
fact, what is a judgement, and what is generated.

## The teaching content

The lessons, glossary, drill questions, calculators and setups were written for
this site. They describe widely-taught, uncontroversial risk-management practice:
fixed fractional position sizing, stop placement, R-multiples, expectancy, and the
behavioural failure modes (revenge trading, overtrading, moving stops).

None of it is financial advice, none of it recommends an instrument or a strategy,
and none of it promises an outcome.

### Deliberately no statistics

The site says that most people who attempt day trading lose money. It does **not**
attach a percentage to that, name a study, or cite a regulator, anywhere.

That is a decision, not an oversight. The real figures vary by market, period,
instrument and how "day trader" is defined, and a precise-sounding number that
turned out to be wrong or stale would be worse on this page than no number at all.
The claim is stated in the general terms it can be stated in honestly.

### Arithmetic that is checked

Every worked number in a lesson was recomputed independently, and the calculators
that reproduce them are pinned by tests in `src/content/content.test.ts`.

| Claim in a lesson | Verified |
|---|---|
| 6 losses at 2% costs about 11.4% | 1 − 0.98⁶ = 11.42% |
| 10 losses at 10% costs about 65% | 1 − 0.90¹⁰ = 65.13% |
| Recovering from that needs about +187% | 1 ÷ 0.3487 − 1 = 186.8% |
| Breakeven win rate at 3:1 is 25% | 1 ÷ (1 + 3) = 25% |
| Breakeven win rate at 2:1 is 33% | 1 ÷ (1 + 2) = 33.3% |
| $250 risk with a $1.25 stop is 200 shares | 250 ÷ 1.25 = 200 |
| Entry 100, stop 99, 250 shares, exit 103 is +3R | $750 ÷ $250 = 3 |

## The practice charts

**All price data on this site is generated, not real market data.** It is produced
deterministically by `scripts/generate-series.mjs` from a seeded generator, so the
same practice chart always behaves the same way. Every page that renders it says so
using the `DATA_NOTICE` string from `src/data/index.ts`.

Real market data was attempted first and is not reachable from this machine:
Yahoo's chart endpoint returns HTTP 429 on both of its hosts through four retries
with exponential backoff, and the one free CSV alternative answers with a
JavaScript bot check rather than data, which was not circumvented.

For chart-markup practice this is not much of a compromise. The drill grades where
the trader put the entry, stop and target — whether the reward justified the risk,
whether the stop sits beyond the recent swing, whether it is wider than ordinary
noise. The reveal afterwards is only ever "what this particular series did next",
and the page says that explicitly so nobody reads a lucky reveal as a verdict on
their markup.

The instrument names in the monthly practice data are Z-prefixed invented names
(`ZALFA`, `ZBRVO`, …) chosen so none collides with a real listed ticker.

## What the site does not do

It does not read your screenshot. There is no server and no image analysis here;
the trader types the numbers and the site checks the discipline behind them. Every
page that mentions the screenshot states this.

It does not connect to a broker, receive prices, or know anything about your real
account.

## History

This project began as a site teaching a Python programming course, and was rebuilt
as a trading-practice site. The design system, chart approach, storage patterns and
test setup were kept; all content was replaced.

Because leftover programming references would be a genuine defect here, two guards
exist: a test in `src/content/content.test.ts` that fails if terms like `Python`,
`pandas` or `vectorbt` appear anywhere in the content, and a dedicated copy review
of every page looking for developer language in text a trader reads.
