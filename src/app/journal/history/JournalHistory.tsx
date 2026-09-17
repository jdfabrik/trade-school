"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import GradeReport, { money, rValue } from "@/components/GradeReport";
import { Callout, GradePill, Stat } from "@/components/ui";
import { journalStore } from "@/lib/clientStore";
import {
  averageScore,
  gradeTrade,
  letterFor,
  weakestHabits,
  type Grade,
} from "@/lib/grade";
import { deleteTrade, toCsv } from "@/lib/journal";
import { deleteShot, shotUrl } from "@/lib/screenshots";
import {
  cumulativeR,
  expectancy,
  isClosed,
  maxDrawdownR,
  profitLoss,
  realisedR,
  winRate,
  type Trade,
} from "@/lib/trade";

/* --------------------------------- the curve -------------------------------- */

const W = 900;
const H = 210;
const PAD = { top: 16, right: 52, bottom: 26, left: 10 };

/**
 * Cumulative result in R.
 *
 * Deliberately not the site's dollar equity chart: an R curve starts at zero,
 * so there is no starting balance to compare against and a percentage against
 * the start would divide by nothing. The only question here is whether the line
 * is above where it began.
 */
function RCurve({ points, labels }: { points: number[]; labels: string[] }) {
  const geom = useMemo(() => {
    const lo = Math.min(0, ...points);
    const hi = Math.max(0, ...points);
    const span = hi - lo || 1;
    const yMin = lo - span * 0.12;
    const yMax = hi + span * 0.12;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerW);
    const y = (v: number) =>
      PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
    const line = points
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
      .join(" ");
    const area = `${line} L${x(points.length - 1).toFixed(2)} ${y(0).toFixed(2)} L${x(0).toFixed(2)} ${y(0).toFixed(2)} Z`;
    return { x, y, line, area };
  }, [points]);

  const final = points[points.length - 1] ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-4 py-2 text-xs">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5 bg-accent" />
          <span className="text-muted">Running total, in R</span>
        </span>
        <span
          className={`tabular ml-auto font-semibold ${
            final > 0 ? "text-buy" : final < 0 ? "text-sell" : "text-muted"
          }`}
        >
          {rValue(final)} over {points.length - 1} measured trades
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Running total across ${points.length - 1} measured trades, ending at ${rValue(final)}.`}
        style={{ display: "block", height: "auto" }}
      >
        <path d={geom.area} fill="var(--band)" stroke="none" />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={geom.y(0)}
          y2={geom.y(0)}
          stroke="var(--border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={W - PAD.right + 8}
          y={geom.y(0) + 4}
          fill="var(--muted)"
          fontSize="12"
          fontFamily="var(--font-mono)"
        >
          0R
        </text>
        <path
          d={geom.line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.75"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {[0, labels.length - 1].map((i) =>
          labels[i] ? (
            <text
              key={i}
              x={geom.x(i)}
              y={H - 7}
              fill="var(--muted)"
              fontSize="12"
              fontFamily="var(--font-mono)"
              textAnchor={i === 0 ? "start" : "end"}
            >
              {labels[i]}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

/* ------------------------------- screenshots -------------------------------- */

/**
 * Reads one image back out of this browser's storage.
 *
 * The URL is created asynchronously and revoked on unmount or when the id
 * changes; a journal scrolled for long enough would otherwise hold every
 * thumbnail it has ever drawn.
 */
function Shot({
  id,
  alt,
  className,
}: {
  id: string;
  alt: string;
  className: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    let made: string | null = null;
    shotUrl(id)
      .then((next) => {
        if (!live) {
          if (next) URL.revokeObjectURL(next);
          return;
        }
        made = next;
        setUrl(next);
      })
      .catch(() => {
        /* the image is gone; the trade still reads fine without it */
      });
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);

  if (!url) {
    return (
      <span
        aria-hidden
        className={`${className} block rounded-lg border border-dashed border-border bg-surface-2`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a blob URL from this browser; no server to optimise it
    <img src={url} alt={alt} className={`${className} rounded-lg border border-border`} />
  );
}

/* ------------------------------- one trade ---------------------------------- */

function TradeItem({
  trade,
  grade,
  expanded,
  onToggle,
  confirming,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  trade: Trade;
  grade: Grade;
  expanded: boolean;
  onToggle: () => void;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const panelId = `trade-${trade.id}`;
  const r = realisedR(trade);
  const pnl = profitLoss(trade);
  const closed = isClosed(trade);
  const long = trade.direction === "long";

  return (
    <li className="card overflow-hidden">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-2"
        >
          <GradePill letter={grade.letter} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">{trade.symbol || "Unnamed"}</span>
              <span className={`text-xs font-medium ${long ? "text-buy" : "text-sell"}`}>
                {long ? "Long" : "Short"}
              </span>
              <span className="tabular text-xs text-muted">{trade.date}</span>
            </span>
            <span className="mt-0.5 block truncate text-sm text-muted">
              {trade.setup || "No setup named"}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span
              className={`tabular block text-sm font-semibold ${
                !closed ? "text-muted" : pnl > 0 ? "text-buy" : "text-sell"
              }`}
            >
              {closed ? rValue(r) : "Open"}
            </span>
            <span className="tabular block text-xs text-muted">
              {closed ? money(pnl) : "—"}
            </span>
          </span>
          {trade.screenshotId && (
            <Shot
              id={trade.screenshotId}
              alt=""
              className="hidden h-11 w-16 shrink-0 object-cover sm:block"
            />
          )}
          <span aria-hidden className="shrink-0 text-muted">
            {expanded ? "−" : "+"}
          </span>
        </button>
      </h3>

      {expanded && (
        <div id={panelId} className="space-y-4 border-t border-border p-4">
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted">
              What you wrote before entering
            </h4>
            <p className="mt-1 text-sm">
              {trade.planNote.trim() || "Nothing was written down for this trade."}
            </p>
          </div>

          {trade.screenshotId && (
            <Shot
              id={trade.screenshotId}
              alt={`Chart screenshot saved with the ${trade.symbol || "unnamed"} trade on ${trade.date}`}
              className="max-h-72 w-full object-contain"
            />
          )}

          <GradeReport grade={grade} />

          <div className="border-t border-border pt-3">
            {confirming ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-warn">
                  Delete this trade and its screenshot for good?
                </p>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg border border-warn px-3 py-1.5 text-sm font-medium text-warn transition-colors hover:bg-warn-soft"
                >
                  Yes, delete it
                </button>
                <button
                  type="button"
                  onClick={onCancelDelete}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted underline underline-offset-4 hover:text-fg"
                >
                  Keep it
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAskDelete}
                className="rounded-lg text-sm text-muted underline underline-offset-4 hover:text-fg"
              >
                Delete this trade
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/* --------------------------------- the page --------------------------------- */

export default function JournalHistory() {
  const trades = useSyncExternalStore(
    journalStore.subscribe,
    journalStore.snapshot,
    journalStore.serverSnapshot,
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const view = useMemo(() => {
    const grades = trades.map((t) => gradeTrade(t));
    /* The store keeps trades newest first, which is how the list reads; the
       curve needs them the other way round. */
    const chrono = [...trades].reverse();
    const closed = chrono.filter(isClosed);
    const measured = closed.filter((t) => Number.isFinite(realisedR(t)));
    const rs = measured.map((t) => realisedR(t));
    const pnls = closed.map((t) => profitLoss(t)).filter(Number.isFinite);
    return {
      grades,
      closed,
      measured,
      rs,
      curve: cumulativeR(rs),
      labels: ["Start", ...measured.map((t) => t.date)],
      totalPnl: pnls.reduce((a, b) => a + b, 0),
      wins: winRate(pnls),
      average: averageScore(grades),
      edge: expectancy(rs),
      drawdown: maxDrawdownR(rs),
    };
  }, [trades]);

  const habits = useMemo(() => weakestHabits(view.grades, 4), [view.grades]);

  function exportCsv() {
    const blob = new Blob([toCsv(trades)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trade-journal-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    /* Revoked on the next turn of the loop, not on this one. Firefox starts the
       download asynchronously after the synthetic click, and revoking in the
       same tick pulls the blob out from under it and saves an empty file. */
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function remove(trade: Trade) {
    if (trade.screenshotId) void deleteShot(trade.screenshotId);
    journalStore.refresh(deleteTrade(trade.id));
    setConfirming(null);
    setExpanded(null);
  }

  if (trades.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="font-display text-xl font-semibold">Nothing logged yet</h2>
        <p className="mt-2 max-w-prose text-muted">
          Log one trade you have actually taken — a real one, including a bad one —
          and this page starts keeping score of the things you control. A handful of
          trades is enough to see a pattern you would not have noticed.
        </p>
        <Link
          href="/journal/"
          className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
        >
          Log your first trade
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="summary">
        <h2 id="summary" className="sr-only">
          Summary
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Trades logged" value={String(trades.length)} />
          <Stat
            label="Average grade"
            value={
              Number.isFinite(view.average)
                ? `${letterFor(view.average)} · ${Math.round(view.average * 100)}%`
                : "—"
            }
          />
          <Stat
            label="Win rate"
            value={Number.isFinite(view.wins) ? `${view.wins.toFixed(0)}%` : "—"}
          />
          <Stat
            label="Average result"
            value={rValue(view.edge)}
            tone={view.edge > 0 ? "buy" : view.edge < 0 ? "sell" : "plain"}
          />
          <Stat
            label="Worst drawdown"
            value={view.measured.length > 0 ? `${view.drawdown.toFixed(2)}R` : "—"}
          />
          <Stat
            label="Profit and loss"
            value={money(view.totalPnl)}
            tone={view.totalPnl > 0 ? "buy" : view.totalPnl < 0 ? "sell" : "plain"}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          The average grade is the one to watch. Profit and loss is here because you
          will look for it anyway, not because it measures how well you are trading
          yet — over this few trades it mostly measures luck.
        </p>
      </section>

      <section aria-labelledby="curve">
        <h2 id="curve" className="font-display text-xl font-semibold">
          Your results in R
        </h2>
        <p className="mb-3 mt-1 max-w-prose text-sm text-muted">
          One R is what you decided to risk on a trade. Counting in R instead of
          dollars makes a big position and a small one comparable. Trades taken
          without a stop have no R and cannot appear here.
        </p>
        {view.measured.length > 0 ? (
          <RCurve points={view.curve} labels={view.labels} />
        ) : (
          <Callout>
            None of your closed trades has both a stop and an exit price, so there
            is nothing to measure yet. Log a trade with a stop and the curve starts.
          </Callout>
        )}
      </section>

      <section aria-labelledby="work-on">
        <h2 id="work-on" className="font-display text-xl font-semibold">
          What to work on
        </h2>
        <p className="mb-4 mt-1 max-w-prose text-sm text-muted">
          The checklist items you miss most often, across every trade you have
          logged. Fixing the top one is worth more than any new setup.
        </p>
        {habits.length === 0 ? (
          <div className="card p-5">
            <p className="text-sm">
              Nothing is failing. Every trade you have logged passed every check,
              which is rare and worth protecting. Keep logging, including the days
              that go badly — a journal of only good trades teaches nothing.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {habits.map((habit, i) => (
              <li key={habit.id} className="card p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-base font-semibold">
                    {habit.label}
                  </h3>
                  <span className="tabular ml-auto text-sm text-warn">
                    missed on {habit.misses} of {trades.length}
                  </span>
                </div>
                <p className="mt-2 max-w-prose text-sm">{habit.advice}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="all-trades">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 id="all-trades" className="font-display text-xl font-semibold">
            Every trade
          </h2>
          <button
            type="button"
            onClick={exportCsv}
            className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            Export as CSV
          </button>
        </div>
        <ul className="space-y-2">
          {trades.map((trade, i) => (
            <TradeItem
              key={trade.id}
              trade={trade}
              grade={view.grades[i]}
              expanded={expanded === trade.id}
              onToggle={() => {
                setExpanded(expanded === trade.id ? null : trade.id);
                setConfirming(null);
              }}
              confirming={confirming === trade.id}
              onAskDelete={() => setConfirming(trade.id)}
              onCancelDelete={() => setConfirming(null)}
              onDelete={() => remove(trade)}
            />
          ))}
        </ul>
      </section>

      <Callout>
        This journal is saved in this browser only. There is no account and no
        server, so nothing is uploaded and nobody else can see it. Clearing your
        browser data deletes it, and it does not follow you to another device —
        so export the file every so often if you want to keep it.
      </Callout>
    </div>
  );
}
