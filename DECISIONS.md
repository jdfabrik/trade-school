# Decisions

Durable choices and the reasoning behind them. Newest last.

## D1 — The site grades process, never profit

`gradeTrade()` scores nine things the trader controlled — stop set, risk size, size
derived from the stop, planned reward, named setup, written reason, stop held,
composure, screenshot — and the profit or loss is reported in a separate box that
never touches the score.

This is the whole product. A beginner who grades themselves on profit learns to
gamble, because gambling works often enough to feel like skill. The test
`"an identical trade grades the same whether it won or lost"` in
`src/lib/grade.test.ts` is the one that must never be weakened.

## D2 — The site does not read the screenshot, and says so

There is no server and no vision model here, so a chart image cannot be analysed.
Rather than imply otherwise, the trader types the numbers and the screenshot is
stored as their own record. Every page that mentions the image states this plainly.

Claiming to grade a chart image would be the single most dishonest thing this site
could do, and a beginner would have no way to catch it.

## D3 — Everything stays in the trader's browser

Trades go in `localStorage`, screenshots in IndexedDB. No account, no server, no
upload. Because the site is a static export, that is a property of how it is built
rather than a promise someone is asked to trust.

The cost is stated wherever it matters: clearing browser data deletes the journal,
and it does not follow you to another device. The CSV export exists so that is not
a trap.

## D4 — Content is data, not markup

Lessons, glossary, calculators, drill questions and setups live in `src/content/`
as typed records. Each is consumed more than once — a lesson feeds its page, the
drill filter and the search — so writing it into components would mean keeping the
same fact correct in several places.

`src/content/content.test.ts` enforces the cross-references, and includes a check
that no programming jargon has survived from the site this one replaced.

## D5 — Calculators and lessons share one function

A `Tool` carries its own `compute`, so the worked example printed in a lesson and
the calculator on `/tools/` cannot drift apart. A test asserts every tool still
reproduces the answer its lesson prints.

Consequence, learned the hard way on the first production build: a `Tool` cannot be
passed from a server component into a client component, because functions do not
cross that boundary. Pages pass a `toolId` and the client looks it up.

## D6 — Browser-storage state goes through an external store

React's `set-state-in-effect` rule flags loading `localStorage` inside `useEffect`,
and it is right to. `src/lib/clientStore.ts` exposes the theme, the drill progress
and the journal through `useSyncExternalStore`, so the first render already has the
real value instead of flashing an empty one. The theme additionally gets a
`beforeInteractive` script so `data-theme` is on the document before first paint.

`snapshot()` caches its result, because `useSyncExternalStore` re-renders forever if
the reference changes on every call.

## D7 — Judgement drills include trades that made money and were still bad

Four of the drill questions describe a trade and ask whether it was well taken. Some
of the badly-taken ones are profitable and one of the well-taken ones loses. A test
asserts that both cases exist, because a drill where every good trade wins would
teach exactly the reflex the site is trying to remove.

## D8 — Practice charts are generated, not real market data

`scripts/generate-series.mjs` produces deterministic price series from a seeded
generator. Real data was attempted and is not reachable from this machine — see
`PROVENANCE.md`. For chart markup practice this is genuinely fine: the drill grades
where the trader put the stop and target, and the reveal is only ever "what this
particular series did next". Every page rendering it says it is generated.

## D9 — This site was rebuilt from a programming tutorial, and the seams were hunted

It previously taught Python libraries. The pivot kept the design system, charts,
storage patterns and test setup, and replaced all content. Because stray references
would be a real defect in a beginner's trading site, two things guard against them:
a regex test over all content, and a dedicated copy reviewer that read every page
looking for developer language in user-facing text.
