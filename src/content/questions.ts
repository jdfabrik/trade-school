import type { Question } from "./types";

/**
 * The judgement questions are the important ones. Each describes a trade and
 * asks whether it was well taken — and several of the badly-taken ones made
 * money, while several of the well-taken ones lost. That is the habit the drill
 * exists to break: reading the result and calling it a verdict.
 */
export const QUESTIONS: Question[] = [
  /* ------------------------------- risk ------------------------------- */
  {
    id: "risk-order",
    kind: "mcq",
    prompt: "In what order should you decide these four things?",
    choices: [
      "Entry → size → stop → target",
      "Setup → stop → size → entry",
      "Size → entry → stop → target",
      "Setup → size → entry → stop",
    ],
    answerIndex: 1,
    explanation:
      "Name the setup, decide where the idea is wrong (the stop), work out the size that makes that distance cost 1% of your account, then enter. Any order that puts size before the stop means you are choosing how much to lose by feel.",
    lessonSlug: "risk-first",
    topic: "risk",
  },
  {
    id: "risk-streak",
    kind: "numeric",
    prompt:
      "You risk 2% per trade and take six losses in a row. Roughly what percentage of your account is gone?",
    answer: 11.4,
    tolerance: 1.5,
    suffix: "%",
    explanation:
      "About 11.4%. Each loss takes 2% of what remains, so it compounds slightly: 1 − 0.98⁶. Painful but survivable. At 10% per trade the same six losses take nearly half the account.",
    working: "(1 − 0.98⁶) × 100 = 11.4%",
    lessonSlug: "risk-first",
    topic: "risk",
  },
  {
    id: "risk-cap",
    kind: "truefalse",
    prompt:
      "If you are very confident in a trade, it is reasonable to risk 4% of your account instead of 1%.",
    answer: false,
    explanation:
      "Confidence is not information. The trades you feel best about are not reliably the ones that work, and sizing up on conviction is how one bad day erases a good month. The cap exists precisely for the trades you feel certain about.",
    lessonSlug: "risk-first",
    topic: "risk",
  },

  /* ------------------------------ sizing ------------------------------ */
  {
    id: "size-basic",
    kind: "numeric",
    prompt:
      "Account $10,000. You risk 1% per trade. Entry $40.00, stop $39.50. How many shares?",
    answer: 200,
    tolerance: 0,
    suffix: "shares",
    explanation:
      "1% of $10,000 is $100 of risk. The stop is $0.50 away, so $100 ÷ $0.50 = 200 shares.",
    working: "($10,000 × 1%) ÷ ($40.00 − $39.50) = $100 ÷ $0.50 = 200",
    lessonSlug: "position-sizing",
    topic: "sizing",
  },
  {
    id: "size-wider-stop",
    kind: "mcq",
    prompt:
      "You were going to use a $0.50 stop but the chart says the stop really belongs $2.00 away. What happens to your position size?",
    choices: [
      "It stays the same — the stop does not affect size",
      "It gets four times larger",
      "It gets four times smaller",
      "You should skip the trade because the stop is too wide",
    ],
    answerIndex: 2,
    explanation:
      "Four times smaller. The risk in dollars stays fixed at 1%; a stop four times wider means a position four times smaller. This feels wrong at first because the smaller position 'feels' like less of a bet. It is exactly the same bet.",
    lessonSlug: "position-sizing",
    topic: "sizing",
  },
  {
    id: "size-rounding",
    kind: "mcq",
    prompt: "The formula says 237 shares. What do you take?",
    choices: ["250, it is tidier", "237 exactly", "200", "300, for a round number"],
    answerIndex: 2,
    explanation:
      "Round down. 200 shares risks slightly less than your cap; 250 risks slightly more. The profit difference is trivial and the habit difference is not.",
    lessonSlug: "position-sizing",
    topic: "sizing",
  },

  /* ------------------------------- stops ------------------------------ */
  {
    id: "stop-move",
    kind: "truefalse",
    prompt:
      "If a trade goes against you and you still believe in the idea, widening the stop to give it room is a reasonable adjustment.",
    answer: false,
    explanation:
      "This is the single most expensive habit in retail trading. Moving a stop away from price converts a planned small loss into an unplanned large one, and it is the step that appears in almost every account-ending story. Stops move toward profit only.",
    lessonSlug: "stops",
    topic: "stops",
  },
  {
    id: "stop-mental",
    kind: "truefalse",
    prompt: "A stop you are holding in your head counts as having a stop.",
    answer: false,
    explanation:
      "It does not. In the moment, with money moving against you, you will not honour it — which is the entire reason the resting order exists. Place the order.",
    lessonSlug: "stops",
    topic: "stops",
  },
  {
    id: "stop-placement",
    kind: "mcq",
    prompt: "Where does the stop belong on a long trade?",
    choices: [
      "A fixed $50 below entry, so the loss is always the same",
      "Just below a level that matters, such as the low of the pattern",
      "At the nearest round number",
      "Wherever keeps the position size you want",
    ],
    answerIndex: 1,
    explanation:
      "Below the level that would prove the idea wrong — the low of the pattern, the base of the breakout. A fixed dollar amount ignores the chart entirely, round numbers are where everyone else's stops sit, and choosing the stop to justify a size is the whole process backwards.",
    lessonSlug: "stops",
    topic: "stops",
  },

  /* ----------------------------- measuring ---------------------------- */
  {
    id: "r-basic",
    kind: "numeric",
    prompt:
      "Entry $20.00, stop $19.60, 500 shares. You exit at $21.20. What is the result in R?",
    answer: 3,
    tolerance: 0.05,
    suffix: "R",
    explanation:
      "The stop was $0.40 away, so 1R = $0.40 × 500 = $200. You made $1.20 × 500 = $600. That is +3R.",
    working: "$600 profit ÷ $200 risked = +3R",
    lessonSlug: "r-multiples",
    topic: "measuring",
  },
  {
    id: "r-breakeven",
    kind: "numeric",
    prompt: "At a reward:risk of 3:1, what win rate do you need just to break even?",
    answer: 25,
    tolerance: 1,
    suffix: "%",
    explanation:
      "25%. One winner at +3R pays for three losers at −1R each. This is why insisting on being right most of the time is a trap — it pushes you toward tiny profits and large losses.",
    working: "1 ÷ (1 + 3) = 25%",
    lessonSlug: "r-multiples",
    topic: "measuring",
  },
  {
    id: "r-expectancy",
    kind: "mcq",
    prompt:
      "Your last four trades were +3R, −1R, −1R, −1R. What is your expectancy, and what does it mean?",
    choices: [
      "+3R — one big winner, so you are well ahead",
      "0R — breakeven before costs, and losing after them",
      "−1R — three losses outweigh one win",
      "+0.75R — a strong edge",
    ],
    answerIndex: 1,
    explanation:
      "(3 − 1 − 1 − 1) ÷ 4 = 0R. Exactly breakeven before commissions and spread, which means losing money once those are paid. A 25% win rate needs better than 3:1 to actually earn.",
    lessonSlug: "r-multiples",
    topic: "measuring",
  },
  {
    id: "r-winrate",
    kind: "truefalse",
    prompt: "A trader with an 80% win rate is necessarily doing better than one with 35%.",
    answer: false,
    explanation:
      "Not necessarily, and often not. Win rate means nothing without the size of the wins and losses. An 80% win rate where the occasional loser is ten times a winner is a slow bankruptcy; 35% at 4:1 is an excellent business.",
    lessonSlug: "r-multiples",
    topic: "measuring",
  },

  /* ------------------------------ setups ------------------------------ */
  {
    id: "setup-definition",
    kind: "mcq",
    prompt: "What is the test of whether you actually have a setup?",
    choices: [
      "It has made money for you before",
      "You could describe it precisely enough that another trader would recognise it tomorrow",
      "It is mentioned in a book",
      "It works most of the time",
    ],
    answerIndex: 1,
    explanation:
      "If you cannot describe it that precisely, it is not a setup — it is a reaction to a chart, and reactions cannot be reviewed or improved. Having made money before is not the test either; plenty of bad trades make money.",
    lessonSlug: "setups",
    topic: "setups",
  },
  {
    id: "setup-count",
    kind: "mcq",
    prompt: "How many setups should a new trader be working with?",
    choices: [
      "As many as possible, to catch every opportunity",
      "One for each market condition, perhaps six or seven",
      "Two, until there are about fifty logged examples of each",
      "It does not matter as long as you use a stop",
    ],
    answerIndex: 2,
    explanation:
      "Two. Fifty examples is roughly where a pattern becomes readable in your own numbers. Collecting setups feels like progress and mostly produces a trader who is always in the market and can never tell what is working.",
    lessonSlug: "setups",
    topic: "setups",
  },
  {
    id: "setup-standaside",
    kind: "truefalse",
    prompt:
      "If you have sat at your desk all morning and seen nothing worth trading, you should lower your standards to get a trade on.",
    answer: false,
    explanation:
      "Most of a trading day contains nothing worth trading. The instinct to find something because you are at your desk is exactly why overtrading is the most common way new accounts bleed out. A day with no trades is a legitimate day.",
    lessonSlug: "setups",
    topic: "setups",
  },

  /* ---------------------------- psychology ---------------------------- */
  {
    id: "psych-revenge",
    kind: "mcq",
    prompt: "You have just taken a loss. What is the rule?",
    choices: [
      "Get straight back in while the setup is still valid",
      "Double the next position to make it back",
      "Stand up and let at least five minutes pass",
      "Switch to a different instrument and carry on",
    ],
    answerIndex: 2,
    explanation:
      "A trade taken while the last loss is still stinging is chosen by the sting rather than by your rules. The fix has to be mechanical rather than a judgement call, because the moment you most need the judgement is the moment it is least available.",
    lessonSlug: "psychology",
    topic: "psychology",
  },
  {
    id: "psych-limit",
    kind: "truefalse",
    prompt:
      "On a day when you are down and feel certain the next trade will work, it makes sense to trade past your daily loss limit.",
    answer: false,
    explanation:
      "The day you most want to override the limit is the day it is doing its job. The limit exists because in-the-moment judgement is unreliable after losses — which is precisely the state you are in when you want to override it.",
    lessonSlug: "psychology",
    topic: "psychology",
  },
  {
    id: "psych-question",
    kind: "mcq",
    prompt: "What is the single most useful question to ask before entering a trade?",
    choices: [
      "How much could I make on this?",
      "Would I take this if I were flat, calm, and had not just lost money?",
      "What does the indicator say?",
      "Has this setup worked recently?",
    ],
    answerIndex: 1,
    explanation:
      "If the honest answer is no, the trade is about your emotional state rather than the market. It is the fastest way to catch revenge trades and FOMO chases before they cost you anything.",
    lessonSlug: "psychology",
    topic: "psychology",
  },

  /* ---------------------------- journaling ---------------------------- */
  {
    id: "journal-grade",
    kind: "mcq",
    prompt: "Which of the four kinds of trade is the most dangerous for a new trader?",
    choices: [
      "Traded badly, lost money",
      "Traded badly, made money",
      "Traded well, lost money",
      "Traded well, made money",
    ],
    answerIndex: 1,
    explanation:
      "Traded badly and made money. The market has just paid you for the exact behaviour that will eventually take everything, at the moment you are most impressionable. A bad trade that loses is cheap by comparison — the loss is small and the lesson is free.",
    lessonSlug: "journaling",
    topic: "journal",
  },
  {
    id: "journal-when",
    kind: "mcq",
    prompt: "When should you write down your reason for a trade?",
    choices: [
      "Before entering",
      "Once you can see whether it is working",
      "At the end of the day, for all trades together",
      "Only for the trades that lost",
    ],
    answerIndex: 0,
    explanation:
      "Before entering, while you are still capable of thinking clearly. A reason written afterwards is a story assembled to fit the result, and it teaches you nothing.",
    lessonSlug: "journaling",
    topic: "journal",
  },
  {
    id: "journal-review",
    kind: "mcq",
    prompt: "When reviewing your last twenty trades, what should you be looking for?",
    choices: [
      "The biggest winner, to work out how to repeat it",
      "The repeated failure, even if it is boring",
      "Whether the week was profitable overall",
      "Which instrument paid the most",
    ],
    answerIndex: 1,
    explanation:
      "The repeated failure. If you moved your stop four times, that is the thing to fix — not the clever exit you are still pleased about. Improvement comes from removing the recurring mistake, not from admiring the best trade.",
    lessonSlug: "journaling",
    topic: "journal",
  },

  /* --------------------------- judgement ------------------------------ */
  {
    id: "judge-lucky-no-stop",
    kind: "judgement",
    prompt: "Was this a well-taken trade?",
    scenario: {
      summary: "A breakout in a stock that had been all over the news that morning.",
      facts: [
        "Account $20,000. Bought 800 shares at $25.00 — a $20,000 position, the whole account.",
        "No stop placed. 'I was watching it the whole time.'",
        "No target. Planned to 'see how it goes'.",
        "Nothing written down beforehand.",
      ],
      outcome: "Sold at $26.10 for a profit of $880.",
    },
    answer: false,
    explanation:
      "No. It made money and it was still one of the worst trades in this drill. No stop, no target, no plan, and the entire account in a single position — if that stock had gapped down on news, a large part of the account was gone. The profit is the problem: it rewards a habit that will eventually take everything.",
    lessonSlug: "journaling",
    topic: "journal",
  },
  {
    id: "judge-good-loss",
    kind: "judgement",
    prompt: "Was this a well-taken trade?",
    scenario: {
      summary: "An opening range breakout, taken on the retest.",
      facts: [
        "Account $20,000. Risk budget 1% = $200.",
        "Entry $48.20, stop $47.80 below the range low — $0.40 of risk, so 500 shares.",
        "Target $49.40, giving 3:1.",
        "Setup named and reason written before entry. Screenshot saved.",
        "Stop left where it was placed.",
      ],
      outcome: "Stopped out at $47.80 for a loss of $200.",
    },
    answer: true,
    explanation:
      "Yes. Everything under the trader's control was done properly, and the trade lost anyway — which is what a normal loss looks like. There is nothing to fix here. A trader who changes their process after a loss like this is learning from noise.",
    lessonSlug: "journaling",
    topic: "journal",
  },
  {
    id: "judge-moved-stop",
    kind: "judgement",
    prompt: "Was this a well-taken trade?",
    scenario: {
      summary: "A pullback buy that went the wrong way first.",
      facts: [
        "Account $30,000. Entry $60.00, stop $59.40, 500 shares — exactly 1% risk.",
        "Price fell to $59.45. The trader moved the stop down to $58.80 'to give it room'.",
        "Price recovered and the trade was closed at $61.20.",
      ],
      outcome: "Profit of $600, or +2R against the original stop.",
    },
    answer: false,
    explanation:
      "No. The moment the stop moved, the trade stopped being the one that was planned — the real risk doubled to 2% without a decision being made. It worked this time. The next time price keeps going and the loss is twice what was agreed. Moving a stop away from price is the habit that ends accounts.",
    lessonSlug: "stops",
    topic: "stops",
  },
  {
    id: "judge-revenge",
    kind: "judgement",
    prompt: "Was this a well-taken trade?",
    scenario: {
      summary: "The trader's ninth trade of the morning, two minutes after a loss.",
      facts: [
        "Account $15,000. Entry $12.40, stop $12.25, 1,000 shares — $150 risk, exactly 1%.",
        "Setup named, reason written, screenshot saved, stop placed and held.",
        "Taken 2 minutes after a losing trade. Ninth trade of the day.",
      ],
      outcome: "Closed at target for +2R, a $300 profit.",
    },
    answer: false,
    explanation:
      "No — and this one is genuinely close. The mechanics are flawless: correct size, real stop, named setup, written reason. But it is the ninth trade of the morning taken two minutes after a loss, which is the textbook shape of revenge trading and overtrading. Good mechanics do not make a trade taken in the wrong state a good trade. The rule about standing up for five minutes exists for exactly this moment.",
    lessonSlug: "psychology",
    topic: "psychology",
  },
  {
    id: "judge-tiny-target",
    kind: "judgement",
    prompt: "Was this a well-taken trade?",
    scenario: {
      summary: "A trader who 'likes to take profits quickly'.",
      facts: [
        "Account $40,000. Entry $80.00, stop $79.20 — $0.80 risk, 500 shares, exactly 1%.",
        "Target $80.30, giving 0.375:1.",
        "Setup named, reason written, stop placed and held, screenshot saved.",
      ],
      outcome: "Target hit. Profit $150.",
    },
    answer: false,
    explanation:
      "No. Everything is right except the one thing that decides whether this is a business: the reward. At 0.375:1 the trader needs to win about 73% of the time just to break even, and nobody sustains that. A run of small wins here feels wonderful and ends the first time a loser arrives.",
    lessonSlug: "r-multiples",
    topic: "measuring",
  },
];

export function questionsForLesson(slug: string): Question[] {
  return QUESTIONS.filter((q) => q.lessonSlug === slug);
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
