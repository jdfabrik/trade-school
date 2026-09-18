/**
 * Reading a trade off a screenshot with a vision model, using the trader's own
 * API key.
 *
 * WHY THIS EXISTS: in-browser character recognition was measured against
 * realistic platform screenshots and extracted nothing usable from any of them —
 * and before it was made cautious, it returned confidently wrong prices. A model
 * that can actually look at the image is the only way to do what this feature
 * claims.
 *
 * WHAT IT COSTS THE TRADER'S PRIVACY: the image goes to whichever provider they
 * choose, using their own key. That is a real change from "nothing leaves your
 * device", so it is opt-in, per-image, and never automatic. Trade School has no
 * server in the middle and never sees the image or the key.
 *
 * KEEPING IT CHEAP, which is a design constraint rather than an afterthought:
 *   - the image is downscaled before sending, because vision billing follows
 *     pixels and a 1600px chart reads as well as a 3000px one
 *   - the default model is the cheapest one that can do this
 *   - one call per image, only when the trader clicks
 *   - results are cached against the image so re-grading never pays twice
 *   - the estimated cost is shown before the call, not after
 */
import {
  blankTrade,
  type Extraction,
  type ExtractedTrade,
  type FieldStatus,
  type Observation,
} from "./extraction";

export type ProviderId = "openai" | "anthropic";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  /** The cheapest model of theirs that reads a chart reliably enough to try. */
  model: string;
  /** Where the trader gets a key. */
  keyUrl: string;
  /** USD per million tokens, for the estimate. */
  price: { input: number; output: number };
  keyLooksLike: RegExp;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    model: "gpt-5-mini",
    keyUrl: "https://platform.openai.com/api-keys",
    price: { input: 0.25, output: 2 },
    keyLooksLike: /^sk-[A-Za-z0-9_-]{20,}$/,
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    model: "claude-haiku-4-5-20251001",
    keyUrl: "https://console.anthropic.com/settings/keys",
    price: { input: 1, output: 5 },
    keyLooksLike: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
  },
};

/** Longest edge sent to the model. Bigger costs more and reads no better. */
export const MAX_EDGE = 1600;

/* ------------------------------- the key --------------------------------- */

/**
 * Held in memory for this tab only, never written to storage.
 *
 * Browser storage is readable by any script that ends up on the page, and an
 * API key is a spending credential. Losing it on reload is the correct trade.
 */
let apiKey: string | null = null;
let keyProvider: ProviderId | null = null;

export function setKey(provider: ProviderId, key: string): void {
  apiKey = key.trim() || null;
  keyProvider = apiKey ? provider : null;
}

export function clearKey(): void {
  apiKey = null;
  keyProvider = null;
}

export function hasKey(provider: ProviderId): boolean {
  return apiKey !== null && keyProvider === provider;
}

/* ----------------------------- the image --------------------------------- */

export interface PreparedImage {
  dataUrl: string;
  base64: string;
  mediaType: string;
  width: number;
  height: number;
  bytes: number;
  /** Rough token cost of an image this size, for the estimate. */
  estimatedTokens: number;
}

/**
 * Downscale and re-encode before sending.
 *
 * Re-encoding also drops whatever metadata the original carried — camera, phone,
 * location — which has no business being sent anywhere.
 */
export async function prepareImage(blob: Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser would not give us a canvas to resize with.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // PNG, because chart text survives it and JPEG artefacts around thin glyphs
  // are exactly what makes a price hard to read.
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);

  return {
    dataUrl,
    base64,
    mediaType: "image/png",
    width,
    height,
    bytes: Math.round((base64.length * 3) / 4),
    // both providers bill images at roughly (w*h)/750 tokens
    estimatedTokens: Math.ceil((width * height) / 750),
  };
}

/** Pennies, rounded up, so nobody is surprised by the bill. */
export function estimateCents(provider: ProviderInfo, image: PreparedImage): number {
  const inputTokens = image.estimatedTokens + 700; // prompt and schema
  const outputTokens = 700;
  const dollars =
    (inputTokens / 1_000_000) * provider.price.input +
    (outputTokens / 1_000_000) * provider.price.output;
  return Math.max(0.01, Math.ceil(dollars * 100 * 100) / 100);
}

