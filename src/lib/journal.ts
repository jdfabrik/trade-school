/**
 * The trade journal, kept in this browser.
 *
 * Every read and write is wrapped, because localStorage throws in private
 * windows and where site data is blocked. Someone with storage disabled can
 * still log a trade and read the grade — they just will not get a history.
 */
import type { Trade } from "./trade";

const KEY = "ts:journal:v1";

export function loadTrades(): Trade[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Trade[]) : [];
  } catch {
    return [];
  }
}

function persist(trades: Trade[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(trades));
  } catch {
    /* quota or private mode — the current grade still shows */
  }
}

/** Newest first, which is how the journal reads. */
export function sortTrades(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function addTrade(trade: Trade): Trade[] {
  const next = sortTrades([trade, ...loadTrades().filter((t) => t.id !== trade.id)]);
  persist(next);
  return next;
}

export function updateTrade(trade: Trade): Trade[] {
  const next = sortTrades(loadTrades().map((t) => (t.id === trade.id ? trade : t)));
  persist(next);
  return next;
}

export function deleteTrade(id: string): Trade[] {
  const next = loadTrades().filter((t) => t.id !== id);
  persist(next);
  return next;
}

export function clearJournal(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function newTradeId(): string {
  return `trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** A blank trade, dated today, for the form to start from. */
export function blankTrade(): Trade {
  return {
    id: newTradeId(),
    date: new Date().toISOString().slice(0, 10),
    symbol: "",
    direction: "long",
    accountSize: 25_000,
    entry: 0,
    stop: null,
    target: null,
    size: 0,
    exit: null,
    exitReason: "open",
    setup: "",
    planNote: "",
    stopMovedAgainst: false,
    tradesToday: 1,
    minutesSincePriorLoss: null,
  };
}

/**
 * Everything needed to export a journal as a spreadsheet-friendly file.
 *
 * The column headings are the words the site uses on screen, not the field
 * names underneath, because the person opening this file is a trader reading
 * their own journal in a spreadsheet.
 */
const CSV_COLUMNS: { key: keyof Trade; heading: string }[] = [
  { key: "date", heading: "Date" },
  { key: "symbol", heading: "Symbol" },
  { key: "direction", heading: "Direction" },
  { key: "accountSize", heading: "Account size" },
  { key: "entry", heading: "Entry" },
  { key: "stop", heading: "Stop" },
  { key: "target", heading: "Target" },
  { key: "size", heading: "Size" },
  { key: "exit", heading: "Exit" },
  { key: "exitReason", heading: "How it ended" },
  { key: "setup", heading: "Setup" },
  { key: "planNote", heading: "Why you took it" },
  { key: "stopMovedAgainst", heading: "Stop moved against you" },
  { key: "tradesToday", heading: "Trades that day" },
  { key: "minutesSincePriorLoss", heading: "Minutes since the last loss" },
];

export function toCsv(trades: Trade[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = trades.map((t) =>
    CSV_COLUMNS.map((c) => escape(t[c.key])).join(","),
  );
  return [CSV_COLUMNS.map((c) => escape(c.heading)).join(","), ...rows].join("\n");
}
