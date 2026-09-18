/**
 * "Saved" has to mean saved.
 *
 * Found by an independent review: the screenshot store resolved its promise on
 * `request.onsuccess`, which fires BEFORE the transaction commits, and it had no
 * abort or error handler on the transaction itself. So a write that succeeded
 * and then failed at commit — running out of quota is the ordinary way that
 * happens — reported success, and the trade ended up pointing at an image that
 * was never stored.
 *
 * These drive the promise wiring with a fake transaction so the ordering can be
 * controlled precisely, which a real IndexedDB will not let you do.
 */
import { describe, it, expect } from "vitest";

import { settleTransaction } from "./screenshots";

/** The bits of IDB the wiring touches, with the callbacks under our control. */
function fakeTransaction() {
  const t = {
    oncomplete: null as null | (() => void),
    onabort: null as null | (() => void),
    onerror: null as null | (() => void),
    error: null as Error | null,
  };
  const r = {
    onsuccess: null as null | (() => void),
    onerror: null as null | (() => void),
    result: "the-value",
    error: null as Error | null,
  };
  return { t, r };
}

describe("a write is only settled once the transaction commits", () => {
  it("does not resolve merely because the request succeeded", async () => {
    const { t, r } = fakeTransaction();
    let settled = false;
    const p = settleTransaction(t, r, { waitForCommit: true }).then(() => {
      settled = true;
    });

    r.onsuccess?.();
    await Promise.resolve();
    expect(settled, "resolved before the transaction committed").toBe(false);

    t.oncomplete?.();
    await p;
    expect(settled).toBe(true);
  });

  it("rejects when the transaction aborts after the request succeeded", async () => {
    const { t, r } = fakeTransaction();
    const p = settleTransaction(t, r, { waitForCommit: true });

    r.onsuccess?.();
    t.error = new Error("QuotaExceededError");
    t.onabort?.();

    await expect(p).rejects.toThrow(/quota|abort|could not be saved/i);
  });

  it("rejects when the transaction errors", async () => {
    const { t, r } = fakeTransaction();
    const p = settleTransaction(t, r, { waitForCommit: true });
    r.onsuccess?.();
    t.onerror?.();
    await expect(p).rejects.toBeTruthy();
  });

  it("rejects when the request itself fails", async () => {
    const { t, r } = fakeTransaction();
    const p = settleTransaction(t, r, { waitForCommit: true });
    r.error = new Error("nope");
    r.onerror?.();
    await expect(p).rejects.toThrow(/nope/);
  });

  it("returns the request's result once committed", async () => {
    const { t, r } = fakeTransaction();
    const p = settleTransaction(t, r, { waitForCommit: true });
    r.onsuccess?.();
    t.oncomplete?.();
    await expect(p).resolves.toBe("the-value");
  });
});

describe("a read does not need to wait for the commit", () => {
  it("resolves as soon as the value is in hand", async () => {
    const { t, r } = fakeTransaction();
    const p = settleTransaction(t, r, { waitForCommit: false });
    r.onsuccess?.();
    await expect(p).resolves.toBe("the-value");
  });

  it("still rejects if the read transaction aborts first", async () => {
    const { t, r } = fakeTransaction();
    const p = settleTransaction(t, r, { waitForCommit: false });
    t.onabort?.();
    await expect(p).rejects.toBeTruthy();
  });
});
