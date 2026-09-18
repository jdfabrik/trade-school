"use client";

import { useId, useMemo, useState } from "react";
import { Stat } from "@/components/ui";

/**
 * "What a losing streak costs" — the asymmetry between the hole and the climb.
 *
 * Losing 65% of an account is a sentence people can read without flinching.
 * Needing to make 187% to undo it is not, and the two are the same event. The
 * widget exists to put those two numbers next to each other and let the learner
 * move the risk slider until the second one gets frightening.
 *
 * The figures here are the same ones printed in lesson 2, and they are worked
 * out the same way: each loss risks the set percentage of whatever is left.
 */

/* ---------------------------------- maths --------------------------------- */

/** What is left after `losses` straight losses, as a fraction of the start. */
function remainingAfter(riskPct: number, losses: number): number {
  return Math.pow(1 - riskPct / 100, losses);
}

/** The gain that takes what is left back to where it started. */
function climbBack(remaining: number): number {
  return (1 / remaining - 1) * 100;
}

/** One decimal, as the lesson's table prints it. */
const gonePct = (n: number) => `${n.toFixed(1)}%`;

/**
 * The climb is printed whole above 10% and to one decimal below it, so that ten
 * losses at 10% reads 187% and ten at 1% reads 11%, exactly as lesson 2 says.
 */
const climbPct = (n: number) => (n >= 10 ? `${Math.round(n)}%` : `${n.toFixed(1)}%`);

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/* --------------------------------- drawing -------------------------------- */

