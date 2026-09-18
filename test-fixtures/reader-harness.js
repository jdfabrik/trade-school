/*
 * Screenshot reader harness.
 *
 * WHY: the reader was first "validated" against bold black text on pure white,
 * and that number was reported as if it meant something. It did not. This draws
 * screenshots that imitate how real platforms actually look — dark themes, small
 * axis labels, order-line tags, busy panels full of numbers that are not prices,
 * plus cropped, blurred and price-free cases — feeds each one through the REAL
 * upload path on /journal/, and compares what the reader found against what was
 * actually drawn.
 *
 * These are synthetic. Passing here is necessary, not sufficient: only real
 * broker captures prove the feature works. Nothing in the app imports this; it
 * is run by pasting it into the browser on the journal page.
 *
 * Usage: navigate to /journal/, then evaluate this file and call
 *        await runReaderHarness()
 */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const THEMES = {
  dark: { bg: "#131722", grid: "#1e222d", text: "#d1d4dc", dim: "#787b86", up: "#26a69a", down: "#ef5350" },
  light: { bg: "#ffffff", grid: "#e0e3eb", text: "#131722", dim: "#787b86", up: "#089981", down: "#f23645" },
  midnight: { bg: "#0b0e11", grid: "#1b1f24", text: "#eaecef", dim: "#848e9c", up: "#0ecb81", down: "#f6465d" },
};

function drawChart(ctx, W, H, t, seed, base, axisFont = "12px Arial") {
  const next = rng(seed);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  const axisW = 76;
  const plotW = W - axisW;
  const n = 60;
  const step = plotW / n;

  let p = base;
  const closes = [];
  for (let i = 0; i < n; i += 1) {
    p += (next() - 0.48) * base * 0.012;
    closes.push(p);
  }
  const lo = Math.min(...closes) * 0.995;
  const hi = Math.max(...closes) * 1.005;
  const y = (v) => 32 + (1 - (v - lo) / (hi - lo)) * (H - 74);

  const drawn = [];
  ctx.font = axisFont;
  const dp = base < 10 ? 4 : 2;
  for (let i = 0; i <= 4; i += 1) {
    const v = lo + ((hi - lo) * i) / 4;
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y(v));
    ctx.lineTo(plotW, y(v));
    ctx.stroke();
    const label = v.toFixed(dp);
    ctx.fillStyle = t.dim;
    ctx.fillText(label, plotW + 8, y(v) + 4);
    drawn.push(Number(label));
  }

  let prev = closes[0];
  for (let i = 0; i < n; i += 1) {
    const c = closes[i];
    const up = c >= prev;
    ctx.fillStyle = up ? t.up : t.down;
    ctx.strokeStyle = up ? t.up : t.down;
    const cx = i * step + step / 2;
    const bt = y(Math.max(prev, c));
    const bb = y(Math.min(prev, c));
    const span = Math.abs(c - prev) * 0.8 + base * 0.001;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, y(Math.max(prev, c) + span));
    ctx.lineTo(cx, y(Math.min(prev, c) - span));
    ctx.stroke();
    ctx.fillRect(cx - step * 0.3, bt, step * 0.6, Math.max(1, bb - bt));
    prev = c;
  }
  return { y, plotW, axisLabels: drawn };
}

function orderLine(ctx, g, t, price, label, colour, dp = 2) {
  ctx.strokeStyle = colour;
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, g.y(price));
  ctx.lineTo(g.plotW, g.y(price));
  ctx.stroke();
  ctx.setLineDash([]);
  const text = `${label} ${price.toFixed(dp)}`;
  ctx.font = "bold 12px Arial";
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = colour;
  ctx.fillRect(8, g.y(price) - 9, w, 18);
  ctx.fillStyle = t.bg;
  ctx.fillText(text, 14, g.y(price) + 4);
}

function header(ctx, t, ticker, extra) {
  ctx.fillStyle = t.text;
  ctx.font = "bold 15px Arial";
  ctx.fillText(ticker, 12, 21);
  ctx.fillStyle = t.dim;
  ctx.font = "12px Arial";
  ctx.fillText(extra, 14 + ctx.measureText(ticker).width, 21);
}

