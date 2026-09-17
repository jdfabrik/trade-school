/**
 * Pulling prices out of a chart screenshot.
 *
 * The site cannot look at a chart and judge the trade — nothing here understands
 * what a good setup looks like. What it can do is read the numbers printed on
 * the picture, so the trader taps rather than types.
 *
 * These tests cover the part that decides which of the numbers on a screenshot
 * are plausibly prices, which is where this either feels useful or feels broken.
 */
import { describe, it, expect } from "vitest";

import { extractNumbers, priceCandidates, rolesFor } from "./ocr";

describe("reading numbers out of recognised text", () => {
  it("finds plain and decimal numbers", () => {
    expect(extractNumbers("101.25 99 103.50")).toEqual([101.25, 99, 103.5]);
  });

  it("understands thousands separators", () => {
    expect(extractNumbers("Account 25,000 price 1,234.50")).toEqual([25000, 1234.5]);
  });

  it("ignores the noise OCR produces around the edges", () => {
    expect(extractNumbers("|| ~ 100.50 ### 101.00 ::")).toEqual([100.5, 101]);
  });

  it("strips currency marks and percent signs from the value", () => {
    expect(extractNumbers("$48.20 and 2.5% and £99")).toEqual([48.2, 2.5, 99]);
  });

  it("returns nothing for text with no numbers", () => {
    expect(extractNumbers("no prices here at all")).toEqual([]);
    expect(extractNumbers("")).toEqual([]);
  });

  it("drops values too large or too small to be a price on a chart", () => {
    const out = extractNumbers("0.0000001 12345678901 55.25");
    expect(out).toContain(55.25);
    expect(out).not.toContain(12345678901);
  });
});

describe("deciding which numbers are prices", () => {
  /*
   * A chart's price axis is a tight cluster of similar values. Timestamps,
   * volumes and indicator settings are not, so the cluster is what to trust.
   */
  it("prefers the tight cluster over scattered unrelated numbers", () => {
    const found = [
      9, 14, 20, // indicator settings
      48.2, 48.6, 49.0, 49.4, 49.8, // the price axis
      1_250_000, // volume
    ];
    const prices = priceCandidates(found);
    expect(prices).toContain(48.2);
    expect(prices).toContain(49.8);
    expect(prices).not.toContain(1_250_000);
    expect(prices).not.toContain(9);
  });

  it("removes duplicates and sorts, so the chips read in order", () => {
    const prices = priceCandidates([101, 99, 100, 101, 99]);
    expect(prices).toEqual([99, 100, 101]);
  });

  it("keeps a small set of numbers even when there is no obvious cluster", () => {
    const prices = priceCandidates([25.5, 26.1]);
    expect(prices).toEqual([25.5, 26.1]);
  });

  it("copes with nothing recognised at all", () => {
    expect(priceCandidates([])).toEqual([]);
  });

  it("does not return an unusable wall of numbers", () => {
    const many = Array.from({ length: 300 }, (_, i) => 100 + i * 0.01);
    expect(priceCandidates(many).length).toBeLessThanOrEqual(24);
  });
});

describe("narrowing the choices once an entry is picked", () => {
  const prices = [95, 97, 99, 100, 103, 106];

  it("offers only lower prices as a stop on a long", () => {
    const { stops, targets } = rolesFor(prices, 100, "long");
    expect(stops.every((p) => p < 100)).toBe(true);
    expect(targets.every((p) => p > 100)).toBe(true);
  });

  it("flips that round for a short", () => {
    const { stops, targets } = rolesFor(prices, 100, "short");
    expect(stops.every((p) => p > 100)).toBe(true);
    expect(targets.every((p) => p < 100)).toBe(true);
  });

  it("offers everything when no entry has been chosen yet", () => {
    const { stops, targets } = rolesFor(prices, null, "long");
    expect(stops).toEqual(prices);
    expect(targets).toEqual(prices);
  });

  it("puts the nearest prices first, since a stop is usually close", () => {
    const { stops } = rolesFor(prices, 100, "long");
    expect(stops[0]).toBe(99);
  });
});