const W = 900;
const H = 260;
const PAD = { top: 18, right: 70, bottom: 26, left: 10 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

const ACCOUNTS = [5000, 25000, 100000];
const COMPARE = [1, 2, 5, 10];

export default function StreakSimulator() {
  const headingId = useId();
  const riskId = useId();
  const lossId = useId();

  const [riskPct, setRiskPct] = useState(2);
  const [losses, setLosses] = useState(10);
  const [account, setAccount] = useState(25000);

  const run = useMemo(() => {
    const balances: number[] = [];
    for (let i = 0; i <= losses; i++) {
      balances.push(account * remainingAfter(riskPct, i));
    }
    const remaining = remainingAfter(riskPct, losses);
    return {
      balances,
      remaining,
      gone: (1 - remaining) * 100,
      climb: climbBack(remaining),
      dollarsGone: account * (1 - remaining),
      left: account * remaining,
    };
  }, [riskPct, losses, account]);

  /* Bars are measured from zero, because that is the honest picture: at 1% the
   * account barely moves, and no amount of scaling should hide that. */
  const geom = useMemo(() => {
    const slots = run.balances.length;
    const step = INNER_W / slots;
    return {
      x: (i: number) => PAD.left + step * (i + 0.5),
      y: (v: number) => PAD.top + INNER_H - (v / account) * INNER_H,
      barW: Math.max(6, Math.min(40, step * 0.7)),
    };
  }, [run.balances.length, account]);

  const lastX = geom.x(run.balances.length - 1);
  const lastTop = geom.y(run.balances[run.balances.length - 1]);
  const startY = geom.y(account);
  /** A shallow fall leaves no room to draw the climb inside; the label moves. */
  const roomForArrow = lastTop - startY >= 30;

  const chartLabel =
    `Account balance after each of ${losses} straight losses, risking ${riskPct}% of ` +
    `what is left each time. It falls from ${money(account)} to ${money(run.left)}, ` +
    `which is ${gonePct(run.gone)} of the account gone, and getting back to ` +
    `${money(account)} from there takes a gain of ${climbPct(run.climb)}.`;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-semibold">
        What a losing streak costs
      </h2>
      <p className="mt-1 text-sm text-muted">
        Losing runs are longer than anyone expects. Set how much you put at risk on
        each trade, then how many losses arrive back to back, and look at what it
        takes to undo them.
      </p>

      {/* ------------------------------ controls ----------------------------- */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={riskId} className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Risk on each trade</span>
            <span className="tabular font-mono text-fg">{riskPct.toFixed(1)}%</span>
          </label>
          <input
            id={riskId}
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            How much of the account a single loss takes — {money(account * (riskPct / 100))}{" "}
            on the first trade here. This is the one number you fully control.
          </p>
        </div>

        <div>
          <label htmlFor={lossId} className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Losses in a row</span>
            <span className="tabular font-mono text-fg">{losses}</span>
          </label>
          <input
            id={lossId}
            type="range"
            min={1}
            max={20}
            step={1}
            value={losses}
            onChange={(e) => setLosses(Number(e.target.value))}
            className="mt-2 h-7 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted">
            How long the cold stretch runs. Six in a row is ordinary; ten happens to
            people who are doing nothing wrong.
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="font-mono text-xs uppercase tracking-widest text-muted">
          Starting account
        </legend>
        <div
          role="radiogroup"
          aria-label="Starting account size"
          className="mt-2 grid grid-cols-3 gap-2"
        >
          {ACCOUNTS.map((size) => {
            const active = account === size;
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAccount(size)}
                className={`tabular rounded-xl border px-3 py-2.5 font-mono text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-muted hover:border-accent hover:text-fg"
                }`}
              >
                {money(size)}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Only the dollar figures change with this. The percentages below are
          identical whether you start with five thousand or five million.
        </p>
      </fieldset>

      {/* -------------------------------- chart ------------------------------ */}
      <figure className="m-0 mt-5 overflow-hidden rounded-xl border border-border bg-surface">
        <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2 text-xs">
          <span className="text-muted">
            Balance after each loss &middot; {riskPct.toFixed(1)}% a trade
          </span>
          <span className="tabular font-mono text-muted">
            {money(account)} &rarr; {money(run.left)}
          </span>
        </figcaption>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={chartLabel}
          style={{ display: "block", height: "auto" }}
        >
          {/* where you started */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={startY}
            y2={startY}
            stroke="var(--muted)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={W - PAD.right + 8}
            y={startY + 4}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {money(account)}
          </text>
          <text
            x={PAD.left + 4}
            y={startY - 7}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            where you started
          </text>

          {run.balances.map((value, i) => {
            const top = geom.y(value);
            return (
              <rect
                key={i}
                x={geom.x(i) - geom.barW / 2}
                y={top}
                width={geom.barW}
                height={Math.max(1.5, PAD.top + INNER_H - top)}
                fill={i === 0 ? "var(--muted)" : "var(--sell)"}
                opacity={i === 0 ? 0.45 : 0.85}
              />
            );
          })}

          {/* the climb back, which is the part nobody pictures */}
          {roomForArrow && (
            <>
              <line
                x1={lastX}
                x2={lastX}
                y1={lastTop}
                y2={startY + 5}
                stroke="var(--accent)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* an arrowhead pointing up, its tip on the line you started from */}
              <path d={`M${lastX} ${startY} l-5 9 l10 0 Z`} fill="var(--accent)" />
            </>
          )}
          <text
            x={roomForArrow ? lastX - geom.barW / 2 - 8 : W - PAD.right - 4}
            y={roomForArrow ? (lastTop + startY) / 2 : startY - 12}
            fill="var(--accent)"
            fontSize="14"
            fontFamily="var(--font-mono)"
            textAnchor="end"
            stroke="var(--surface)"
            strokeWidth="4"
            paintOrder="stroke"
          >
            needs +{climbPct(run.climb)}
          </text>

          <text
            x={geom.x(0)}
            y={H - 7}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            start
          </text>
          <text
            x={W - PAD.right}
            y={H - 7}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
            textAnchor="end"
          >
            after {losses} {losses === 1 ? "loss" : "losses"}
          </text>
        </svg>
      </figure>

      {/* ------------------------------- figures ----------------------------- */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Account gone" value={gonePct(run.gone)} tone="sell" />
        <Stat label="Money left" value={money(run.left)} />
      </div>

      <div className="mt-3 rounded-xl border border-accent bg-accent-soft px-4 py-4">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          To get back to {money(account)} you now have to make
        </p>
        <p className="tabular mt-1 font-display text-4xl font-bold text-accent">
          +{climbPct(run.climb)}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          Losing {gonePct(run.gone)} and making {gonePct(run.gone)} back are not the
          same trade. The loss came off the whole account; the recovery has to come
          off the {money(run.left)} you have left.
        </p>
      </div>

      {/* ------------------------------ comparison --------------------------- */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <caption className="border-b border-border bg-surface-2 px-3 py-2 text-left text-xs text-muted">
            The same {losses} {losses === 1 ? "loss" : "losses"}, at four different
            risk settings
          </caption>
          <thead>
            <tr className="bg-surface-2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2 font-normal">
                Risk
              </th>
              <th scope="col" className="px-3 py-2 text-right font-normal">
                Gone
              </th>
              <th scope="col" className="px-3 py-2 text-right font-normal">
                Needs
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((r) => {
              const remaining = remainingAfter(r, losses);
              const mine = Math.abs(r - riskPct) < 1e-9;
              return (
                <tr
                  key={r}
                  className={`border-t border-border ${mine ? "bg-accent-soft" : ""}`}
                >
                  <th
                    scope="row"
                    className="tabular px-3 py-2 text-left font-mono font-normal"
                  >
                    {r}%{mine && <span className="ml-1.5 text-xs text-accent">yours</span>}
                  </th>
                  <td className="tabular px-3 py-2 text-right font-mono text-sell">
                    −{gonePct((1 - remaining) * 100)}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono">
                    +{climbPct(climbBack(remaining))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          What to notice
        </p>
        <p className="mt-1.5">
          Drag the risk slider from 1% to 10% and watch the two columns pull apart.
          The damage roughly multiplies; the climb back grows far faster than that.
          Ten losses at 1% leaves you needing about 11% — a decent month. Ten at 10%
          leaves you needing 187%, which means nearly tripling what is left.
        </p>
        <p className="mt-2 text-muted">
          That is the whole case for 1%. Not that small risk is virtuous, but that a
          normal run of bad luck should leave you able to keep trading the same way
          afterwards. Every loss here is a clean one, stopped exactly where you
          planned. They are not always that tidy.
        </p>
      </div>
    </section>
  );
}