/** Each case draws itself and declares which prices a reader OUGHT to find. */
const CASES = [
  {
    name: "clear-dark-orderlines",
    note: "Dark platform, entry/stop/target order-line tags. The realistic good case.",
    mustFind: [48.6, 47.9, 50.0],
    draw(ctx, W, H) {
      const t = THEMES.dark;
      const g = drawChart(ctx, W, H, t, 101, 48.5);
      header(ctx, t, "AAPL", "5m · NASDAQ");
      orderLine(ctx, g, t, 48.6, "ENTRY", t.text);
      orderLine(ctx, g, t, 47.9, "STOP", t.down);
      orderLine(ctx, g, t, 50.0, "TARGET", t.up);
      return g.axisLabels;
    },
  },
  {
    name: "light-position-panel",
    note: "Light theme with a position panel instead of order lines — the other common layout.",
    mustFind: [131.25, 129.8, 134.5],
    draw(ctx, W, H) {
      const t = THEMES.light;
      const g = drawChart(ctx, W, H, t, 202, 131);
      header(ctx, t, "MSFT", "1m");
      ctx.fillStyle = "#f5f6f8";
      ctx.fillRect(W - 252, 58, 234, 134);
      ctx.strokeStyle = t.grid;
      ctx.strokeRect(W - 252, 58, 234, 134);
      ctx.fillStyle = t.text;
      ctx.font = "bold 13px Arial";
      ctx.fillText("POSITION", W - 240, 78);
      ctx.font = "12px Arial";
      [["Side", "BUY"], ["Qty", "150"], ["Entry", "131.25"], ["Stop", "129.80"], ["Target", "134.50"], ["P/L", "+487.50"]]
        .forEach((r, i) => {
          ctx.fillStyle = t.dim;
          ctx.fillText(r[0], W - 240, 100 + i * 15);
          ctx.fillStyle = t.text;
          ctx.fillText(r[1], W - 152, 100 + i * 15);
        });
      return g.axisLabels;
    },
  },
  {
    name: "small-text-forex",
    note: "Very dark theme, 10px axis text, 4-decimal forex prices. The hard but common case.",
    mustFind: [1.0842, 1.0815],
    draw(ctx, W, H) {
      const t = THEMES.midnight;
      const g = drawChart(ctx, W, H, t, 303, 1.084, "10px Arial");
      header(ctx, t, "EURUSD", "15m");
      orderLine(ctx, g, t, 1.0842, "E", t.text, 4);
      orderLine(ctx, g, t, 1.0815, "SL", t.down, 4);
      return g.axisLabels;
    },
  },
  {
    name: "noisy-many-non-prices",
    note: "Busy layout full of numbers that are NOT prices: volume, indicator periods, times, percentages.",
    mustFind: [212.4, 209.8],
    mustNotFind: [48221904, 1284],
    draw(ctx, W, H) {
      const t = THEMES.dark;
      const g = drawChart(ctx, W, H, t, 707, 212);
      header(ctx, t, "SPY", "5m · Vol 48,221,904");
      orderLine(ctx, g, t, 212.4, "ENTRY", t.text);
      orderLine(ctx, g, t, 209.8, "STOP", t.down);
      ctx.fillStyle = t.dim;
      ctx.font = "11px Arial";
      ["RSI(14) 62.8", "MACD(12,26,9)", "EMA 9 / 21 / 200", "Vol 48,221,904", "09:31:00", "14:45:22", "+2.41%", "1,284 trades"]
        .forEach((s, i) => ctx.fillText(s, 12, 292 + i * 16));
      return g.axisLabels;
    },
  },
  {
    name: "cropped-no-axis",
    note: "Cropped so the price axis is gone. Should find nothing and say so.",
    expectNothing: true,
    draw(ctx, W, H) {
      const t = THEMES.dark;
      drawChart(ctx, W + 240, H, t, 404, 220);
      ctx.fillStyle = t.bg;
      ctx.fillRect(W - 90, 0, 90, H);
      header(ctx, t, "TSLA", "5m");
      return [];
    },
  },
  {
    name: "no-price-labels",
    note: "A clean line chart with no numbers anywhere. Must not invent values.",
    expectNothing: true,
    draw(ctx, W, H) {
      const t = THEMES.dark;
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = t.up;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let y = H / 2;
      const next = rng(606);
      for (let i = 0; i < 80; i += 1) {
        y += (next() - 0.5) * 24;
        ctx.lineTo(i * (W / 80), y);
      }
      ctx.stroke();
      return [];
    },
  },
];

