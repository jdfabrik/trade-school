"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import ScreenshotInput from "@/components/ScreenshotInput";
import GradeReport, { money } from "@/components/GradeReport";
import { Callout } from "@/components/ui";
import { gradeTrade } from "@/lib/grade";
import { addTrade, blankTrade, newTradeId } from "@/lib/journal";
import { journalStore, rulesStore } from "@/lib/clientStore";
import { loadAccountSize, saveAccountSize } from "@/lib/rules";
import { affordableSize, riskPercent, riskPerUnit, plannedRR } from "@/lib/trade";
import { SETUP_NAMES } from "@/content/setups";
import { readChart, rolesFor, READER_DOWNLOAD_MB } from "@/lib/ocr";
import { getShot } from "@/lib/screenshots";
import ScreenshotReader from "@/components/ScreenshotReader";
import type { ExtractedField } from "@/lib/extraction";
import type { Trade } from "@/lib/trade";

/* ------------------------------ small pieces ------------------------------ */

/** One question: a big label, a plain explanation, and the control. */
function Ask({
  label,
  why,
  children,
  hint,
}: {
  label: string;
  why: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold">{label}</h3>
          <p className="mt-1 text-sm text-muted">{why}</p>
        </div>
        <div className="sm:w-56 sm:shrink-0">{children}</div>
      </div>
      {hint && <div className="mt-2 text-sm">{hint}</div>}
    </div>
  );
}

const priceInput =
  "tabular w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg font-mono";

