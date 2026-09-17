# Decisions

Durable choices and the reasoning behind them. Newest last.

## D1 — Content is data, not JSX

Every fact from the study guide lives in `src/content/*.ts` as a typed record,
not as prose inside a component. Each record is consumed three times over: by a
reference page, by the quiz generator, and by search. Writing it as JSX would
mean maintaining the same fact in three places and letting them drift.

The cost is a layer of indirection on the reference pages. The benefit is that a
quiz question and the section it links to cannot disagree.

## D2 — Every calculation runs in the browser, in TypeScript

The site reimplements the semantics of `pandas`, `skfolio` and `vectorbt` rather
than shelling out to Python.

Forced by the environment: this Mac has none of pandas, numpy, yfinance,
skfolio, vectorbt, matplotlib or plotly, and `/usr/bin/python3` is 3.9.6 while
skfolio and vectorbt both need ≥3.10. But it is also the better product — no
install, no API keys, works on a phone, and the engine becomes unit-testable.

`/setup` documents the real Python path for a learner who wants it, including
the version trap, because the exam is about the Python.

## D3 — Vitest, despite neither sibling project having a test runner

`~/walkers-barbershop` and `~/original-walkers-barbershop-austin` have no test
runner. This project has one because `~/CLAUDE.md` requires a new test to fail
before the fix, and because the core of this site is arithmetic with five
known-correct answers printed in the source guide. An unnoticed sign error in
`sharpe()` would silently teach the wrong thing to someone learning this for the
first time.

Vitest is dev-only and does not enter the static bundle. The check gate is
`npm run check` → typecheck, lint, test, build.

## D4 — Synthetic market data, labelled as such

See `PROVENANCE.md` for the full reasoning. Short version: Yahoo 429s from here,
the free CSV alternative is behind a bot check, and three synthetic regimes
teach regime-dependence better than one real series would. Determinism also
means the tests that pin strategy behaviour stay valid.

The fallback is labelled on every page that renders it rather than quietly
passed off as real.

## D5 — Hand-rolled SVG charts, no charting library

Three reasons. The band envelope with buy/sell markers and a greyed warm-up
region is specific enough that a general-purpose library would fight it; the
static-export sibling project has zero runtime dependencies and this matches;
and a fixed `viewBox` with `vector-effect="non-scaling-stroke"` scales to phone
width without distorting line weights.

## D6 — localStorage state goes through an external store, not an effect

React 19's `react-hooks/set-state-in-effect` rule flagged three `setState`-in-
`useEffect` calls. Rather than suppress it, `src/lib/clientStore.ts` exposes the
theme and the quiz progress through `useSyncExternalStore`, and the mobile menu
derives its open state from the pathname it was opened on.

This is not lint appeasement. Reading localStorage in an effect means rendering
once with the wrong value and again with the right one — a visible flash of an
empty score line, and of the wrong theme. The theme additionally gets a
`beforeInteractive` boot script so the DOM already carries `data-theme` before
first paint.

`progressStore.snapshot()` caches, because `useSyncExternalStore` re-renders
forever if the snapshot reference changes on every call.

## D7 — The measured behaviour of `<` versus `crossed_below`

The guide says plain `<` causes more trades and more fee drag. Measurement says
it causes 2–4× more *signals* but usually the same number of *trades*, because
`from_signals` ignores an entry while already long.

The site teaches the guide's rule as the exam answer while showing both counts
in the lab, and the discrepancy is documented in `PROVENANCE.md` and in the test
comment in `src/data/data.test.ts`. Teaching material that contradicts its own
source without saying so is worse than either alternative.

## D8 — A `Formula` cannot cross the server/client boundary

`Formula` records carry a `compute` function, and functions cannot be passed
from a Server Component to a Client Component — this failed the first production
build. `Calculator` therefore takes a `formulaId` and looks the record up
client-side. Any future component that needs a whole `Formula` must do the same.
