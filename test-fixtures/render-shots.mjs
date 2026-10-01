/*
 * Write the synthetic platform screenshots to PNG files.
 *
 * WHY: the fixtures used to exist only as canvas draws inside a browser-pasted
 * harness, so nothing outside that one session could be tested against them.
 * As files they can be fed to a vision model, checked into the repo, and scored
 * against a fixed ground truth.
 *
 * Uses the playwright-core already on this machine; nothing is added to this
 * project's dependencies.
 *
 * Run: node test-fixtures/render-shots.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire("/Users/jamesfabrikant/drberwald/package.json");
const { chromium } = require("playwright-core");

const W = 900;
const H = 480;

const harness = readFileSync(join(here, "reader-harness.js"), "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 } });
await page.setContent("<!doctype html><meta charset=utf-8><body style=margin:0>");
await page.addScriptTag({ content: harness });

const shots = await page.evaluate(
  ({ W, H }) =>
    ALL.map((c) => {
      let canvas;
      if (c.render) {
        canvas = c.render(W, H);
      } else {
        canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        c.draw(canvas.getContext("2d"), W, H);
      }
      const url = canvas.toDataURL("image/png");
      return { name: c.name, b64: url.slice(url.indexOf(",") + 1) };
    }),
  { W, H },
);

for (const { name, b64 } of shots) {
  const bytes = Buffer.from(b64, "base64");
  writeFileSync(join(here, "shots", `${name}.png`), bytes);
  console.log(`${name}.png  ${(bytes.length / 1024).toFixed(0)} KB`);
}

await browser.close();
console.log(`\n${shots.length} screenshots written to test-fixtures/shots/`);
