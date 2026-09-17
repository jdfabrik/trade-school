import type { Term } from "./types";

export const GLOSSARY: Term[] = [
  {
    id: "r",
    term: "R",
    meaning: "The amount you risked on a trade. One R is your planned loss.",
    detail:
      "The most useful unit in trading. Getting stopped out costs 1R. Hitting a target three times as far away as your stop makes 3R. Because it is measured against your own risk, a +2R trade means the same thing whether you trade $500 or $500,000.",
    topic: "measuring",
  },
  {
    id: "stop",
    term: "Stop loss",
    meaning: "A resting order that closes the trade at a price you chose in advance.",
    detail:
      "It is the price at which you have decided your idea was wrong. Placed as an actual order, not held in your head — in the moment, with money moving, almost nobody honours a mental stop.",
    topic: "stops",
  },
  {
    id: "position-size",
    term: "Position size",
    meaning: "How many shares or contracts you take.",
    detail:
      "Calculated, never guessed: (account × risk %) ÷ (entry − stop). It is the last thing you decide, not the first.",
    topic: "sizing",
  },
  {
    id: "risk-per-trade",
    term: "Risk per trade",
    meaning: "What one trade can cost you, as a percentage of your whole account.",
    detail:
      "The number that decides whether you survive a losing streak. Keep it at or under 1%. At 5%, six ordinary losses in a row cost you a quarter of everything.",
    topic: "risk",
  },
  {
    id: "reward-risk",
    term: "Reward:risk",
    meaning: "How far the target is compared with how far the stop is.",
    detail:
      "A 2:1 trade stands to make twice what it risks. The higher this is, the less often you need to be right — at 3:1 you can lose three out of four trades and still break even.",
    topic: "measuring",
  },
  {
    id: "expectancy",
    term: "Expectancy",
    meaning: "Your average result per trade, measured in R.",
    detail:
      "Add up your R results and divide by the number of trades. Above zero means you have an edge. Below zero means no amount of clever sizing will save it.",
    topic: "measuring",
  },
  {
    id: "win-rate",
    term: "Win rate",
    meaning: "The percentage of your trades that make money.",
    detail:
      "On its own it tells you almost nothing. A 30% win rate at 4:1 is excellent; an 80% win rate where the losers are huge is a slow bankruptcy.",
    topic: "measuring",
  },
  {
    id: "drawdown",
    term: "Drawdown",
    meaning: "How far your account has fallen from its highest point.",
    detail:
      "The number that tells you whether a strategy was actually survivable. A record that ends up might still have gone through a 40% fall in the middle, and most people quit before the recovery.",
    topic: "risk",
  },
  {
    id: "setup",
    term: "Setup",
    meaning: "A specific, repeatable situation you decided in advance is worth trading.",
    detail:
      "It has conditions you can check, a defined entry, a place the stop goes, and a known way it fails. If you cannot describe it precisely enough for another trader to spot it tomorrow, it is not a setup yet.",
    topic: "setups",
  },
  {
    id: "edge",
    term: "Edge",
    meaning: "A reason your trades should make money over a long run of them.",
    detail:
      "Not a feeling and not a good week. An edge is visible as positive expectancy across enough trades — fifty at minimum — that luck is no longer the obvious explanation.",
    topic: "measuring",
  },
  {
    id: "slippage",
    term: "Slippage",
    meaning: "The difference between the price you expected and the price you got.",
    detail:
      "Worst when the market is moving fast, which is exactly when your stop is most likely to trigger. Budget for it; a stop is a request, not a guarantee.",
    topic: "risk",
  },
  {
    id: "spread",
    term: "Spread",
    meaning: "The gap between the buy price and the sell price.",
    detail:
      "You pay it on every round trip. On a wide-spread instrument you can be down before the price has moved at all, which is why spread matters far more to a day trader than to an investor.",
    topic: "risk",
  },
  {
    id: "long-short",
    term: "Long / short",
    meaning: "Long profits when price rises. Short profits when price falls.",
    detail:
      "For a long, the stop sits below your entry. For a short, above it. Everything else about risk and sizing works identically.",
    topic: "setups",
  },
  {
    id: "moving-average",
    term: "Moving average",
    meaning: "The average price over the last so many bars, drawn as a line that moves with price.",
    detail:
      "It smooths the jiggle so the direction is easier to see. Traders often watch whether pullbacks stop at one, which is why a stop sometimes goes just beyond it. It describes what price has already done; it does not predict what comes next.",
    topic: "setups",
  },
  {
    id: "vwap",
    term: "VWAP",
    meaning: "The average price paid so far today, weighted by how much traded at each price.",
    detail:
      "Short for volume-weighted average price. It is watched because it is roughly where the day's buyers and sellers are level, so losing it or reclaiming it is treated as a change in who is in control. Like any average, it is a description of the session so far, not a signal.",
    topic: "setups",
  },
  {
    id: "gap",
    term: "Gap",
    meaning: "When a price opens well away from where it closed, with no trading in between.",
    detail:
      "News overnight is the usual cause. It matters because a stop cannot protect you inside a gap: the next price available may be far past where your stop sat, and the loss is whatever that price turns out to be.",
    topic: "risk",
  },
  {
    id: "breakeven-stop",
    term: "Breakeven stop",
    meaning: "Moving your stop to your entry price once the trade is in profit.",
    detail:
      "Legitimate, because it moves toward profit. But not free — ordinary pullbacks will now stop you out of trades that go on to work.",
    topic: "stops",
  },
  {
    id: "revenge-trading",
    term: "Revenge trading",
    meaning: "Entering again immediately after a loss to win the money back.",
    detail:
      "One of the most destructive habits there is. The tell is the clock: a trade taken while the last loss is still stinging was chosen by the sting, not by your rules. Stand up, let five minutes pass, and decide again.",
    topic: "psychology",
  },
  {
    id: "overtrading",
    term: "Overtrading",
    meaning: "Taking far more trades than your setups actually produce.",
    detail:
      "Driven by boredom rather than opportunity. The tell is that you cannot name the setup for half of them. Cap the number of trades before the session starts.",
    topic: "psychology",
  },
  {
    id: "tilt",
    term: "Tilt",
    meaning: "Trading while angry, rattled or desperate.",
    detail:
      "Borrowed from poker. You do not notice it while it is happening, which is why the defence has to be a rule set in advance — a daily loss limit, a break after a loss — rather than a judgement made in the moment.",
    topic: "psychology",
  },
  {
    id: "fomo",
    term: "FOMO",
    meaning: "Chasing a move you have already missed.",
    detail:
      "You enter late, with the stop now either miles away or absurdly tight. The move is gone. Waiting costs nothing.",
    topic: "psychology",
  },
  {
    id: "averaging-down",
    term: "Averaging down",
    meaning: "Adding to a position that has moved against you.",
    detail:
      "It improves your average price and makes your problem larger. For a day trader with a defined stop it is simply a way of ignoring the stop.",
    topic: "risk",
  },
  {
    id: "daily-loss-limit",
    term: "Daily loss limit",
    meaning: "A fixed point at which you stop trading for the day.",
    detail:
      "Three losses, or 3% of the account — set it in advance. The day you most want to override it is the day it is doing its job.",
    topic: "psychology",
  },
  {
    id: "paper-trading",
    term: "Paper trading",
    meaning: "Placing trades without real money, to practise the process.",
    detail:
      "Useful for learning mechanics and building a record. It will not teach you how the fear feels, so treat a good paper record as the start rather than the finish.",
    topic: "journal",
  },
  {
    id: "journal",
    term: "Trading journal",
    meaning: "A record of every trade, written while it is fresh.",
    detail:
      "Entry, stop, target, size, the setup, why you took it, and a screenshot. Without it you are not learning from experience, you are just accumulating opinions about it.",
    topic: "journal",
  },
];

export function termById(id: string): Term | undefined {
  return GLOSSARY.find((t) => t.id === id);
}