/* ------------------------------ the prompt -------------------------------- */

const INSTRUCTIONS = `You are reading a screenshot of a stock, futures or forex trade taken from a broker or charting platform.

Report ONLY what the image actually shows. This is the whole job. A trader will
be graded on these numbers, so a confident guess is far worse than an honest
"missing".

For each field return an object:
  status: "visible"    the value is printed on the image and you read it
          "inferred"   you worked it out from something else on the image
          "missing"    it is not on the image
          "unreadable" something is there but you cannot read it reliably
  value: the value, only when status is visible or inferred
  confidence: 0 to 1
  sawText: the exact text you read it from, verbatim, when there is one
  region: {x,y,w,h} as fractions of the image, when you can localise it
  note: why, when status is inferred, missing or unreadable

Rules you must not break:
- Never invent a number. If the axis is cropped or the text is too small, say unreadable.
- A price you can see but whose ROLE you are unsure of is not a visible entry price.
  Put it in issues and mark the field inferred or unreadable.
- Do not infer direction from the colour of a candle or from profit being positive.
  Only report direction as visible if the image says BUY/SELL/LONG/SHORT or shows
  an order marker that states it.
- Do not convert currencies or units. Report what is printed.
- If the image shows more than one trade, say so in issues and extract nothing.
- If it is not a trade screenshot at all, say so in issues and mark every field missing.

Return ONLY JSON matching exactly:
{"platform":string|null,
 "issues":string[],
 "trade":{"symbol":F,"direction":F,"entry":F,"stop":F,"target":F,"exit":F,"size":F,"pnl":F}}
where F is the field object described above. direction's value must be "long" or "short".`;

/* ------------------------------ the calls --------------------------------- */

async function callOpenAI(key: string, model: string, image: PreparedImage) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: INSTRUCTIONS },
            { type: "image_url", image_url: { url: image.dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(await describeHttpError(res, "OpenAI"));
  const json = await res.json();
  return {
    text: json.choices?.[0]?.message?.content ?? "",
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}

async function callAnthropic(key: string, model: string, image: PreparedImage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: image.mediaType, data: image.base64 },
            },
            { type: "text", text: INSTRUCTIONS },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(await describeHttpError(res, "Anthropic"));
  const json = await res.json();
  return {
    text: json.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "",
    usage: {
      inputTokens: json.usage?.input_tokens ?? 0,
      outputTokens: json.usage?.output_tokens ?? 0,
    },
  };
}

async function describeHttpError(res: Response, label: string): Promise<string> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message ?? "";
  } catch {
    /* some errors are not JSON */
  }
  if (res.status === 401) return `${label} rejected that key. Check you pasted all of it.`;
  if (res.status === 429)
    return `${label} says you are over your rate limit or out of credit. ${detail}`.trim();
  if (res.status >= 500) return `${label} had a server problem. Try again in a moment.`;
  return `${label} refused the request (${res.status}). ${detail}`.trim();
}

/* ------------------------------ validation -------------------------------- */

const STATUSES: FieldStatus[] = ["visible", "inferred", "missing", "unreadable"];

/**
 * Parse the model's JSON defensively.
 *
 * Everything here treats the response as hostile: a missing status becomes
 * "unreadable" rather than "visible", a value that will not parse as a number is
 * dropped, and confidence is clamped. A model that returns nonsense should
 * produce an empty extraction, never a confident wrong one.
 */
