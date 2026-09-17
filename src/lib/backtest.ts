/**
 * A signal-driven backtest, modelled on vectorbt's `Portfolio.from_signals`.
 *
 * The position state machine is the point. You cannot sell what you do not own,
 * so an exit signal that arrives before any entry is ignored — which is exactly
 * the guide's chart-reading rule ("the first signal that can execute is a buy;
 * an upper-band pierce before any buy is a distractor").
 */

export interface Order {
  index: number;
  side: "buy" | "sell";
  price: number;
  shares: number;
  fee: number;
}

export interface BacktestOptions {
  /** Proportional fee per trade. 0.1% is 0.001. */
  fees?: number;
  initialCash?: number;
}

export interface BacktestResult {
  orders: Order[];
  /** Portfolio value at every bar, marked to market. */
  value: number[];
  /** Value relative to the starting cash, so it begins at 1. */
  cumReturns: number[];
  finalValue: number;
  totalFees: number;
  /** Completed round trips. */
  trades: number;
  openAtEnd: boolean;
}

export function fromSignals(
  close: number[],
  entries: boolean[],
  exits: boolean[],
  options: BacktestOptions = {},
): BacktestResult {
  const fees = options.fees ?? 0;
  const initialCash = options.initialCash ?? 10_000;

  let cash = initialCash;
  let shares = 0;
  let totalFees = 0;
  let trades = 0;
  const orders: Order[] = [];
  const value: number[] = new Array(close.length);

  for (let i = 0; i < close.length; i += 1) {
    const price = close[i];

    if (Number.isFinite(price)) {
      if (shares === 0 && entries[i]) {
        // Buy with everything on hand. The fee comes out before the shares do.
        const fee = cash * fees;
        const investable = cash - fee;
        shares = investable / price;
        cash = 0;
        totalFees += fee;
        orders.push({ index: i, side: "buy", price, shares, fee });
      } else if (shares > 0 && exits[i]) {
        const proceeds = shares * price;
        const fee = proceeds * fees;
        orders.push({ index: i, side: "sell", price, shares, fee });
        cash = proceeds - fee;
        totalFees += fee;
        shares = 0;
        trades += 1;
      }
    }

    value[i] = cash + shares * (Number.isFinite(price) ? price : 0);
  }

  const finalValue = value[value.length - 1] ?? initialCash;

  return {
    orders,
    value,
    cumReturns: value.map((v) => v / initialCash),
    finalValue,
    totalFees,
    trades,
    openAtEnd: shares > 0,
  };
}

/** The passive benchmark: buy at the first bar and never trade again. */
export function buyAndHold(close: number[], options: BacktestOptions = {}): number[] {
  const fees = options.fees ?? 0;
  const initialCash = options.initialCash ?? 10_000;
  const first = close.find(Number.isFinite);
  if (first === undefined) return close.map(() => initialCash);

  const fee = initialCash * fees;
  const shares = (initialCash - fee) / first;
  return close.map((p) => (Number.isFinite(p) ? shares * p : NaN));
}
