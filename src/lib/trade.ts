/**
 * The arithmetic of a single trade.
 *
 * Everything here is built around one idea: measure a trade in R, not in
 * dollars. One R is the amount you decided to risk before you entered. A trade
 * that makes three times what you risked is "+3R" whether your account is
 * $2,000 or $2,000,000, which is what makes trades comparable to each other and
 * to everyone else's.
 *
 * A trade with no stop has no R, and so cannot be measured at all. That is not a
 * quirk of this code — it is the actual problem with trading without a stop.
 */

export type Direction = "long" | "short";

export type ExitReason = "target" | "stop" | "manual" | "open";

export interface Trade {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  symbol: string;
  direction: Direction;
  /** Total account value at the time of the trade. */
  accountSize: number;
  entry: number;
  /** Where you would admit you were wrong. Null means you never decided. */
  stop: number | null;
  /** Where you planned to take profit. Null means you had no target. */
  target: number | null;
  /** Shares or contracts. */
  size: number;
  /** Null while the trade is still open. */
  exit: number | null;
  exitReason: ExitReason;
  /** The named pattern you were trading. */
  setup: string;
  /** What you wrote down before entering. */
  planNote: string;
  /** Did you widen the stop once the trade went against you? */
  stopMovedAgainst: boolean;
  /** How many trades you had already taken that day. */
  tradesToday: number;
  /** Minutes between your last losing trade and this one. Null if not applicable. */
  minutesSincePriorLoss: number | null;
  /** Key into the local screenshot store. */
  screenshotId?: string;
  /** Free-text review written after the fact. */
  reviewNote?: string;
}

const sign = (d: Direction) => (d === "long" ? 1 : -1);

/**
 * Distance from entry to stop, per share. This is 1R.
 *
 * Direction matters and is not optional. A "stop" above the entry on a long is
 * not a stop — it is an instruction to sell at a loss the moment the trade goes
 * your way. Taking Math.abs() here once made the grader award full marks to
 * exactly that trade, which is the worst thing this site could do.
 *
 * Callers that genuinely do not know the direction may omit it, and then only
 * the distance is checked.
 */
export function riskPerUnit(
  trade: Pick<Trade, "entry" | "stop"> & { direction?: Direction },
): number {
  if (trade.stop === null || !Number.isFinite(trade.stop)) return NaN;
  if (trade.direction === "long" && trade.stop >= trade.entry) return NaN;
  if (trade.direction === "short" && trade.stop <= trade.entry) return NaN;
  const distance = Math.abs(trade.entry - trade.stop);
  return distance === 0 ? NaN : distance;
}

/** True when the stop sits on the side of entry that makes it a stop. */
export function stopIsOnTheRightSide(
  trade: Pick<Trade, "entry" | "stop" | "direction">,
): boolean {
  if (trade.stop === null || !Number.isFinite(trade.stop)) return false;
  return trade.direction === "long"
    ? trade.stop < trade.entry
    : trade.stop > trade.entry;
}

/** True when the target sits on the side of entry you actually profit from. */
export function targetIsOnTheRightSide(
  trade: Pick<Trade, "entry" | "target" | "direction">,
): boolean {
  if (trade.target === null || !Number.isFinite(trade.target)) return false;
  return trade.direction === "long"
    ? trade.target > trade.entry
    : trade.target < trade.entry;
}

/** The whole dollar amount at stake if the stop is hit. */
export function riskAmount(trade: Pick<Trade, "entry" | "stop" | "size">): number {
  return riskPerUnit(trade) * trade.size;
}

/** Risk as a percentage of the account. The number that decides survival. */
export function riskPercent(
  trade: Pick<Trade, "entry" | "stop" | "size" | "accountSize">,
): number {
  if (!trade.accountSize) return NaN;
  return (riskAmount(trade) / trade.accountSize) * 100;
}

/**
 * How many times your risk you stood to make, if the target was hit.
 *
 * Direction matters here for the same reason it does for the stop: a long whose
 * target sits below its entry has no reward at all, and Math.abs() once turned
 * that into a flattering 3:1.
 */
export function plannedRR(
  trade: Pick<Trade, "entry" | "stop" | "target"> & { direction?: Direction },
): number {
  if (trade.target === null || !Number.isFinite(trade.target)) return NaN;
  if (trade.direction === "long" && trade.target <= trade.entry) return NaN;
  if (trade.direction === "short" && trade.target >= trade.entry) return NaN;
  const risk = riskPerUnit(trade);
  if (!Number.isFinite(risk)) return NaN;
  return Math.abs(trade.target - trade.entry) / risk;
}

/** Actual profit or loss in dollars. */
export function profitLoss(
  trade: Pick<Trade, "entry" | "exit" | "size" | "direction">,
): number {
  if (trade.exit === null || !Number.isFinite(trade.exit)) return NaN;
  return (trade.exit - trade.entry) * sign(trade.direction) * trade.size;
}

/** Result in R. Hitting a 3:1 target is +3R; getting stopped out is −1R. */
export function realisedR(
  trade: Pick<Trade, "entry" | "exit" | "stop" | "size" | "direction">,
): number {
  const risked = riskAmount(trade);
  if (!Number.isFinite(risked) || risked === 0) return NaN;
  const pnl = profitLoss(trade);
  if (!Number.isFinite(pnl)) return NaN;
  return pnl / risked;
}

/**
 * The size that risks exactly `riskPct` of the account given your stop.
 *
 * This is the formula that should decide every position you ever take. Note
 * which way it runs: the stop comes first and the size follows. A wider stop
 * means a smaller position, not more risk.
 */
export function positionSize(
  accountSize: number,
  riskPct: number,
  entry: number,
  stop: number,
): number {
  const perUnit = Math.abs(entry - stop);
  if (perUnit === 0 || !Number.isFinite(perUnit)) return NaN;
  return (accountSize * (riskPct / 100)) / perUnit;
}

/** Average R across a set of closed trades. Above zero is an edge. */
export function expectancy(rs: number[]): number {
  const clean = rs.filter(Number.isFinite);
  if (clean.length === 0) return NaN;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

/**
 * The win rate you need just to break even at a given reward:risk.
 *
 * At 1:1 you need 50%. At 3:1 you need only 25% — which is why traders who
 * insist on being right most of the time tend to lose money.
 */
export function breakevenWinRate(rewardToRisk: number): number {
  if (!Number.isFinite(rewardToRisk) || rewardToRisk <= 0) return NaN;
  return (1 / (1 + rewardToRisk)) * 100;
}

/** Proportion of closed trades that made money. */
export function winRate(rs: number[]): number {
  const clean = rs.filter(Number.isFinite);
  if (clean.length === 0) return NaN;
  return (clean.filter((r) => r > 0).length / clean.length) * 100;
}

/** Largest peak-to-trough fall of the running R total. */
export function maxDrawdownR(rs: number[]): number {
  let peak = 0;
  let running = 0;
  let worst = 0;
  for (const r of rs) {
    if (!Number.isFinite(r)) continue;
    running += r;
    peak = Math.max(peak, running);
    worst = Math.min(worst, running - peak);
  }
  return Math.abs(worst);
}

/** Running cumulative R, for the equity curve. Starts at zero. */
export function cumulativeR(rs: number[]): number[] {
  const out: number[] = [0];
  let running = 0;
  for (const r of rs) {
    if (Number.isFinite(r)) running += r;
    out.push(running);
  }
  return out;
}

export function isClosed(trade: Trade): boolean {
  return trade.exit !== null && Number.isFinite(trade.exit);
}
