/**
 * Local storage for trade screenshots.
 *
 * Images go into IndexedDB in this browser and nowhere else. There is no server
 * behind this site, so "your screenshots are not uploaded" is a fact about how
 * it is built rather than a promise someone is asking you to trust.
 *
 * The flip side, which the UI says plainly: clearing your browser data deletes
 * them, and they do not follow you to another device.
 */

const DB_NAME = "trade-school";
const DB_VERSION = 1;
const STORE = "screenshots";

export interface StoredShot {
  id: string;
  blob: Blob;
  type: string;
  bytes: number;
  savedAt: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser will not let the site store images."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("The image could not be saved in this browser."));
  });
}

/** The parts of a transaction and request this wiring actually touches. */
interface TransactionLike {
  oncomplete: null | (() => void);
  onabort: null | (() => void);
  onerror: null | (() => void);
  error?: unknown;
}
interface RequestLike<T> {
  onsuccess: null | (() => void);
  onerror: null | (() => void);
  result: T;
  error?: unknown;
}

function asError(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback);
}

/**
 * Settle a promise from an IndexedDB request and its transaction.
 *
 * A write must wait for `oncomplete`. `request.onsuccess` fires before the
 * transaction commits, so resolving there once reported a screenshot as saved
 * that a failed commit then discarded — leaving a trade pointing at an image
 * that did not exist. Running out of quota is the ordinary way that happens.
 *
 * Reads may settle as soon as the value is in hand, but still reject if the
 * transaction falls over first.
 *
 * Exported for tests: a real IndexedDB will not let you order these events.
 */
export function settleTransaction<T>(
  transaction: TransactionLike,
  request: RequestLike<T>,
  { waitForCommit }: { waitForCommit: boolean },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let value: T;
    let haveValue = false;
    let done = false;

    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      fn();
    };

    request.onsuccess = () => {
      value = request.result;
      haveValue = true;
      if (!waitForCommit) finish(() => resolve(value));
    };
    request.onerror = () =>
      finish(() => reject(asError(request.error, "That image could not be stored.")));

    transaction.oncomplete = () =>
      finish(() =>
        haveValue
          ? resolve(value)
          : reject(new Error("The store finished without returning anything.")),
      );
    transaction.onabort = () =>
      finish(() =>
        reject(
          asError(
            transaction.error,
            "Saving was cancelled by the browser, usually because storage is full.",
          ),
        ),
      );
    transaction.onerror = () =>
      finish(() => reject(asError(transaction.error, "That image could not be saved.")));
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then((db) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    return settleTransaction(
      transaction as unknown as TransactionLike,
      request as unknown as RequestLike<T>,
      { waitForCommit: mode === "readwrite" },
    ).finally(() => db.close());
  });
}

/** Largest image we will keep, so a stray 40MB PNG cannot fill the quota. */
export const MAX_SHOT_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function saveShot(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("That file is not an image. PNG, JPEG, WebP or GIF, please.");
  }
  if (file.size > MAX_SHOT_BYTES) {
    throw new Error(
      `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Keep it under ${MAX_SHOT_BYTES / 1024 / 1024}MB.`,
    );
  }
  const id = `shot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await tx("readwrite", (store) =>
    store.put({
      id,
      blob: file,
      type: file.type,
      bytes: file.size,
      savedAt: new Date().toISOString(),
    } satisfies StoredShot),
  );
  return id;
}

export async function getShot(id: string): Promise<StoredShot | undefined> {
  try {
    return await tx<StoredShot | undefined>("readonly", (store) => store.get(id));
  } catch {
    return undefined;
  }
}

/**
 * An object URL for display. The caller must revoke it when the image unmounts,
 * or a long journal session leaks a few megabytes per scroll.
 */
export async function shotUrl(id: string): Promise<string | null> {
  const shot = await getShot(id);
  if (!shot) return null;
  return URL.createObjectURL(shot.blob);
}

export async function deleteShot(id: string): Promise<void> {
  try {
    await tx("readwrite", (store) => store.delete(id));
  } catch {
    /* the trade is already gone; a stranded image is not worth an error */
  }
}

export async function totalBytes(): Promise<number> {
  try {
    const all = await tx<StoredShot[]>("readonly", (store) => store.getAll());
    return all.reduce((n, s) => n + (s.bytes ?? 0), 0);
  } catch {
    return 0;
  }
}
