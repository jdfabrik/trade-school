/*
 * Score what a vision model read off the fixture screenshots.
 *
 * The question this answers is NOT "how many fields did it get". It is "did it
 * ever report something that was not there". A missed field costs the trader a
 * few seconds of typing. An invented one puts a fabricated number into a grade,
 * which is the single worst thing this site can do.
 *
 * So the classes below are deliberately asymmetric: a missed value is a safe
 * failure and an invented value is the only real one.
 *
 * Every extraction goes through the REAL parseExtraction, so this also measures
 * how much the defensive parser catches on its own.
 *
 * Run: npx vite-node test-fixtures/score-extractions.mts
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseExtraction } from "../src/lib/vision";
import { EXTRACTED_FIELDS, contradictions, type ExtractedField } from "../src/lib/extraction";

const here = dirname(fileURLToPath(import.meta.url));
const gt = JSON.parse(readFileSync(join(here, "ground-truth.json"), "utf8"));

type Verdict =
  | "read"              // printed on the image, status visible, value right
  | "inferred-ok"       // worked out rather than read, but the value is right
  | "honest-gap"        // on the image, reported missing. Safe: costs typing
  | "correctly-absent"  // not on the image, reported missing. Ideal
  | "GUESSED"           // not on the image, claimed as inferred
  | "INVENTED"          // not on the image, claimed as READ
  | "WRONG";            // on the image, claimed as READ, value wrong

/** Equal at the precision the image actually prints. 1.084 is not 1.0842. */
function samePrice(got: number, truth: number): boolean {
  const dp = (String(truth).split(".")[1] ?? "").length;
  return got.toFixed(dp) === truth.toFixed(dp);
}

function judge(
  field: ExtractedField,
  status: string,
  value: unknown,
  truth: unknown,
): Verdict {
  const claimed = (status === "visible" || status === "inferred") && value !== undefined;

  if (truth === null || truth === undefined) {
    if (!claimed) return "correctly-absent";
    // Claiming to have READ something that is not there is the serious failure.
    // Claiming to have worked it out is weaker: the screen labels it, and the
    // trader has to tick it deliberately.
    return status === "visible" ? "INVENTED" : "GUESSED";
  }
  if (!claimed) return "honest-gap";

  const ok =
    typeof truth === "number"
      ? typeof value === "number" && samePrice(value, truth)
      : String(value).toLowerCase() === String(truth).toLowerCase();

  if (!ok) return "WRONG";
  return status === "visible" ? "read" : "inferred-ok";
}

const tally: Record<Verdict, number> = {
  read: 0, "inferred-ok": 0, "honest-gap": 0, "correctly-absent": 0,
  GUESSED: 0, INVENTED: 0, WRONG: 0,
};
let demoted = 0;
const files = new Set(readdirSync(join(here, "extractions")).map((f) => f.replace(/\.json$/, "")));

for (const c of gt.cases) {
  if (!files.has(c.name)) {
    console.log(`\n${c.name}\n  (no extraction file — skipped)`);
    continue;
  }
  const rawText = readFileSync(join(here, "extractions", `${c.name}.json`), "utf8");
  const rawJson = JSON.parse(rawText);
  const { trade, issues, platform } = parseExtraction(rawText);

  console.log(`\n${"─".repeat(72)}\n${c.name}${c.degraded ? "  (degraded input)" : ""}`);
  console.log(`  ${c.what}`);
  if (platform) console.log(`  model called it: ${platform}`);

  const rows: string[] = [];
  for (const f of EXTRACTED_FIELDS) {
    const o = trade[f];
    const truth = c.truth[f];
    const v = judge(f, o.status, o.value, truth);

    // did the defensive parser downgrade what the model claimed?
    const claimedStatus = rawJson?.trade?.[f]?.status;
    if (claimedStatus && claimedStatus !== o.status) demoted += 1;

    // a degraded image may honestly be unreadable; that is not a failure
    const counted: Verdict = c.degraded && v === "honest-gap" ? "correctly-absent" : v;
    tally[counted] += 1;

    const shown = o.value === undefined ? "—" : String(o.value);
    const want = truth === null || truth === undefined ? "—" : String(truth);
    const mark = v === "INVENTED" || v === "WRONG" ? "  <<< FABRICATION" : v === "GUESSED" ? "  <<" : "";
    rows.push(
      `    ${f.padEnd(10)} got ${shown.padEnd(10)} want ${want.padEnd(10)} ${o.status.padEnd(10)} ${v}${mark}`,
    );
  }
  console.log(rows.join("\n"));

  const conflicts = contradictions(trade);
  if (conflicts.length) console.log(`  contradictions flagged: ${conflicts.length}`);
  if (issues.length) console.log(`  issues it raised: ${issues.map((i) => `"${i}"`).join("; ")}`);

  if (c.forbidden) {
    const leaked = EXTRACTED_FIELDS
      .map((f) => trade[f].value)
      .filter((v): v is number => typeof v === "number")
      .filter((v) => c.forbidden.some((bad: number) => Math.abs(v - bad) < 1e-9));
    console.log(
      leaked.length
        ? `  LEAKED non-prices: ${leaked.join(", ")}  <<<`
        : `  decoys avoided: none of ${c.forbidden.length} non-price numbers were reported`,
    );
  }
}

const total = Object.values(tally).reduce((a, b) => a + b, 0);
const fabrications = tally.INVENTED + tally.WRONG;
console.log(`\n${"═".repeat(72)}`);
console.log(`fields scored            ${total}`);
console.log(`  read correctly         ${tally.read}`);
console.log(`  inferred, value right  ${tally["inferred-ok"]}`);
console.log(`  correctly left absent  ${tally["correctly-absent"]}`);
console.log(`  honest gap (safe miss) ${tally["honest-gap"]}`);
console.log(`  guessed, not on image  ${tally.GUESSED}   (labelled "worked out", never pre-ticked)`);
console.log(`  INVENTED (claimed read) ${tally.INVENTED}`);
console.log(`  WRONG VALUE            ${tally.WRONG}`);
console.log(`\nparser demoted ${demoted} claim(s) the model made.`);
console.log(
  fabrications === 0
    ? `\nNo fabrications. Every number that reached the form was on the image.`
    : `\n${fabrications} FABRICATION(S). This is the failure that matters.`,
);
