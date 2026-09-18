/**
 * The grader.
 *
 * It scores what you CONTROLLED, and deliberately ignores what you did not.
 * Whether the trade made money is reported separately and never touches the
 * grade. This is the whole point of the site: a new trader who grades themselves
 * on profit learns to gamble, because gambling works often enough to feel like
 * skill. A trader who grades themselves on process learns to trade.
 *
 * Nothing here looks at your screenshot. The form can read the PRICES printed on
 * an image, but nothing understands the chart — whether the setup was real, or
 * where you actually entered. The trader confirms every number; this grades the
 * discipline behind them.
 */
import {
  riskPerUnit,
  riskPercent,
  plannedRR,
  profitLoss,
  positionSize,
  stopIsOnTheRightSide,
  targetIsOnTheRightSide,
  notional,
  type Trade,
} from "./trade";
import { DEFAULT_RULES, type TradingRules } from "./rules";

export type Letter = "A" | "B" | "C" | "D" | "F";

export interface Check {
  id: string;
  label: string;
  /** Relative importance. Stops matter more than screenshots. */
  weight: number;
  /** 0 to 1. Some checks are all-or-nothing, some scale. */
  score: number;
  passed: boolean;
  /** What the trade actually did. */
  detail: string;
  /** What to do differently. Shown only when the check fails. */
  advice: string;
}

export interface Grade {
  checks: Check[];
  failed: Check[];
  /** Weighted average of the checks, 0 to 1. */
  score: number;
  letter: Letter;
  /**
   * Set when a hard rule was broken and the letter was capped because of it.
   * Nine tidy habits must not carry a trade that broke the one rule that
   * decides whether the account survives.
   */
  cappedBy: string | null;
  /** Reported alongside the grade, never folded into it. */
  profitable: boolean | null;
  pnl: number;
  headline: string;
}

/**
 * The defaults the lessons argue for. A trader can change them on /settings/;
 * these are what applies when they have not.
 */
export const MAX_RISK_PCT = DEFAULT_RULES.maxRiskPct;
export const MIN_RR = DEFAULT_RULES.minRR;

