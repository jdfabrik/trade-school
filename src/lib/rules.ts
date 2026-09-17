/**
 * The trader's own thresholds.
 *
 * The site used to hard-code 1% risk and 2:1 reward and mark every trade against
 * them. They are good defaults and the lessons still argue for them, but they
 * are not universal law — a legitimate style can sit outside them, and a site
 * that grades every such trade an F is just wrong about that trader.
 *
 * So they are settings. What the site keeps is the right to say plainly when a
 * choice sits outside what it teaches, which is different from refusing to
 * measure it.
 */

export interface TradingRules {
  /** Most of the account the trader is willing to risk on one trade, as a %. */
  maxRiskPct: number;
  /** Smallest planned reward:risk the trader considers worth taking. */
  minRR: number;
}

export const DEFAULT_RULES: TradingRules = { maxRiskPct: 1, minRR: 2 };

/**
 * Hard limits on what can be set.
 *
 * The upper bound on risk is a judgement: above about 5% per trade, a perfectly
 * ordinary losing streak takes a quarter of the account, and no amount of
 * "that's my style" makes the arithmetic different. The site will measure you
 * against your own number, but it will not pretend 20% is a plan.
 */
export const RISK_MIN = 0.1;
export const RISK_MAX = 5;
export const RR_MIN = 0.25;
export const RR_MAX = 10;

/** The number of closed trades before a win rate or expectancy means anything. */
export const MIN_TRADES_FOR_STATS = 20;

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function clampRules(rules: Partial<TradingRules>): TradingRules {
  return {
    maxRiskPct: clampNumber(
      rules.maxRiskPct as number,
      RISK_MIN,
      RISK_MAX,
      DEFAULT_RULES.maxRiskPct,
    ),
    minRR: clampNumber(rules.minRR as number, RR_MIN, RR_MAX, DEFAULT_RULES.minRR),
  };
}

/**
 * A plain sentence when a setting sits outside what the lessons teach, or null.
 *
 * Deliberately silent for a trader who has made the rules stricter — tightening
 * your own risk is not something to be warned about.
 */
export function rulesWarning(rules: TradingRules): string | null {
  const notes: string[] = [];

  if (rules.maxRiskPct > 2) {
    notes.push(
      `You have set your limit to ${rules.maxRiskPct}% of the account per trade. At that size, ten ordinary losses in a row cost about ${Math.round(
        (1 - Math.pow(1 - rules.maxRiskPct / 100, 10)) * 100,
      )}% of everything you have. The lessons here argue for 1%.`,
    );
  }

  if (rules.minRR < 1) {
    notes.push(
      `A reward:risk of ${rules.minRR} means you need to win about ${Math.round(
        (1 / (1 + rules.minRR)) * 100,
      )}% of your trades just to break even, before costs. That is a hard living to make.`,
    );
  }

  return notes.length > 0 ? notes.join(" ") : null;
}

/* ------------------------------ persistence ------------------------------ */

const KEY = "ts:rules:v1";

export function loadRules(): TradingRules {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_RULES;
    return clampRules(JSON.parse(raw));
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveRules(rules: TradingRules): TradingRules {
  const safe = clampRules(rules);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(safe));
  } catch {
    /* private mode — the setting still applies for this page view */
  }
  return safe;
}

/* --------------------------- remembered account --------------------------- */

const ACCOUNT_KEY = "ts:account:v1";

/**
 * The trader's account size, remembered between trades.
 *
 * It is the same number on every trade in a day and asking for it each time was
 * friction for nothing.
 */
export function loadAccountSize(fallback = 25_000): number {
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

export function saveAccountSize(value: number): void {
  if (!Number.isFinite(value) || value <= 0) return;
  try {
    window.localStorage.setItem(ACCOUNT_KEY, String(value));
  } catch {
    /* private mode — it just will not be remembered */
  }
}
