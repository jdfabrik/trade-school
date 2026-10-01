"use client";

import { useState } from "react";
import {
  PROVIDERS,
  prepareImage,
  estimateCents,
  readTradeFromImage,
  setKey,
  clearKey,
  hasKey,
  type PreparedImage,
  type ProviderId,
} from "@/lib/vision";
import {
  EXTRACTED_FIELDS,
  FIELD_LABELS,
  anyValue,
  contradictions,
  describeStatus,
  evidenceSummary,
  visibleUnknown,
  type Extraction,
  type ExtractedField,
} from "@/lib/extraction";

/**
 * Reading a trade off a screenshot with the trader's own API key.
 *
 * Three things this screen must never do, in order of how badly they would hurt:
 * hide that the image is leaving the device; present a guessed value as a read
 * one; or put a number into the form without the trader looking at it. Every
 * layout decision below is downstream of those.
 */
export default function ScreenshotReader({
  blob,
  onUse,
}: {
  blob: Blob | null;
  /** Called with only the fields the trader ticked. */
  onUse: (values: Partial<Record<ExtractedField, string>>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [keyText, setKeyText] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extraction | null>(null);
  const [chosen, setChosen] = useState<Set<ExtractedField>>(new Set());

  const info = PROVIDERS[provider];
  const cents = image ? estimateCents(info, image) : null;

  if (!blob) return null;

  async function ready() {
    if (image) return image;
    const prepared = await prepareImage(blob!);
    setImage(prepared);
    return prepared;
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const prepared = await ready();
      const extraction = await readTradeFromImage(provider, prepared);
      setResult(extraction);
      // Pre-tick only what was actually read off the image. An inferred value
      // has to be chosen deliberately.
      setChosen(
        new Set(EXTRACTED_FIELDS.filter((f) => visibleUnknown(extraction.trade[f]) !== null)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  function applyChosen() {
    if (!result) return;
    const out: Partial<Record<ExtractedField, string>> = {};
    for (const f of chosen) {
      const got = anyValue(result.trade[f]);
      if (got) out[f] = String(got.value);
    }
    onUse(out);
  }

  const conflicts = result ? contradictions(result.trade) : [];
  const evidence = result ? evidenceSummary(result.trade) : null;

  /**
   * A zoomed crop of the part of the screenshot a value came from.
   *
   * WHY THIS IS HERE: measured against the fixture screenshots, the one thing
   * that got through was a soft image where the model read "48.82" off a tag
   * that said 48.60 — and reported it as read, at 0.98 confidence, quoting text
   * it had misread. No amount of parsing catches that; the reply is internally
   * consistent. The only thing that catches it is a person looking. So put the
   * pixels next to the number and make looking take a second rather than
   * requiring them to go and find it on their own chart.
   *
   * The region is the model's own claim about where it looked, so it is
   * labelled as such and never presented as proof.
   */
  function Crop({ region }: { region: NonNullable<Extraction["trade"]["entry"]["region"]> }) {
    if (!image) return null;
    const BOX_W = 240;
    const BOX_H = 96;

    // Centre the region in the box and zoom so it spans the width. Zooming out
    // would defeat the point — the trader has to be able to read the digits —
    // so the scale never goes below 1:1, and never so far in that a tiny or
    // badly-reported region fills the box with two pixels.
    const cx = region.x + region.w / 2;
    const cy = region.y + region.h / 2;
    const wanted = BOX_W / Math.max(region.w * image.width, 1);
    const scale = Math.min(4, Math.max(1, wanted));

    return (
      <span
        aria-hidden="true"
        className="mt-1 block overflow-hidden rounded border border-border bg-surface"
        style={{
          width: BOX_W,
          height: BOX_H,
          backgroundImage: `url(${image.dataUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${image.width * scale}px ${image.height * scale}px`,
          backgroundPosition: `${BOX_W / 2 - cx * image.width * scale}px ${
            BOX_H / 2 - cy * image.height * scale
          }px`,
        }}
      />
    );
  }

  /* ----------------------------- closed state ---------------------------- */

  if (!open) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-surface-2 p-4">
        <h3 className="font-display text-sm font-semibold">
          Have it read the trade for you
        </h3>
        <p className="mt-1 text-sm text-muted">
          An AI model can read the prices, ticker and direction off your chart,
          so you tap them in rather than typing. Doing that means{" "}
          <strong className="text-fg">sending your screenshot</strong> to the
          provider you choose, using your own account. It is per-image and never
          automatic.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
        >
          Set this up
        </button>
      </div>
    );
  }

  /* ------------------------------ open state ----------------------------- */

  return (
    <div className="mt-3 rounded-xl border border-accent/40 bg-surface-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm font-semibold">Read the trade with AI</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted underline underline-offset-4 hover:text-fg"
        >
          Hide
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-xs text-warn">
        Your screenshot is sent to {info.label} using your own API key, and their
        charges and data-handling terms apply. Trade School has no server in the
        middle — the request goes straight from this page to them. Everything
        else on this site still stays on your device.
      </div>

      {/* provider */}
      <div role="radiogroup" aria-label="Provider" className="mt-3 flex gap-2">
        {Object.values(PROVIDERS).map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={provider === p.id}
            onClick={() => {
              setProvider(p.id);
              setKeySet(hasKey(p.id));
              setResult(null);
            }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
              provider === p.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-border hover:border-accent"
            }`}
          >
            {p.label}
            <span className="mt-0.5 block font-mono text-[10px] text-muted">{p.model}</span>
          </button>
        ))}
      </div>

      {/* key */}
      <div className="mt-3">
        <label className="block text-sm">
          <span className="text-muted">Your {info.label} API key</span>
          <input
            type="password"
            value={keyText}
            autoComplete="off"
            spellCheck={false}
            placeholder={provider === "openai" ? "sk-…" : "sk-ant-…"}
            onChange={(e) => {
              setKeyText(e.target.value);
              setKey(provider, e.target.value);
              setKeySet(hasKey(provider));
            }}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
          />
        </label>
        <p className="mt-1 text-xs text-muted">
          Kept in this tab only and never saved — close the tab and it is gone.
          Browser storage can be read by anything that ends up on the page, and
          this key can spend your money.{" "}
          <a
            href={info.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Get a key
          </a>
          .
        </p>
        {keyText && !info.keyLooksLike.test(keyText.trim()) && (
          <p className="mt-1 text-xs text-warn">
            That does not look like a {info.label} key — check you pasted all of it.
          </p>
        )}
      </div>

      {/* run */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!keySet || busy}
          onClick={run}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Reading…" : result ? "Read it again" : "Read my screenshot"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearKey();
            setKeyText("");
            setKeySet(false);
          }}
          className="text-xs text-muted underline underline-offset-4 hover:text-fg"
        >
          Forget my key
        </button>
        {cents !== null && (
          <span className="text-xs text-muted">
            About {cents < 1 ? "under a penny" : `${cents.toFixed(1)}¢`} per read.
            The image is shrunk to {image?.width}×{image?.height} first, which is
            most of why it is that cheap.
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-sell/40 bg-sell/10 px-3 py-2 text-sm text-sell">
          {error}
        </p>
      )}

      {/* ---------------------------- the result --------------------------- */}

      {result && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-display text-sm font-semibold">
              Check what it read before you use it
            </h4>
            {evidence && (
              <span className="font-mono text-[11px] text-muted">
                {evidence.visible} read · {evidence.inferred} guessed ·{" "}
                {evidence.missing} not found
              </span>
            )}
          </div>

          {result.platform && (
            <p className="mt-1 text-xs text-muted">
              It thinks this is {result.platform}.
            </p>
          )}

          {conflicts.map((c, i) => (
            <p
              key={i}
              className="mt-2 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-xs text-warn"
            >
              {c}
            </p>
          ))}

          {result.issues.map((issue, i) => (
            <p key={i} className="mt-2 text-xs text-muted">
              {issue}
            </p>
          ))}

          <ul className="mt-3 space-y-1.5">
            {EXTRACTED_FIELDS.map((f) => {
              const o = result.trade[f];
              const got = anyValue(o);
              const usable = got !== null;
              const isVisible = o.status === "visible";
              return (
                <li
                  key={f}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                    usable ? "border-border" : "border-border opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`use-${f}`}
                    disabled={!usable}
                    checked={chosen.has(f)}
                    onChange={(e) => {
                      const next = new Set(chosen);
                      if (e.target.checked) next.add(f);
                      else next.delete(f);
                      setChosen(next);
                    }}
                    className="mt-1"
                  />
                  <label htmlFor={`use-${f}`} className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{FIELD_LABELS[f]}</span>
                      <span className="tabular font-mono">
                        {usable ? String(got!.value) : "—"}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wide ${
                          isVisible ? "text-buy" : "text-warn"
                        }`}
                      >
                        {describeStatus(o.status)}
                      </span>
                    </span>
                    {o.sawText && (
                      <span className="mt-0.5 block text-xs text-muted">
                        read from “{o.sawText}”
                      </span>
                    )}
                    {o.note && (
                      <span className="mt-0.5 block text-xs text-muted">{o.note}</span>
                    )}
                    {o.region && usable && (
                      <>
                        <Crop region={o.region} />
                        <span className="mt-0.5 block text-[11px] text-muted">
                          Where it says it read this. If the number here does not match,
                          or this is a blank bit of your chart, do not tick it.
                        </span>
                      </>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={chosen.size === 0}
              onClick={applyChosen}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-40"
            >
              Use the {chosen.size} ticked {chosen.size === 1 ? "value" : "values"}
            </button>
            <span className="text-xs text-muted">
              Nothing is filled in until you press this. Anything marked
              &ldquo;worked out&rdquo; was not read off the picture — check it
              against your chart before you tick it.
            </span>
          </div>

          {result.usage && (
            <p className="mt-2 font-mono text-[11px] text-muted">
              {result.model} · {result.usage.inputTokens} in /{" "}
              {result.usage.outputTokens} out · about{" "}
              {result.usage.estimatedCents.toFixed(2)}¢
            </p>
          )}
        </div>
      )}
    </div>
  );
}