/** Formats a threshold without a trailing ".0" on whole numbers. */
function threshold(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(2)}`;
}

export function letterFor(score: number): Letter {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

export function gradeTrade(
  trade: Trade,
  rules: TradingRules = DEFAULT_RULES,
): Grade {
  const { maxRiskPct, minRR } = rules;
  const checks: Check[] = [];

  const perUnit = riskPerUnit(trade);
  const hasStop = Number.isFinite(perUnit);
  const stopWrongSide = trade.stop !== null && !stopIsOnTheRightSide(trade);
  // Absent on trades logged before the question existed; absence is not an
  // admission, so those are not marked down retroactively.
  const plannedBefore = trade.stopPlannedBeforeEntry !== false;
  const riskPct = riskPercent(trade);
  const rr = plannedRR(trade);
  const pnl = profitLoss(trade);

  /* 1. A stop, decided before entry. Everything else depends on this. */
  checks.push({
    id: "stop-set",
    label: "Stop loss set before entry",
    weight: 3,
    score: hasStop && plannedBefore ? 1 : 0,
    passed: hasStop && plannedBefore,
    detail: hasStop && !plannedBefore
      ? `The stop was added after entering, not decided beforehand. Worked out once the trade is on, it is a reaction to where price already went.`
      : hasStop
      ? `Stop at ${money(trade.stop as number)}, ${money(perUnit)} per share from entry.`
      : stopWrongSide
        ? `The stop at ${money(trade.stop as number)} sits ${trade.direction === "long" ? "above" : "below"} the entry at ${money(trade.entry)}. On a ${trade.direction} that is the wrong side of the entry: it would close the trade as it moved in your favour, and it defines no risk at all.`
        : "No stop recorded for this trade.",
    advice:
      "Decide where you are wrong before you enter, and place the order the moment you are filled. Without a stop you have no defined risk, no position size and no way to measure the trade afterwards.",
  });

  /* 2. Risk no more than 1% of the account. */
  let riskScore = 0;
  let riskDetail = "No stop, so the risk on this trade was undefined.";
  if (hasStop && Number.isFinite(riskPct)) {
    // full marks at or under the trader's limit, then a straight line to zero
    // by four times it, so overshooting is penalised in proportion
    const zeroAt = maxRiskPct * 4;
    riskScore =
      riskPct <= maxRiskPct
        ? 1
        : clamp01((zeroAt - riskPct) / (zeroAt - maxRiskPct));
    riskDetail = `Risked ${money(perUnit * trade.size)}, which is ${riskPct.toFixed(2)}% of a ${money(trade.accountSize)} account.`;
  }
  checks.push({
    id: "risk-size",
    label: `Risk kept to ${threshold(maxRiskPct)}% of the account`,
    weight: 3,
    score: riskScore,
    passed: hasStop && riskPct <= maxRiskPct + 1e-9,
    detail: riskDetail,
    advice: `Cap the loss on any one trade at ${threshold(maxRiskPct)}% of your account — the limit you set. At 1% a run of ten losses costs about a tenth of the account, which is survivable. At 5% the same run is close to fatal.`,
  });

  /* 3. The size must actually follow from the stop. */
  const intended = hasStop
    ? positionSize(trade.accountSize, maxRiskPct, trade.entry, trade.stop as number)
    : NaN;
  const sizeRatio = Number.isFinite(intended) ? trade.size / intended : NaN;
  const sizeOk = Number.isFinite(sizeRatio) && sizeRatio <= 1.25;
  checks.push({
    id: "size-matches-stop",
    label: "Position size follows from the stop",
    weight: 2,
    score: Number.isFinite(sizeRatio) ? clamp01(1 - Math.max(0, sizeRatio - 1.25) / 2) : 0,
    passed: sizeOk,
    detail: Number.isFinite(intended)
      ? `Took ${trade.size.toLocaleString("en-US")} units. Risking ${MAX_RISK_PCT}% with this stop allows ${Math.floor(intended).toLocaleString("en-US")}.`
      : "Cannot check the size without a stop.",
    advice:
      "Work out size from the stop, not from a habit or a round number: (account × 1%) ÷ (entry − stop). A wider stop means a smaller position, not a bigger loss.",
  });

  /* 4. A target worth the risk. */
  let rrScore = 0;
  if (Number.isFinite(rr)) {
    rrScore = rr >= minRR ? 1 : clamp01(rr / minRR);
  }
  const targetWrongSide = trade.target !== null && !targetIsOnTheRightSide(trade);
  checks.push({
    id: "reward-risk",
    label: `Planned reward at least ${threshold(minRR)}:1`,
    weight: 2,
    score: rrScore,
    passed: Number.isFinite(rr) && rr >= minRR - 1e-9,
    detail: Number.isFinite(rr)
      ? `Target was ${rr.toFixed(2)}:1 against the stop.`
      : targetWrongSide
        ? `Target at ${trade.target} sits ${trade.direction === "long" ? "below" : "above"} the entry at ${trade.entry}. On a ${trade.direction} that is not a profit — hitting it would mean a loss.`
        : "No target recorded, so the trade had no planned reward.",
    advice: `Know what you stand to make before you risk anything. At your ${threshold(minRR)}:1 threshold you need to be right about ${Math.round((1 / (1 + minRR)) * 100)}% of the time to break even. The lower the reward, the more often you have to be right.`,
  });

  /* 5. A named setup — you knew what you were trading. */
  const setupNamed = trade.setup.trim().length >= 3;
  checks.push({
    id: "setup-named",
    label: "Setup named before entry",
    weight: 2,
    score: setupNamed ? 1 : 0,
    passed: setupNamed,
    detail: setupNamed
      ? `Traded as: ${trade.setup.trim()}.`
      : "No setup recorded for this trade.",
    advice:
      "Name the pattern you are trading before you click. If you cannot name it, you are not trading a setup — you are reacting to a chart, and reactions cannot be reviewed or improved.",
  });

  /* 6. A reason, written down. Six words or more, or it is not a reason. */
  const words = trade.planNote.trim().split(/\s+/).filter(Boolean).length;
  const reasoned = words >= 6;
  checks.push({
    id: "reason-written",
    label: "Reason written down before entry",
    weight: 2,
    score: reasoned ? 1 : clamp01(words / 6),
    passed: reasoned,
    detail: reasoned
      ? `${words} words recorded.`
      : words === 0
        ? "Nothing written down."
        : `Only ${words} word${words === 1 ? "" : "s"} written down.`,
    advice:
      "Write a sentence explaining why this trade, why now, and what would prove you wrong. It takes fifteen seconds and it is the only thing that makes a losing month reviewable rather than just painful.",
  });

  /* 7. The stop stayed where you put it. */
  checks.push({
    id: "stop-held",
    label: "Stop not moved against the position",
    weight: 2,
    score: trade.stopMovedAgainst ? 0 : 1,
    passed: !trade.stopMovedAgainst,
    detail: trade.stopMovedAgainst
      ? "Stop was widened after the trade moved against you."
      : "Stop was left where it was placed.",
    advice:
      "Moving a stop away from price converts a planned small loss into an unplanned large one. It is the single most common way a new trader turns a bad day into a bad quarter. Move stops toward profit only.",
  });

  /* 8. Composure — overtrading and revenge trading. */
  const revenge =
    trade.minutesSincePriorLoss !== null && trade.minutesSincePriorLoss < 5;
  const overtrading = trade.tradesToday > 8;
  const composed = !revenge && !overtrading;
  checks.push({
    id: "composure",
    label: "Not revenge trading or overtrading",
    weight: 2,
    score: composed ? 1 : revenge && overtrading ? 0 : 0.4,
    passed: composed,
    detail: [
      revenge
        ? `Taken ${trade.minutesSincePriorLoss} minute${trade.minutesSincePriorLoss === 1 ? "" : "s"} after a loss.`
        : null,
      overtrading ? `Trade number ${trade.tradesToday} of the day.` : null,
      composed ? `Trade ${trade.tradesToday} of the day, taken calmly.` : null,
    ]
      .filter(Boolean)
      .join(" "),
    advice:
      "After a loss, stand up and let five minutes pass before you look for the next trade. Set a hard cap on the number of trades before the session starts, so boredom cannot add to it later.",
  });

  /* 9. A position the account could actually buy. */
  const positionValue = notional(trade);
  const affordable = !Number.isFinite(positionValue) || positionValue <= trade.accountSize * 1.01;
  checks.push({
    id: "affordable",
    label: "Position the account could actually buy",
    weight: 2,
    score: affordable ? 1 : 0,
    passed: affordable,
    detail: affordable
      ? `Position worth ${money(positionValue)} against a ${money(trade.accountSize)} account.`
      : `Position worth ${money(positionValue)} on a ${money(trade.accountSize)} account. No cash account holds that, and the risk rule alone will recommend it whenever the stop is very tight.`,
    advice:
      "A very tight stop makes the risk formula ask for a very large position. Check the position against the cash you actually have as well as against the risk: if the two disagree, the stop is too tight to size the trade properly, not an invitation to buy more than you can pay for.",
  });

  /* 10. Evidence — the screenshot. Asked for, but low weight. */
  const hasShot = Boolean(trade.screenshotId);
  checks.push({
    id: "evidence",
    label: "Screenshot attached",
    weight: 1,
    score: hasShot ? 1 : 0,
    passed: hasShot,
    detail: hasShot ? "Chart image saved with this trade." : "No screenshot attached.",
    advice:
      "Attach the chart as you saw it. In a month you will not remember what the tape looked like, and a journal of numbers without pictures is much harder to learn from.",
  });

  const totalWeight = checks.reduce((n, c) => n + c.weight, 0);
  const score = clamp01(
    checks.reduce((n, c) => n + c.weight * clamp01(c.score), 0) / totalWeight,
  );
  const failed = checks.filter((c) => !c.passed);
  const profitable = Number.isFinite(pnl) ? pnl > 0 : null;

  /*
   * Hard rules. Everything else is a deduction; these are conditions. Averaging
   * them away would let a trade with no stop, or one risking several times the
   * limit, still come back an A because the setup was named and a screenshot
   * was attached — which is exactly the reasoning this site exists to argue
   * against.
   */
  const ceilings: { when: boolean; cap: Letter; reason: string }[] = [
    {
      when: !hasStop,
      cap: "D",
      reason: "no usable stop, so the trade had no defined risk",
    },
    {
      when: hasStop && Number.isFinite(riskPct) && riskPct > maxRiskPct * 2,
      cap: "D",
      reason: `risk of ${riskPct.toFixed(2)}% is more than double the ${threshold(maxRiskPct)}% limit you set`,
    },
    {
      when: hasStop && Number.isFinite(riskPct) && riskPct > maxRiskPct + 1e-9,
      cap: "B",
      reason: `risk of ${riskPct.toFixed(2)}% is over the ${threshold(maxRiskPct)}% limit you set`,
    },
    {
      when: targetWrongSide,
      cap: "C",
      reason: "the target was on the wrong side of the entry",
    },
    {
      when: !affordable,
      cap: "D",
      reason: "the position was worth more than the whole account",
    },
    {
      when: hasStop && !plannedBefore,
      cap: "C",
      reason:
        "the stop was worked out after entering rather than decided beforehand",
    },
  ];

  const ORDER: Letter[] = ["A", "B", "C", "D", "F"];
  const earned = letterFor(score);
  let letter = earned;
  let cappedBy: string | null = null;

  // Apply the strongest applicable ceiling, and report THAT one — reporting
  // whichever happened to come last in the list would name a lesser reason for
  // a harsher grade.
  for (const c of ceilings) {
    if (!c.when) continue;
    if (ORDER.indexOf(c.cap) > ORDER.indexOf(letter)) {
      letter = c.cap;
      cappedBy = c.reason;
    }
  }
  if (letter === earned) cappedBy = null;

  return {
    checks,
    failed,
    score,
    letter,
    cappedBy,
    profitable,
    pnl,
    // built from the FINAL letter, after any cap. It used to be baked earlier,
    // so a D could render under "Nothing to fix" in the largest type on the card.
    // Built from the FINAL letter and the real failure count. It used to be
    // baked from a pre-penalty letter and ignored the checklist, so a card could
    // read "Nothing to fix" in its largest type above four failed checks.
    headline: headlineFor(letter, profitable, failed.length),
  };
}

function headlineFor(
  letter: Letter,
  profitable: boolean | null,
  failedCount: number,
): string {
  // "Nothing to fix" is only ever true when nothing failed. Saying it above a
  // list of failed checks teaches the opposite of what the list is for.
  const clean = failedCount === 0;

  if (profitable === null) {
    return letter === "A" || letter === "B"
      ? clean
        ? "Well set up. Now let the plan play out."
        : "Mostly sound, but fix the items below before the trade closes if you still can."
      : "Fix this before the trade closes, if you still can.";
  }
  const good = letter === "A" || letter === "B";
  if (good && profitable)
    return clean
      ? "Good trade, good result. This is the one to repeat."
      : "It paid, but not everything was done properly. The items below are what to tighten.";
  if (good && !profitable)
    return clean
      ? "Good trade, bad result. Nothing to fix — this is what a normal loss looks like."
      : "A normal loss, but not a clean one. The loss is fine; the items below are not.";
  if (!good && profitable)
    return "Bad trade, good result. This is the dangerous one: it pays you for a habit that will not keep paying.";
  return "Bad trade, bad result. The loss is the cheap part; the habit is what costs you.";
}

/** Average grade score across many trades, for the progress page. */
export function averageScore(grades: Grade[]): number {
  if (grades.length === 0) return NaN;
  return grades.reduce((n, g) => n + g.score, 0) / grades.length;
}

/** Which rubric items you fail most often — the thing to work on next. */
export function weakestHabits(
  grades: Grade[],
  limit = 3,
): { id: string; label: string; misses: number; advice: string }[] {
  const tally = new Map<string, { label: string; misses: number; advice: string }>();
  for (const g of grades) {
    for (const c of g.failed) {
      const prior = tally.get(c.id);
      if (prior) prior.misses += 1;
      else tally.set(c.id, { label: c.label, misses: 1, advice: c.advice });
    }
  }
  return [...tally.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit);
}
