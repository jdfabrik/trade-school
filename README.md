# Trade School

A training site for new day traders.

You log your own trades — entry, stop, target, size, and a screenshot of your
chart — and the site grades **the decisions you controlled**, not whether the trade
made money. Those two things come apart constantly, and confusing them is the
central mistake a beginner makes. A reckless trade that got lucky still fails here;
a disciplined trade that lost still passes.

Alongside the journal there are nine lessons, graded drills (including trades that
made money and were still bad trades), chart-markup practice, calculators, and a
glossary.

## Two things it deliberately does not do

**It does not read your screenshot.** There is no server and no image analysis. You
type the numbers; the site checks the discipline behind them. The image is stored
as your own record. Every page that mentions it says so.

**It does not give advice.** Nothing here recommends an instrument, a strategy or a
trade. It is practice material, and it says plainly that most people who attempt
day trading lose money.

## Your data stays in your browser

Trades live in `localStorage`, screenshots in IndexedDB. There is no account and no
server, so nothing is uploaded — that is a consequence of how the site is built
rather than a promise you are asked to trust. Clearing your browser data deletes
them, and they do not follow you to another device, so there is a CSV export.

## Running it

```bash
npm install
npm run dev          # http://localhost:3100
```

Port 3100, because 3000 is taken by other projects on this machine.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on 3100 |
| `npm run build` | Static export into `out/` |
| `npm run preview` | Serve the built `out/` on 3210 |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run check` | All four, in order. The gate. |

## Layout

```
src/lib/
  trade.ts          the arithmetic: risk, R, expectancy, position size
  grade.ts          the rubric — nine checks, none of which look at profit
  journal.ts        trades in localStorage, plus CSV export
  screenshots.ts    images in IndexedDB, never uploaded
  progress.ts       drill results
  clientStore.ts    useSyncExternalStore wrappers for theme, progress, journal
src/content/        lessons, glossary, calculators, drills, setups — as typed data
src/data/           generated practice price series (see PROVENANCE.md)
src/app/            routes
scripts/            practice-data generation
```

## Routes

| Route | What it is |
|---|---|
| `/` | What the site is, and the idea it is built on |
| `/journal/` | Log a trade and get it graded |
| `/journal/history/` | Your record, your statistics, and what to work on |
| `/learn/` | Nine lessons, in order |
| `/drills/` | Graded questions, including judgement calls on real-shaped trades |
| `/drills/chart/` | Mark up a chart, get graded on the markup, then see what happened |
| `/tools/` | Position size and five other calculators |
| `/glossary/` | Plain-English definitions |
| `/reality/` | The honest picture, in one page |

## The grading rubric

Nine weighted checks. Stops and risk size carry the most weight; the screenshot
carries the least.

1. Stop loss set before entry
2. Risk kept to 1% of the account
3. Position size follows from the stop
4. Planned reward at least 2:1
5. Setup named before entry
6. Reason written down before entry
7. Stop not moved against the position
8. Not revenge trading or overtrading
9. Screenshot attached

Profit and loss is computed and shown — in a separate box, with a line saying it
does not affect the grade.

## Tests

The one that matters most asserts that an identical trade grades the same whether
it won or lost. If that ever fails, the site is teaching the exact habit it exists
to break.

The rest pin the arithmetic (R, expectancy, breakeven win rates, position sizing),
check that every calculator still reproduces the worked answer printed in its
lesson, verify that storage degrades quietly when a browser blocks it, and fail the
build if any programming jargon survives from the site this one replaced.

## Deploying

Builds to a static export in `out/`, so it will host anywhere. Nothing is deployed
yet. Environment variables, matching the sibling projects on this machine:

- `NEXT_PUBLIC_SITE_URL` — canonicals, social tags, sitemap and robots
- `PREVIEW_NOINDEX=1` — keeps a preview build out of search results
- `NEXT_PUBLIC_BASE_PATH` — for sub-path hosting

## Not advice

Practice material. Nothing here is a recommendation to buy or sell anything. Most
people who try day trading lose money. Never risk money you need.