/** Redraw at low resolution then scale up, to imitate a soft phone crop. */
function blurCase(base) {
  return {
    ...base,
    name: base.name + "-blurred",
    note: base.note + " Downscaled to 45% and back up, so the text is soft.",
    degraded: true,
    render(W, H) {
      const full = document.createElement("canvas");
      full.width = W;
      full.height = H;
      base.draw(full.getContext("2d"), W, H);
      const small = document.createElement("canvas");
      small.width = Math.round(W * 0.45);
      small.height = Math.round(H * 0.45);
      small.getContext("2d").drawImage(full, 0, 0, small.width, small.height);
      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const c = out.getContext("2d");
      c.imageSmoothingEnabled = true;
      c.drawImage(small, 0, 0, W, H);
      return out;
    },
  };
}

const ALL = [...CASES, blurCase(CASES[0])];

async function feedAndRead(canvas, timeoutMs = 75000) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  const file = new File([blob], "shot.png", { type: "image/png" });
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("no file input on this page — are you on /journal/ ?");

  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const t = document.body.innerText;
    if (t.includes("Found") && t.includes("price")) break;
    if (t.includes("No prices could be read")) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const chips = [...new Set(
    [...document.querySelectorAll("button")]
      .map((b) => b.textContent.trim())
      .filter((x) => /^\d+(\.\d+)?$/.test(x))
      .map(Number),
  )];
  return { chips, seconds: Math.round((Date.now() - started) / 1000), bytes: blob.size };
}

function clearShot() {
  const remove = [...document.querySelectorAll("button")]
    .find((b) => /remove this image/i.test(b.getAttribute("aria-label") || b.textContent));
  if (remove) remove.click();
}

/** Run every case and return a result table. */
window.runReaderHarness = async function runReaderHarness(W = 900, H = 480) {
  const results = [];

  for (const c of ALL) {
    clearShot();
    await new Promise((r) => setTimeout(r, 300));

    let canvas;
    if (c.render) {
      canvas = c.render(W, H);
    } else {
      canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      c.draw(canvas.getContext("2d"), W, H);
    }

    const { chips, seconds, bytes } = await feedAndRead(canvas);
    const near = (a, b) => Math.abs(a - b) < Math.max(0.0002, Math.abs(b) * 0.001);

    const mustFind = c.mustFind ?? [];
    const found = mustFind.filter((p) => chips.some((x) => near(x, p)));
    const leaked = (c.mustNotFind ?? []).filter((p) => chips.some((x) => near(x, p)));

    results.push({
      case: c.name,
      note: c.note,
      kb: Math.round(bytes / 1024),
      seconds,
      chipsFound: chips.length,
      chips: chips.slice(0, 12),
      keyPricesWanted: mustFind.length,
      keyPricesFound: found.length,
      keyPricesMissed: mustFind.filter((p) => !found.some((f) => near(f, p))),
      nonPricesLeaked: leaked,
      expectedNothing: Boolean(c.expectNothing),
      verdict: c.expectNothing
        ? chips.length === 0
          ? "PASS — correctly found nothing"
          : `FAIL — invented ${chips.length} values`
        : mustFind.length === 0
          ? "n/a"
          : found.length === mustFind.length
            ? "PASS — found every key price"
            : found.length > 0
              ? `PARTIAL — ${found.length}/${mustFind.length}`
              : "FAIL — found none of the key prices",
    });
  }

  clearShot();
  return results;
};

"harness loaded — call: await runReaderHarness()";
