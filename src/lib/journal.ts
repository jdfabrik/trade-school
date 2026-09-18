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
    stopPlannedBeforeEntry: true,
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
  // The id travels with the row so that re-importing a file updates the trades
  // it already knows about instead of duplicating every one of them.
  { key: "id", heading: "id" },
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
  { key: "stopPlannedBeforeEntry", heading: "Stop planned before entry" },
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

/* --------------------------------- import --------------------------------- */

const DIRECTIONS = new Set(["long", "short"]);
const EXIT_REASONS = new Set(["target", "stop", "manual", "open"]);

/**
 * Split one CSV line into fields, honouring the quoting `toCsv` writes: a field
 * may contain commas, newlines and doubled quotes.
 */
function splitRow(text: string, start: number): { fields: string[]; next: number } {
  const fields: string[] = [];
  let field = "";
  let i = start;
  let quoted = false;

  while (i < text.length) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      fields.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n") {
      i += 1;
      break;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  fields.push(field);
  return { fields, next: i };
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  while (i < text.length) {
    const { fields, next } = splitRow(text, i);
    // a single empty field is a blank line, not a row
    if (!(fields.length === 1 && fields[0].trim() === "")) rows.push(fields);
    if (next === i) break;
    i = next;
  }
  return rows;
}

function optionalNumber(raw: string): number | null | undefined {
  const value = raw.trim();
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export interface ImportResult {
  trades: Trade[];
  /** One plain-English line per row that could not be used. */
  errors: string[];
}

/**
 * Read a journal back from a CSV this site exported.
 *
 * Treats the file as untrusted: a row that cannot be understood is reported and
 * skipped rather than imported as something half-formed, and the good rows still
 * come through. Screenshot references are dropped deliberately — the images live
 * in this browser's storage and are not in the file, so keeping the id would
 * leave a trade pointing at a picture that does not exist.
 */
export function fromCsv(text: string): ImportResult {
  const errors: string[] = [];
  const rows = parseRows(text ?? "");

  if (rows.length === 0) {
    return { trades: [], errors: ["That file is empty."] };
  }

  const header = rows[0].map((h) => h.trim());

  // Accept either the friendly headings this site writes ("Account size") or the
  // plain field names, so a file someone has tidied up in a spreadsheet still
  // imports.
  const byHeading = new Map(
    CSV_COLUMNS.map((c) => [c.heading.toLowerCase(), c.key as string]),
  );
  const index = new Map<string, number>();
  header.forEach((h, i) => {
    const key = byHeading.get(h.toLowerCase()) ?? h;
    if (!index.has(key)) index.set(key, i);
  });

  if (!index.has("symbol") || !index.has("entry")) {
    return {
      trades: [],
      errors: [
        "This does not look like a trade journal file. It needs at least a symbol and an entry column — export one from this page to see the format.",
      ],
    };
  }

  const cell = (row: string[], name: string) => (row[index.get(name) ?? -1] ?? "").trim();
  const trades: Trade[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    const line = r + 1;
    const base = blankTrade();

    const entry = Number(cell(row, "entry"));
    if (!Number.isFinite(entry)) {
      errors.push(`Row ${line}: the entry price "${cell(row, "entry")}" is not a number.`);
      continue;
    }

    const size = cell(row, "size") === "" ? base.size : Number(cell(row, "size"));
    if (!Number.isFinite(size)) {
      errors.push(`Row ${line}: the size "${cell(row, "size")}" is not a number.`);
      continue;
    }

    const stop = optionalNumber(cell(row, "stop"));
    const target = optionalNumber(cell(row, "target"));
    const exit = optionalNumber(cell(row, "exit"));
    if (stop === undefined || target === undefined || exit === undefined) {
      errors.push(`Row ${line}: a stop, target or exit price is not a number.`);
      continue;
    }

    const accountRaw = cell(row, "accountSize");
    const account = accountRaw === "" ? base.accountSize : Number(accountRaw);
    if (!Number.isFinite(account)) {
      errors.push(`Row ${line}: the account size "${accountRaw}" is not a number.`);
      continue;
    }

    const direction = cell(row, "direction").toLowerCase();
    const exitReason = cell(row, "exitReason").toLowerCase();
    const minutes = optionalNumber(cell(row, "minutesSincePriorLoss"));
    const tradesToday = Number(cell(row, "tradesToday"));

    trades.push({
      ...base,
      id: cell(row, "id") || newTradeId(),
      date: cell(row, "date") || base.date,
      symbol: cell(row, "symbol"),
      direction: DIRECTIONS.has(direction) ? (direction as Trade["direction"]) : "long",
      accountSize: account,
      entry,
      stop,
      target,
      size,
      exit,
      exitReason: EXIT_REASONS.has(exitReason)
        ? (exitReason as Trade["exitReason"])
        : exit === null
          ? "open"
          : "manual",
      setup: cell(row, "setup"),
      planNote: cell(row, "planNote"),
      stopMovedAgainst: cell(row, "stopMovedAgainst").toLowerCase() === "true",
      // absent means "not asked", which must not read as an admission
      stopPlannedBeforeEntry:
        cell(row, "stopPlannedBeforeEntry").trim() === ""
          ? undefined
          : cell(row, "stopPlannedBeforeEntry").toLowerCase() === "true",
      tradesToday: Number.isFinite(tradesToday) ? tradesToday : base.tradesToday,
      minutesSincePriorLoss: minutes === undefined ? null : minutes,
      // deliberately not carried: the image is not in the file
      screenshotId: undefined,
    });
  }

  if (trades.length === 0 && errors.length === 0) {
    errors.push("That file has a header but no trades in it.");
  }

  return { trades, errors };
}

/**
 * Merge imported trades into the journal, replacing any with the same id and
 * keeping the rest. Returns the new journal and how it changed.
 */
export function mergeTrades(incoming: Trade[]): {
  trades: Trade[];
  added: number;
  replaced: number;
} {
  const existing = loadTrades();
  const byId = new Map(existing.map((t) => [t.id, t]));
  let added = 0;
  let replaced = 0;

  for (const t of incoming) {
    if (byId.has(t.id)) replaced += 1;
    else added += 1;
    byId.set(t.id, t);
  }

  const next = sortTrades([...byId.values()]);
  persist(next);
  return { trades: next, added, replaced };
}
