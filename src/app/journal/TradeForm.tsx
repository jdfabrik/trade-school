"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import GradeReport, { money } from "@/components/GradeReport";
import ScreenshotInput from "@/components/ScreenshotInput";
import { Callout } from "@/components/ui";
import { SETUP_NAMES } from "@/content/setups";
import { journalStore } from "@/lib/clientStore";
import { MAX_RISK_PCT, MIN_RR, gradeTrade, type Grade } from "@/lib/grade";
import { addTrade, blankTrade, newTradeId } from "@/lib/journal";
import {
  breakevenWinRate,
  plannedRR,
  positionSize,
  riskAmount,
  riskPercent,
  riskPerUnit,
  type Direction,
  type ExitReason,
  type Trade,
} from "@/lib/trade";

const DEFAULTS = blankTrade();
const OTHER = "__other";

/**
 * Today's date, read through an external store so the server render and the
 * first client render agree. A statically exported page is built once: baking
 * the build date into the date field would be wrong by the time anyone used it.
 */
const todayStore = {
  subscribe: () => () => {},
  snapshot: () => new Date().toISOString().slice(0, 10),
  serverSnapshot: () => "",
};

interface Fields {
  date: string | null;
  symbol: string;
  direction: Direction;
  accountSize: string;
  entry: string;
  stop: string;
  target: string;
  size: string;
  exit: string;
  exitReason: ExitReason;
  setupPick: string;
  setupOther: string;
  planNote: string;
  stopMovedAgainst: boolean;
  tradesToday: string;
  minutesSincePriorLoss: string;
  screenshotId: string | null;
}

const EMPTY: Fields = {
  date: null,
  symbol: "",
  direction: DEFAULTS.direction,
  accountSize: String(DEFAULTS.accountSize),
  entry: "",
  stop: "",
  target: "",
  size: "",
  exit: "",
  exitReason: DEFAULTS.exitReason,
  setupPick: "",
  setupOther: "",
  planNote: "",
  stopMovedAgainst: DEFAULTS.stopMovedAgainst,
  tradesToday: String(DEFAULTS.tradesToday),
  minutesSincePriorLoss: "",
  screenshotId: null,
};

function toNumber(raw: string): number {
  const text = raw.trim();
  if (!text) return NaN;
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

function orZero(raw: string): number {
  const n = toNumber(raw);
  return Number.isFinite(n) ? n : 0;
}

function orNull(raw: string): number | null {
  const n = toNumber(raw);
  return Number.isFinite(n) ? n : null;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-warn">
          {error}
        </p>
      )}
    </div>
  );
}

