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

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
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
