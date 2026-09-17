/**
 * Fetches a price snapshot from Yahoo's public chart endpoint and writes it into
 * src/data/. The result is COMMITTED, deliberately: the guide itself warns that
 * Yahoo revises adjusted closes, so a live feed would make the numbers drift
 * under the learner and break the tests that pin them.
 *
 *   node scripts/fetch-prices.mjs
 *
 * If the network is unavailable the script exits non-zero and changes nothing,
 * rather than writing a synthetic series that pretends to be real.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const OUT_DIR = resolve(import.meta.dirname, "../src/data");

/** Daily series for the Bollinger lab. Close, not Adj Close — it is a strategy. */
const DAILY_SYMBOL = "TSLA";

/** Monthly series for the asset-selection and portfolio labs. */
const MONTHLY_SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL",
  "META", "JPM", "XOM", "JNJ", "PG",
  "KO", "HSY", "COST", "UNH", "V",
];

const START = Date.UTC(2023, 0, 1) / 1000;
const END = Date.UTC(2026, 0, 2) / 1000;

async function chart(symbol, interval) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=${START}&period2=${END}&interval=${interval}&events=div%2Csplit`;

  // 429 means "slow down", so back off and try again a few times before giving up.
  let res;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (res.status !== 429) break;
    const wait = 2000 * 2 ** attempt;
    console.warn(`  ${symbol}: rate limited, waiting ${wait}ms`);
    await new Promise((r) => setTimeout(r, wait));
  }
  if (!res || !res.ok) {
    throw new Error(`${symbol} ${interval}: HTTP ${res ? res.status : "no response"}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`${symbol} ${interval}: no result in payload`);

  const stamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const adj = result.indicators?.adjclose?.[0]?.adjclose ?? [];

  const rows = [];
  for (let i = 0; i < stamps.length; i += 1) {
    const close = quote.close?.[i];
    if (close == null) continue;
    rows.push({
      date: new Date(stamps[i] * 1000).toISOString().slice(0, 10),
      close: Number(close.toFixed(4)),
      adjClose: adj[i] == null ? null : Number(adj[i].toFixed(4)),
    });
  }
  if (rows.length === 0) throw new Error(`${symbol} ${interval}: no usable rows`);
  return rows;
}

async function write(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data) + "\n", "utf8");
  console.log(`wrote ${path}`);
}

const fetchedAt = new Date().toISOString().slice(0, 10);

const daily = await chart(DAILY_SYMBOL, "1d");
await write(resolve(OUT_DIR, "daily.json"), {
  symbol: DAILY_SYMBOL,
  interval: "1d",
  column: "close",
  fetchedAt,
  source: "Yahoo Finance chart API",
  rows: daily,
});

const monthly = {};
let dates = [];
for (const symbol of MONTHLY_SYMBOLS) {
  try {
    const rows = await chart(symbol, "1mo");
    // Adj Close for returns, exactly as the guide insists.
    monthly[symbol] = rows.map((r) => r.adjClose ?? r.close);
    if (rows.length > dates.length) dates = rows.map((r) => r.date);
    process.stdout.write(`  ${symbol} (${rows.length})`);
  } catch (err) {
    console.warn(`\n  skipped ${symbol}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}
console.log();

// Keep only series that share the full history, which is what dropna(axis=1) does.
const full = Object.fromEntries(
  Object.entries(monthly).filter(([, v]) => v.length === dates.length),
);

await write(resolve(OUT_DIR, "monthly.json"), {
  interval: "1mo",
  column: "adjClose",
  fetchedAt,
  source: "Yahoo Finance chart API",
  dates,
  series: full,
});

console.log(
  `\ndone — ${daily.length} daily bars of ${DAILY_SYMBOL}, ` +
    `${Object.keys(full).length} of ${MONTHLY_SYMBOLS.length} monthly series kept`,
);