function describe(id: string, hint: boolean, error: boolean): string | undefined {
  const parts = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

function Group({
  legend,
  blurb,
  children,
}: {
  legend: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 font-display text-base font-semibold">{legend}</legend>
      <p className="text-sm text-muted">{blurb}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
}

export default function TradeForm() {
  const today = useSyncExternalStore(
    todayStore.subscribe,
    todayStore.snapshot,
    todayStore.serverSnapshot,
  );
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState<{ trade: Trade; grade: Grade } | null>(null);
  /* Bumped after a save so the screenshot picker unmounts, releasing its
     preview URL and starting the next trade with no image attached. */
  const [shotKey, setShotKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(null);
  }

  const date = fields.date ?? today;

  const draft: Trade = useMemo(() => {
    const setup =
      fields.setupPick === OTHER ? fields.setupOther.trim() : fields.setupPick.trim();
    return {
      id: "draft",
      date,
      symbol: fields.symbol.trim().toUpperCase(),
      direction: fields.direction,
      accountSize: orZero(fields.accountSize),
      entry: orZero(fields.entry),
      stop: orNull(fields.stop),
      target: orNull(fields.target),
      size: orZero(fields.size),
      exit: fields.exitReason === "open" ? null : orNull(fields.exit),
      exitReason: fields.exitReason,
      setup,
      planNote: fields.planNote,
      stopMovedAgainst: fields.stopMovedAgainst,
      tradesToday: orZero(fields.tradesToday),
      minutesSincePriorLoss: orNull(fields.minutesSincePriorLoss),
      screenshotId: fields.screenshotId ?? undefined,
    };
  }, [fields, date]);

  const grade = useMemo(() => gradeTrade(draft), [draft]);

  const perUnit = riskPerUnit(draft);
  const hasStop = Number.isFinite(perUnit);
  const riskAmt = riskAmount(draft);
  const riskPct = riskPercent(draft);
  const overRisk = Number.isFinite(riskPct) && riskPct > MAX_RISK_PCT;
  const rr = plannedRR(draft);
  const allowed =
    draft.stop !== null && draft.accountSize > 0
      ? positionSize(draft.accountSize, MAX_RISK_PCT, draft.entry, draft.stop)
      : NaN;
  const allowedUnits = Number.isFinite(allowed) ? Math.floor(allowed) : NaN;
  const sizeMatches = Number.isFinite(allowedUnits) && draft.size === allowedUnits;

  const entryProblem =
    draft.entry > 0 ? null : "Enter the price you were actually filled at.";
  const sizeProblem =
    draft.size > 0 ? null : "Enter how many shares or contracts you took.";
  const canSave = !entryProblem && !sizeProblem;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (!canSave) return;
    const trade: Trade = { ...draft, id: newTradeId() };
    journalStore.refresh(addTrade(trade));
    setSaved({ trade, grade: gradeTrade(trade) });
    setFields((prev) => ({ ...prev, screenshotId: null }));
    setShotKey((n) => n + 1);
    setTried(false);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <form onSubmit={submit} noValidate className="space-y-5">
        <Callout>
          Everything you log stays in this browser. There is no account and no
          server, so nothing you type here leaves your computer — and nothing is
          backed up either.
        </Callout>

        <Group
          legend="The trade"
          blurb="The numbers as they actually happened. Use the prices your broker shows."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="f-date" label="Date">
              <input
                id="f-date"
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => update("date", e.target.value)}
              />
            </Field>
            <Field id="f-symbol" label="Symbol" hint="Whatever you traded, such as AAPL.">
              <input
                id="f-symbol"
                type="text"
                autoComplete="off"
                spellCheck={false}
                aria-describedby={describe("f-symbol", true, false)}
                className={`${inputClass} uppercase`}
                value={fields.symbol}
                onChange={(e) => update("symbol", e.target.value)}
              />
            </Field>
          </div>

          <div>
            <p className="block text-sm font-medium">Direction</p>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["long", "Long", "You bought first, hoping to sell higher."],
                  ["short", "Short", "You sold first, hoping to buy back lower."],
                ] as const
              ).map(([value, label, note]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                >
                  <input
                    type="radio"
                    name="direction"
                    value={value}
                    checked={fields.direction === value}
                    onChange={() => update("direction", value)}
                    className="mt-0.5"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <span>
                    <span
                      className={`font-medium ${value === "long" ? "text-buy" : "text-sell"}`}
                    >
                      {label}
                    </span>
                    <span className="block text-xs text-muted">{note}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Field
            id="f-account"
            label="Account size"
            hint="What the whole account was worth that day. Risk only means something as a share of this."
          >
            <input
              id="f-account"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              aria-describedby={describe("f-account", true, false)}
              className={`${inputClass} tabular`}
              value={fields.accountSize}
              onChange={(e) => update("accountSize", e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="f-entry" label="Entry price" error={tried ? entryProblem : null}>
              <input
                id="f-entry"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                aria-invalid={tried && Boolean(entryProblem)}
                aria-describedby={describe("f-entry", false, tried && Boolean(entryProblem))}
                className={`${inputClass} tabular`}
                value={fields.entry}
                onChange={(e) => update("entry", e.target.value)}
              />
            </Field>
            <Field
              id="f-stop"
              label="Stop price"
              hint="Where you would admit you were wrong."
            >
              <input
                id="f-stop"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                aria-describedby={describe("f-stop", true, false)}
                className={`${inputClass} tabular`}
                value={fields.stop}
                onChange={(e) => update("stop", e.target.value)}
              />
            </Field>
            <Field
              id="f-size"
              label="Size"
              hint="Shares or contracts."
              error={tried ? sizeProblem : null}
            >
              <input
                id="f-size"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                aria-invalid={tried && Boolean(sizeProblem)}
                aria-describedby={describe("f-size", true, tried && Boolean(sizeProblem))}
                className={`${inputClass} tabular`}
                value={fields.size}
                onChange={(e) => update("size", e.target.value)}
              />
            </Field>
          </div>

          {/* The live arithmetic. This is the part of the page that teaches. */}
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted">
              What you are risking
            </h3>
            {hasStop ? (
              <>
                <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Per share</dt>
                    <dd className="tabular mt-0.5 font-semibold">{money(perUnit)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Total at risk</dt>
                    <dd className="tabular mt-0.5 font-semibold">{money(riskAmt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Of the account</dt>
                    <dd
                      className={`tabular mt-0.5 font-semibold ${overRisk ? "text-sell" : ""}`}
                    >
                      {Number.isFinite(riskPct) ? `${riskPct.toFixed(2)}%` : "—"}
                    </dd>
                  </div>
                </dl>
                {overRisk && (
                  <p className="mt-2 text-sm text-sell">
                    Above {MAX_RISK_PCT}% of the account. Ten losses in a row —
                    which happens to everyone — would cost you about{" "}
                    {((1 - Math.pow(1 - riskPct / 100, 10)) * 100).toFixed(0)}% of
                    everything you have.
                  </p>
                )}
                {Number.isFinite(allowedUnits) && allowedUnits > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                    <p className="text-sm">
                      Risking {MAX_RISK_PCT}% with this stop allows{" "}
                      <span className="tabular font-semibold">
                        {allowedUnits.toLocaleString("en-US")}
                      </span>{" "}
                      units.
                    </p>
                    <button
                      type="button"
                      disabled={sizeMatches}
                      onClick={() => update("size", String(allowedUnits))}
                      className="rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft disabled:cursor-default disabled:border-border disabled:text-muted"
                    >
                      {sizeMatches ? "Size already matches" : "Use this size"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Fill in an entry and a stop and your risk appears here, in dollars
                and as a share of the account.
              </p>
            )}
          </div>

          {!hasStop && draft.entry > 0 && (
            <Callout tone="warn">
              No stop, so this trade has no defined risk. You cannot work out a
              position size from it, you cannot measure the result in R afterwards,
              and the loss is whatever the market decides it is. You can still log
              the trade — but that is what you are logging.
            </Callout>
          )}
        </Group>

        <Group
          legend="Your plan"
          blurb="What you decided before you clicked. Written afterwards it is a story; written beforehand it is something you can review."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="f-setup" label="Setup">
              <select
                id="f-setup"
                className={inputClass}
                value={fields.setupPick}
                onChange={(e) => update("setupPick", e.target.value)}
              >
                <option value="">Choose a setup…</option>
                {SETUP_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value={OTHER}>Something else</option>
              </select>
            </Field>
            {fields.setupPick === OTHER && (
              <Field
                id="f-setup-other"
                label="Name it yourself"
                hint="The name you would use again when you saw the same thing."
              >
                <input
                  id="f-setup-other"
                  type="text"
                  aria-describedby={describe("f-setup-other", true, false)}
                  className={inputClass}
                  value={fields.setupOther}
                  onChange={(e) => update("setupOther", e.target.value)}
                />
              </Field>
            )}
            <Field
              id="f-target"
              label="Target price"
              hint="Where you planned to take the profit."
            >
              <input
                id="f-target"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                aria-describedby={describe("f-target", true, false)}
                className={`${inputClass} tabular`}
                value={fields.target}
                onChange={(e) => update("target", e.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            {Number.isFinite(rr) ? (
              <>
                <p>
                  Planned reward against risk:{" "}
                  <span className="tabular font-semibold">{rr.toFixed(2)}:1</span>
                  {rr < MIN_RR && (
                    <span className="text-warn">
                      {" "}
                      — thinner than the {MIN_RR}:1 this site asks for.
                    </span>
                  )}
                </p>
                <p className="mt-1 text-muted">
                  At that ratio you need to be right{" "}
                  {breakevenWinRate(rr).toFixed(0)}% of the time just to break even.
                </p>
              </>
            ) : (
              <p className="text-muted">
                Add a stop and a target to see what you stood to make against what
                you stood to lose.
              </p>
            )}
          </div>

          <Field
            id="f-plan"
            label="Why you took it"
            hint="A sentence or two, written before you entered: why this, why now, and what would prove you wrong."
          >
            <textarea
              id="f-plan"
              rows={3}
              aria-describedby={describe("f-plan", true, false)}
              className={inputClass}
              value={fields.planNote}
              onChange={(e) => update("planNote", e.target.value)}
            />
          </Field>

          <div>
            <p className="block text-sm font-medium">Screenshot of your chart</p>
            <div className="mt-1.5">
              <ScreenshotInput
                key={shotKey}
                value={fields.screenshotId}
                onChange={(id) => update("screenshotId", id)}
              />
            </div>
          </div>
        </Group>

        <Group
          legend="How it went"
          blurb="Fill this in once the trade is finished. An open trade can still be graded on everything you have already decided."
        >
          <Field id="f-exit-reason" label="How did it end?">
            <select
              id="f-exit-reason"
              className={inputClass}
              value={fields.exitReason}
              onChange={(e) => {
                const reason = e.target.value as ExitReason;
                setSaved(null);
                setFields((prev) => ({
                  ...prev,
                  exitReason: reason,
                  /* A hit target or a hit stop has a price you already typed.
                     Offer it rather than asking for it twice. */
                  exit:
                    reason === "open"
                      ? ""
                      : reason === "target" && prev.target.trim()
                        ? prev.target
                        : reason === "stop" && prev.stop.trim()
                          ? prev.stop
                          : prev.exit,
                }));
              }}
            >
              <option value="open">It is still open</option>
              <option value="target">It reached my target</option>
              <option value="stop">It hit my stop</option>
              <option value="manual">I closed it myself</option>
            </select>
          </Field>

          {fields.exitReason !== "open" && (
            <Field
              id="f-exit"
              label="Exit price"
              hint="What you actually got out at, including any slippage."
            >
              <input
                id="f-exit"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                aria-describedby={describe("f-exit", true, false)}
                className={`${inputClass} tabular`}
                value={fields.exit}
                onChange={(e) => update("exit", e.target.value)}
              />
            </Field>
          )}
        </Group>

        <Group
          legend="Honesty check"
          blurb="Nobody sees these answers. They are also the ones that predict an emptied account better than any chart does."
        >
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-sm has-[:checked]:border-warn has-[:checked]:bg-warn-soft">
            <input
              type="checkbox"
              checked={fields.stopMovedAgainst}
              onChange={(e) => update("stopMovedAgainst", e.target.checked)}
              className="mt-0.5"
              style={{ accentColor: "var(--accent)" }}
            />
            <span>
              <span className="font-medium">
                I moved my stop further away after the trade went against me.
              </span>
              <span className="block text-xs text-muted">
                Moving a stop toward profit is fine. Moving it away turns a planned
                small loss into an unplanned large one.
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="f-count" label="Trades taken today" hint="Counting this one.">
              <input
                id="f-count"
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                aria-describedby={describe("f-count", true, false)}
                className={`${inputClass} tabular`}
                value={fields.tradesToday}
                onChange={(e) => update("tradesToday", e.target.value)}
              />
            </Field>
            <Field
              id="f-minutes"
              label="Minutes since your last losing trade"
              hint="Leave this blank if you had not lost yet today."
            >
              <input
                id="f-minutes"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                aria-describedby={describe("f-minutes", true, false)}
                className={`${inputClass} tabular`}
                value={fields.minutesSincePriorLoss}
                onChange={(e) => update("minutesSincePriorLoss", e.target.value)}
              />
            </Field>
          </div>
        </Group>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
          >
            Log this trade
          </button>
          <Link
            href="/journal/history/"
            className="text-sm text-muted underline underline-offset-4 hover:text-fg"
          >
            See your journal
          </Link>
        </div>

        {tried && !canSave && (
          <p role="alert" className="text-sm text-warn">
            {entryProblem ?? sizeProblem} Without a price and a size there is
            nothing here to measure.
          </p>
        )}
      </form>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div ref={panelRef} className="card scroll-mt-20 p-5">
          {saved ? (
            <div className="space-y-4">
              <p
                role="status"
                className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent"
              >
                Logged{saved.trade.symbol ? ` — ${saved.trade.symbol}` : ""} on{" "}
                {saved.trade.date}.
              </p>
              <GradeReport grade={saved.grade} title="Process grade" />
              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Link
                  href="/journal/history/"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  Open your journal
                </Link>
                <button
                  type="button"
                  onClick={() => setSaved(null)}
                  className="rounded-lg px-3 py-2 text-sm text-muted underline underline-offset-4 hover:text-fg"
                >
                  Log another
                </button>
              </div>
              <p className="text-sm text-muted">
                Your answers are still in the form, so a second trade takes a few
                seconds. The screenshot was cleared — attach the chart that belongs
                to the new trade.
              </p>
            </div>
          ) : draft.entry > 0 ? (
            <div className="space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                Live preview · nothing saved yet
              </p>
              <GradeReport grade={grade} title="Live grade" />
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted">
              <h2 className="font-display text-base font-semibold text-fg">
                Your grade appears here
              </h2>
              <p>
                It scores what you controlled: whether you had a stop, whether the
                size followed from it, whether you knew what you were trading, and
                whether you wrote down why.
              </p>
              <p>
                Whether the trade made money is shown beside the grade and never
                inside it. They are two separate results, and treating them as one
                is how a lucky win teaches the wrong lesson.
              </p>
              <p>Start with an entry price and this fills in as you type.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
