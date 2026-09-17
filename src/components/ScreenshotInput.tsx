"use client";

import { useEffect, useId, useState } from "react";
import {
  ACCEPTED_TYPES,
  MAX_SHOT_BYTES,
  deleteShot,
  saveShot,
} from "@/lib/screenshots";

const MAX_MB = MAX_SHOT_BYTES / 1024 / 1024;

interface Preview {
  id: string;
  url: string;
  name: string;
  bytes: number;
}

function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)}KB`
    : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * Picks a chart image, keeps it in this browser, and hands back the key.
 *
 * The preview URL is made from the file the moment it is chosen rather than
 * read back out of storage, which keeps the whole component free of loading
 * states and gives us exactly one URL to revoke.
 */
export default function ScreenshotInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const inputId = useId();
  const noteId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  /* Revoking on every change to `preview` covers replacement and unmount in one
     line. Without it a long journalling session quietly holds every image it
     has ever shown. */
  useEffect(() => {
    if (!preview) return;
    const { url } = preview;
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  const shown = preview && preview.id === value ? preview : null;

  async function take(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const id = await saveShot(file);
      if (value) void deleteShot(value);
      setPreview({ id, url: URL.createObjectURL(file), name: file.name, bytes: file.size });
      onChange(id);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "That image could not be saved in this browser.",
      );
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    if (value) void deleteShot(value);
    setPreview(null);
    setError(null);
    onChange(null);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void take(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-xl border border-dashed p-4 transition-colors ${
          dragging ? "border-accent bg-accent-soft" : "border-border bg-surface-2"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            aria-describedby={noteId}
            className="peer sr-only"
            onChange={(e) => {
              void take(e.target.files?.[0]);
              /* Let the same file be chosen twice in a row. */
              e.target.value = "";
            }}
          />
          <label
            htmlFor={inputId}
            className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >
            {shown ? "Choose a different image" : "Choose a chart image"}
          </label>
          <p className="text-sm text-muted" aria-live="polite">
            {busy
              ? "Saving…"
              : `or drag one here. PNG, JPEG, WebP or GIF, up to ${MAX_MB}MB.`}
          </p>
        </div>

        {shown && (
          <div className="mt-3 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- a blob URL
                from this browser; there is no server to optimise it. */}
            <img
              src={shown.url}
              alt={`Your chart screenshot, ${shown.name}`}
              className="h-20 w-32 rounded-lg border border-border object-cover"
            />
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{shown.name}</p>
              <p className="text-muted">{sizeLabel(shown.bytes)}, saved in this browser.</p>
              <button
                type="button"
                onClick={remove}
                className="mt-1 rounded-md text-sm text-muted underline underline-offset-2 hover:text-fg"
              >
                Remove this image
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p
          role="status"
          className="mt-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn"
        >
          {error} You can log the trade without one — you will just miss the
          checklist item that asks for evidence.
        </p>
      )}

      <p id={noteId} className="mt-2 text-sm text-muted">
        The image stays in this browser and is never uploaded. There is no server
        behind this site to upload it to. That also means this site cannot read
        your chart: you supply the numbers, and it checks the discipline behind
        them. Clearing your browser data deletes it.
      </p>
    </div>
  );
}