function Price({
  value,
  onChange,
  placeholder = "0.00",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${priceInput} ${disabled ? "opacity-40" : ""}`}
    />
  );
}

/** A two-option answer. Big enough to tap without thinking. */
function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div role="radiogroup" className="flex gap-2">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
              active
                ? "border-accent bg-accent-soft text-accent"
                : "border-border hover:border-accent"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Prices found on the screenshot, offered as one-tap answers. */
function PriceChips({
  prices,
  onPick,
  empty,
}: {
  prices: number[];
  onPick: (value: number) => void;
  empty?: string;
}) {
  if (prices.length === 0) {
    return empty ? <span className="text-xs text-muted">{empty}</span> : null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {prices.slice(0, 10).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPick(p)}
          className="tabular rounded-lg border border-accent/40 bg-accent-soft px-2.5 py-1 font-mono text-xs text-accent transition-colors hover:border-accent"
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- form ---------------------------------- */

const YES_NO = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export default function TradeForm() {
  const rules = useSyncExternalStore(
    rulesStore.subscribe,
    rulesStore.snapshot,
    rulesStore.serverSnapshot,
  );

  const [shot, setShot] = useState<string | null>(null);
  const [prices, setPrices] = useState<number[]>([]);
  const [shotBlob, setShotBlob] = useState<Blob | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [noStop, setNoStop] = useState(false);
  const [target, setTarget] = useState("");
  const [noTarget, setNoTarget] = useState(false);
  const [exit, setExit] = useState("");
  const [stillIn, setStillIn] = useState(false);
  const [size, setSize] = useState("");

  const [plannedStop, setPlannedStop] = useState("yes");
  const [movedStop, setMovedStop] = useState("no");
  const [wroteReason, setWroteReason] = useState("yes");

  const [account, setAccount] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountText, setAccountText] = useState("");

  const [showMore, setShowMore] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [setup, setSetup] = useState("");
  const [note, setNote] = useState("");
  const [tradesToday, setTradesToday] = useState("1");
  const [minutesSince, setMinutesSince] = useState("");

  const [saved, setSaved] = useState<Trade | null>(null);

  // Read the remembered account lazily; loadAccountSize is safe on the server
  // (it catches the missing window) and this render is the first that has one.
  const accountSize = account ?? loadAccountSize();

  const draft: Trade = useMemo(() => {
    const num = (s: string) => {
      const n = Number(s);
      return s.trim() === "" || !Number.isFinite(n) ? null : n;
    };
    const entryNum = num(entry) ?? 0;
    const exitNum = stillIn ? null : num(exit);

    return {
      ...blankTrade(),
      id: saved?.id ?? newTradeId(),
      symbol: symbol.trim() || "—",
      direction,
      accountSize,
      entry: entryNum,
      stop: noStop ? null : num(stop),
      target: noTarget ? null : num(target),
      size: num(size) ?? 0,
      exit: exitNum,
      exitReason: stillIn ? "open" : exitNum === null ? "open" : "manual",
      // "did you plan the stop before entering" is the honest version of the
      // stop check: a stop added afterwards is not the same thing
      setup: setup.trim(),
      planNote: wroteReason === "yes" ? note.trim() || "Written down before entering." : "",
      stopMovedAgainst: movedStop === "yes",
      stopPlannedBeforeEntry: plannedStop === "yes",
      tradesToday: Number(tradesToday) || 1,
      minutesSincePriorLoss:
        minutesSince.trim() === "" ? null : Number(minutesSince) || 0,
      screenshotId: shot ?? undefined,
    };
  }, [
    accountSize, direction, entry, stop, noStop, target, noTarget, exit, stillIn,
    size, setup, note, wroteReason, movedStop, plannedStop, tradesToday,
    minutesSince, shot, symbol, saved,
  ]);

  // gradeTrade handles the stop-timing answer itself, because it is part of the
  // trade. Patching the returned Grade here previously desynced the headline
  // from the letter, and the answer was lost the moment the trade was saved.
  const graded = useMemo(() => gradeTrade(draft, rules), [draft, rules]);

  const perUnit = riskPerUnit(draft);
  const riskPct = riskPercent(draft);
  const rr = plannedRR(draft);
  // Capped by what the account can actually buy. The risk rule alone once
  // recommended 24,999 shares — $2.5m of stock — on a $25,000 account, because
  // a very tight stop makes the formula ask for a very large position.
  const sizing =
    !noStop && Number.isFinite(perUnit) && draft.entry > 0
      ? affordableSize(accountSize, rules.maxRiskPct, draft.entry, draft.stop as number, {
          explain: true,
        })
      : null;
  const suggested = sizing ? sizing.size : NaN;

  const ready = draft.entry > 0 && draft.size > 0;

  // Once the entry is known a stop can only be on one side of it, so the chips
  // narrow to the prices that could actually be right.
  const roles = rolesFor(prices, draft.entry > 0 ? draft.entry : null, direction);

  function save() {
    if (!ready) return;
    saveAccountSize(accountSize);
    journalStore.refresh(addTrade(draft));
    setSaved(draft);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function again() {
    setSaved(null);
    setShot(null);
    setEntry("");
    setStop("");
    setTarget("");
    setExit("");
    setSize("");
    setNote("");
    setNoStop(false);
    setNoTarget(false);
    setStillIn(false);
  }

  /* ------------------------------ saved view ------------------------------ */

  if (saved) {
    return (
      <div className="space-y-6">
        <Callout tone="note">
          Saved to your journal, in this browser.
        </Callout>
        <GradeReport grade={graded} title="How you traded" />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={again}
            className="rounded-xl bg-accent px-5 py-3 font-medium text-bg"
          >
            Grade another trade
          </button>
          <Link
            href="/journal/history/"
            className="rounded-xl border border-border px-5 py-3 font-medium transition-colors hover:border-accent hover:text-accent"
          >
            See all your trades
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------- the form ------------------------------- */

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        {/* 1. the screenshot */}
        <section className="card p-5">
          <h2 className="font-display text-lg font-semibold">
            1. Drop in your chart screenshot
          </h2>
          <p className="mt-1 text-sm text-muted">
            Mainly so that in a month you can still see what the trade actually
            looked like. The site will also try to read the prices off it and
            offer them as buttons — that works when the text on your chart is
            large and high-contrast, and often does not on a dark theme with
            small axis labels. When it cannot read your chart it will say so
            rather than guess. Typing the numbers always works.
          </p>
          <div className="mt-4">
            <ScreenshotInput
              value={shot}
              onChange={(id) => {
                setShot(id);
                setPrices([]);
                setReadFailed(false);
                if (!id) {
                  setReading(null);
                  setShotBlob(null);
                  return;
                }
                setReading(0);
                getShot(id)
                  .then((stored) => {
                    if (!stored) throw new Error("no image");
                    setShotBlob(stored.blob);
                    return readChart(stored.blob, (f) => setReading(f));
                  })
                  .then(({ prices: found }) => {
                    setPrices(found);
                    setReading(null);
                    setReadFailed(found.length === 0);
                  })
                  .catch(() => {
                    setReading(null);
                    setReadFailed(true);
                  });
              }}
            />

            {reading !== null && (
              <div className="mt-3" role="status">
                <p className="text-sm text-muted">
                  Reading the numbers off your chart… {Math.round(reading * 100)}%
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${Math.round(reading * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  The first time, this downloads about {READER_DOWNLOAD_MB}MB of
                  reader from this site — worth knowing if you are on mobile
                  data. After that your browser keeps it and reading is quick.
                </p>
              </div>
            )}

            {prices.length > 0 && (
              <div className="mt-3 rounded-xl border border-accent/40 bg-accent-soft/40 p-3">
                <p className="text-sm font-medium text-accent">
                  Found {prices.length} price{prices.length === 1 ? "" : "s"} on your
                  chart.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Check every one against your chart before you tap it. This reads
                  the text printed on the picture — it does not know which number
                  was your entry, and it can misread a digit.
                </p>
              </div>
            )}

            <ScreenshotReader
              blob={shotBlob}
              onUse={(values: Partial<Record<ExtractedField, string>>) => {
                // Only the fields the trader ticked, and each still lands in a
                // normal input they can edit before anything is graded.
                if (values.entry !== undefined) setEntry(values.entry);
                if (values.stop !== undefined) {
                  setStop(values.stop);
                  setNoStop(false);
                }
                if (values.target !== undefined) {
                  setTarget(values.target);
                  setNoTarget(false);
                }
                if (values.exit !== undefined) {
                  setExit(values.exit);
                  setStillIn(false);
                }
                if (values.size !== undefined) setSize(values.size);
                if (values.symbol !== undefined) {
                  setSymbol(values.symbol);
                  setShowMore(true);
                }
                if (values.direction === "long" || values.direction === "short") {
                  setDirection(values.direction);
                }
              }}
            />

            {readFailed && (
              <p className="mt-3 text-sm text-muted">
                No prices could be read off that image with enough confidence to
                show you. That usually means the text is small or low-contrast —
                a dark theme with tiny axis labels is the common case. It is
                deliberately cautious here: a wrong price offered as a suggestion
                is worse than none, because you would tap it straight into your
                journal. Type the numbers in below.
              </p>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            The picture never leaves your computer — the reading happens on your
            own device, because there is no server behind this page. It reads the
            text printed on the image; it cannot see the chart itself or judge
            the trade, so you confirm which number was which.
          </p>
        </section>

        {/* 2. the numbers */}
        <section className="card mt-5 p-5">
          <h2 className="font-display text-lg font-semibold">2. The numbers</h2>
          <p className="mt-1 text-sm text-muted">
            Six things. Read them off your chart or your broker.
          </p>

          <div className="mt-4">
            <Ask
              label="Did you buy or sell?"
              why="Buying first is a long — you want the price to rise. Selling first is a short."
            >
              <Choice
                value={direction}
                onChange={(v) => setDirection(v as "long" | "short")}
                options={[
                  { id: "long", label: "Bought" },
                  { id: "short", label: "Sold" },
                ]}
              />
            </Ask>

            <Ask
              label="Where did you get in?"
              why="The price you were actually filled at, not the one you hoped for."
              hint={
                <PriceChips prices={prices} onPick={(v) => setEntry(String(v))} />
              }
            >
              <Price value={entry} onChange={setEntry} />
            </Ask>

            <Ask
              label="Where was your stop?"
              why="The price where you would have admitted the idea was wrong and got out."
              hint={
                noStop ? (
                  <span className="text-warn">
                    Without a stop this trade had no defined risk — the loss was
                    whatever the market decided. You can still log it.
                  </span>
                ) : (
                  <div className="space-y-2">
                    {Number.isFinite(perUnit) && (
                      <span className="block text-muted">
                        That is {money(perUnit)} a share at risk.
                      </span>
                    )}
                    <PriceChips
                      prices={roles.stops}
                      onPick={(v) => setStop(String(v))}
                    />
                  </div>
                )
              }
            >
              <Price value={stop} onChange={setStop} disabled={noStop} />
              <button
                type="button"
                onClick={() => setNoStop((v) => !v)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs transition-colors ${
                  noStop ? "border-warn text-warn" : "border-border text-muted hover:text-fg"
                }`}
              >
                {noStop ? "I did have a stop" : "I did not have a stop"}
              </button>
            </Ask>

            <Ask
              label="How many shares?"
              why="The size of the position. This is what turns a price gap into an amount of money."
              hint={
                Number.isFinite(suggested) ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-muted">
                      {sizing?.limitedByCash ? (
                        <>
                          Your {rules.maxRiskPct}% limit would allow{" "}
                          <strong className="tabular text-fg">
                            {Math.floor(sizing.byRisk).toLocaleString()}
                          </strong>
                          , but {money(accountSize)} only buys{" "}
                          <strong className="tabular text-fg">
                            {suggested.toLocaleString()}
                          </strong>
                          . A stop this tight is too tight to size the trade
                          properly — it is not an invitation to buy more than you
                          can pay for.
                        </>
                      ) : (
                        <>
                          Your {rules.maxRiskPct}% limit allows{" "}
                          <strong className="tabular text-fg">
                            {suggested.toLocaleString()}
                          </strong>
                          .
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSize(String(suggested))}
                      className="rounded-lg border border-border px-2 py-1 text-xs transition-colors hover:border-accent hover:text-accent"
                    >
                      Use that
                    </button>
                  </span>
                ) : null
              }
            >
              <Price value={size} onChange={setSize} placeholder="0" />
            </Ask>

            <Ask
              label="Where were you aiming to get out?"
              why="Your target. Knowing it beforehand is how you tell whether the trade was worth the risk at all."
              hint={
                noTarget ? (
                  <span className="text-warn">
                    With no target you had no way to know if the reward justified
                    the risk before you took it.
                  </span>
                ) : (
                  <div className="space-y-2">
                    {Number.isFinite(rr) && (
                      <span
                        className={`block ${rr >= rules.minRR ? "text-buy" : "text-warn"}`}
                      >
                        That is {rr.toFixed(2)} to 1 against your stop
                        {rr < rules.minRR
                          ? `, below the ${rules.minRR} to 1 you set.`
                          : "."}
                      </span>
                    )}
                    <PriceChips
                      prices={roles.targets}
                      onPick={(v) => setTarget(String(v))}
                    />
                  </div>
                )
              }
            >
              <Price value={target} onChange={setTarget} disabled={noTarget} />
              <button
                type="button"
                onClick={() => setNoTarget((v) => !v)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs transition-colors ${
                  noTarget ? "border-warn text-warn" : "border-border text-muted hover:text-fg"
                }`}
              >
                {noTarget ? "I did have a target" : "I had no target"}
              </button>
            </Ask>

            <Ask
              label="Where did you get out?"
              why="Leave this if you are still holding — everything you have already decided can still be graded."
              hint={
                stillIn ? null : (
                  <PriceChips prices={prices} onPick={(v) => setExit(String(v))} />
                )
              }
            >
              <Price value={exit} onChange={setExit} disabled={stillIn} />
              <button
                type="button"
                onClick={() => setStillIn((v) => !v)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs transition-colors ${
                  stillIn ? "border-accent text-accent" : "border-border text-muted hover:text-fg"
                }`}
              >
                {stillIn ? "I have closed it" : "I am still in it"}
              </button>
            </Ask>
          </div>

          {/* account, remembered */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
            {editingAccount ? (
              <>
                <label htmlFor="acct" className="text-muted">
                  Account size
                </label>
                <input
                  id="acct"
                  type="number"
                  value={accountText}
                  onChange={(e) => setAccountText(e.target.value)}
                  className="tabular w-32 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const n = Number(accountText);
                    if (Number.isFinite(n) && n > 0) {
                      setAccount(n);
                      saveAccountSize(n);
                    }
                    setEditingAccount(false);
                  }}
                  className="rounded-lg border border-accent px-3 py-1.5 text-xs text-accent"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span className="text-muted">
                  Account size: <strong className="tabular text-fg">{money(accountSize)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAccountText(String(accountSize));
                    setEditingAccount(true);
                  }}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-fg"
                >
                  Change
                </button>
                <span className="text-xs text-muted">Remembered for next time.</span>
              </>
            )}
          </div>
        </section>

        {/* 3. the honest bit */}
        <section className="card mt-5 p-5">
          <h2 className="font-display text-lg font-semibold">3. Three honest questions</h2>
          <p className="mt-1 text-sm text-muted">
            Nobody sees these. They predict an emptied account better than any
            chart does, so they are worth answering truthfully even when the
            answer is annoying.
          </p>

          <div className="mt-4">
            <Ask
              label="Did you decide the stop before you got in?"
              why="A stop worked out afterwards is a reaction. Deciding beforehand, while you are calm, is the whole point of having one."
            >
              <Choice value={plannedStop} onChange={setPlannedStop} options={YES_NO} />
            </Ask>

            <Ask
              label="Did you move your stop further away?"
              why="Moving it toward profit is fine. Moving it away turns a planned small loss into an unplanned large one, and it is the habit that ends accounts."
            >
              <Choice value={movedStop} onChange={setMovedStop} options={YES_NO} />
            </Ask>

            <Ask
              label="Did you write down why, before entering?"
              why="Written afterwards it is a story that fits the result. Written beforehand it is something you can actually review."
            >
              <Choice value={wroteReason} onChange={setWroteReason} options={YES_NO} />
            </Ask>
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className="mt-4 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
          >
            {showMore ? "Hide the extra details" : "Add symbol, setup and notes (optional)"}
          </button>

          {showMore && (
            <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted">Symbol</span>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="AAPL"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Setup you were trading</span>
                <select
                  value={setup}
                  onChange={(e) => setSetup(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <option value="">Not named</option>
                  {SETUP_NAMES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value="Something else">Something else</option>
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted">
                  What you wrote down before entering
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Why this, why now, and what would prove you wrong."
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Trade number today</span>
                <input
                  type="number"
                  value={tradesToday}
                  onChange={(e) => setTradesToday(e.target.value)}
                  className="tabular mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Minutes since your last loss</span>
                <input
                  type="number"
                  value={minutesSince}
                  onChange={(e) => setMinutesSince(e.target.value)}
                  placeholder="blank if none"
                  className="tabular mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono"
                />
              </label>
            </div>
          )}
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!ready}
            className="rounded-xl bg-accent px-6 py-3 font-medium text-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save this trade
          </button>
          {!ready && (
            <span className="text-sm text-muted">
              Add where you got in and how many shares, and the grade appears.
            </span>
          )}
        </div>
      </div>

      {/* live grade, alongside */}
      <aside className="lg:sticky lg:top-24">
        {ready ? (
          <>
            <GradeReport grade={graded} title="Your grade so far" />
            {Number.isFinite(riskPct) && (
              <p
                className={`mt-3 text-sm ${
                  riskPct > rules.maxRiskPct ? "text-warn" : "text-muted"
                }`}
              >
                This trade put <strong className="tabular">{money(perUnit * draft.size)}</strong> at
                risk, which is {riskPct.toFixed(2)}% of your account.{" "}
                {riskPct > rules.maxRiskPct
                  ? `That is above the ${rules.maxRiskPct}% limit you set.`
                  : "That is within the limit you set."}
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Not the grade you expected?{" "}
              <Link href="/settings/" className="underline underline-offset-4">
                These thresholds are yours to set.
              </Link>
            </p>
          </>
        ) : (
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold">Your grade appears here</h2>
            <p className="mt-2 text-sm text-muted">
              It scores the decisions you made, not whether the trade made money —
              those are two separate results, and treating them as one is how a
              lucky win teaches the wrong lesson.
            </p>
            <p className="mt-2 text-sm text-muted">
              Start with where you got in and how many shares.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