function readObservation<T>(raw: unknown, coerce: (v: unknown) => T | null): Observation<T> {
  if (!raw || typeof raw !== "object") return { status: "missing", confidence: 0 };
  const o = raw as Record<string, unknown>;

  const status = STATUSES.includes(o.status as FieldStatus)
    ? (o.status as FieldStatus)
    : "unreadable";

  const value = coerce(o.value);
  const confidence =
    typeof o.confidence === "number" && Number.isFinite(o.confidence)
      ? Math.min(1, Math.max(0, o.confidence))
      : 0;

  // A status of visible with nothing readable in it is not visible.
  const finalStatus: FieldStatus =
    (status === "visible" || status === "inferred") && value === null ? "unreadable" : status;

  const region =
    o.region && typeof o.region === "object"
      ? (() => {
          const r = o.region as Record<string, unknown>;
          const nums = ["x", "y", "w", "h"].map((k) => Number(r[k]));
          return nums.every((n) => Number.isFinite(n) && n >= -0.1 && n <= 1.1)
            ? { x: nums[0], y: nums[1], w: nums[2], h: nums[3] }
            : undefined;
        })()
      : undefined;

  return {
    status: finalStatus,
    ...(value !== null && (finalStatus === "visible" || finalStatus === "inferred")
      ? { value }
      : {}),
    confidence,
    ...(region ? { region } : {}),
    ...(typeof o.sawText === "string" && o.sawText ? { sawText: o.sawText.slice(0, 120) } : {}),
    ...(typeof o.note === "string" && o.note ? { note: o.note.slice(0, 300) } : {}),
  };
}

const asNumber = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  // Strip currency marks and separators, but only after checking there is a
  // digit to keep: stripping "not a number" leaves "", and Number("") is 0,
  // which would quietly turn a model's prose into a price of zero.
  const cleaned = v.replace(/[^0-9.+-]/g, "");
  if (!/\d/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};
const asText = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 24) : null;
const asDirection = (v: unknown): "long" | "short" | null => {
  const s = String(v ?? "").toLowerCase();
  if (["long", "buy", "bought"].includes(s)) return "long";
  if (["short", "sell", "sold"].includes(s)) return "short";
  return null;
};

export function parseExtraction(text: string): {
  trade: ExtractedTrade;
  issues: string[];
  platform?: string;
} {
  let json: Record<string, unknown>;
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    json = JSON.parse(start >= 0 ? text.slice(start, end + 1) : text);
  } catch {
    return {
      trade: blankTrade(),
      issues: ["The reply could not be read as a result. Nothing was extracted."],
    };
  }

  const raw = (json.trade ?? {}) as Record<string, unknown>;
  const trade: ExtractedTrade = {
    symbol: readObservation(raw.symbol, asText),
    direction: readObservation(raw.direction, asDirection),
    entry: readObservation(raw.entry, asNumber),
    stop: readObservation(raw.stop, asNumber),
    target: readObservation(raw.target, asNumber),
    exit: readObservation(raw.exit, asNumber),
    size: readObservation(raw.size, asNumber),
    pnl: readObservation(raw.pnl, asNumber),
  };

  const issues = Array.isArray(json.issues)
    ? json.issues.filter((i): i is string => typeof i === "string").slice(0, 8)
    : [];

  return {
    trade,
    issues,
    ...(typeof json.platform === "string" && json.platform ? { platform: json.platform } : {}),
  };
}

/* -------------------------------- the run --------------------------------- */

/** Cache by image, so re-reading the same screenshot never bills twice. */
const cache = new Map<string, Extraction>();

export function cacheKey(provider: ProviderId, image: PreparedImage): string {
  return `${provider}:${image.width}x${image.height}:${image.bytes}:${image.base64.slice(0, 64)}`;
}

export async function readTradeFromImage(
  provider: ProviderId,
  image: PreparedImage,
): Promise<Extraction> {
  if (!hasKey(provider)) {
    throw new Error("Add your API key first — it stays in this tab and is never stored.");
  }
  const info = PROVIDERS[provider];
  const key = cacheKey(provider, image);
  const hit = cache.get(key);
  if (hit) return hit;

  const { text, usage } =
    provider === "openai"
      ? await callOpenAI(apiKey as string, info.model, image)
      : await callAnthropic(apiKey as string, info.model, image);

  const parsed = parseExtraction(text);
  const dollars =
    (usage.inputTokens / 1_000_000) * info.price.input +
    (usage.outputTokens / 1_000_000) * info.price.output;

  const extraction: Extraction = {
    ...parsed,
    provider: info.label,
    model: info.model,
    usage: { ...usage, estimatedCents: Math.round(dollars * 10_000) / 100 },
  };
  cache.set(key, extraction);
  return extraction;
}
