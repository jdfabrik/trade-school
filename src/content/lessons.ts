import type { Lesson } from "./types";

export const LESSONS: Lesson[] = [
  /* ------------------------------------------------------------------ 1 */
  {
    slug: "the-odds",
    number: 1,
    title: "What you are actually walking into",
    blurb: "The honest picture of day trading before you risk a dollar of it.",
    topic: "risk",
    minutes: 5,
    takeaway:
      "Most people who try this lose money. The ones who do not are the ones who treat it as a job with rules, not as a way to get rich quickly.",
    blocks: [
      {
        paragraphs: [
          "Start with the part most trading sites skip. Day trading is hard, and most people who attempt it lose money. You do not have to take that on trust from a site like this one: brokers in several countries are required by their regulators to publish the share of their own customers who lose money, and you can read those figures on the brokers' own pages before you open an account.",
          "That is not a reason to walk away. It is a reason to be clear-eyed about what you are doing. You are trying to acquire a skill that most people who attempt it do not acquire, in an environment that pays you immediately for bad habits and punishes good ones at random.",
        ],
      },
      {
        heading: "Why it is harder than it looks",
        bullets: [
          "The feedback is noisy. A good decision can lose money and a terrible one can win, and you often cannot tell which was which for months.",
          "The costs are constant. Spreads, commissions and slippage take a slice of every single trade, whether you are right or wrong.",
          "You are trading against people and systems that do this full time, with better information and faster execution.",
          "It is emotionally exhausting in a way that reading about it never conveys. The money is real and it moves while you watch.",
        ],
      },
      {
        callout: {
          tone: "warn",
          text: "If you are trading with money you need — rent, debt repayments, anything with a deadline — stop. The pressure of needing a trade to work is the single most reliable way to make bad decisions, and no amount of technique survives it.",
        },
      },
      {
        heading: "What actually separates the two groups",
        paragraphs: [
          "It is rarely the strategy. Two traders can use the same setup and one makes money while the other does not, because the difference lives in the boring parts: how much they risk, whether they use a stop, whether they stop trading when they are tilted, whether they keep records honest enough to learn from.",
          "That is why this site grades your process rather than your profit. Profit will take care of itself if the process is right, and it will not last if it is not.",
        ],
      },
      {
        heading: "A reasonable way to start",
        bullets: [
          "Trade on paper, or at a size so small the money genuinely does not matter, until your process grades well.",
          "Expect to spend months, not weeks. Nobody learns a skilled trade in a fortnight.",
          "Judge yourself on whether you followed your rules, not on the day's profit and loss.",
          "Keep your day job. Needing this to work is the fastest way to make sure it does not.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    slug: "risk-first",
    number: 2,
    title: "Risk comes first, always",
    blurb: "The 1% rule, and the arithmetic that makes it non-negotiable.",
    topic: "risk",
    minutes: 6,
    takeaway:
      "Decide what you are willing to lose before you think about what you might make. Cap it at 1% of your account per trade.",
    blocks: [
      {
        paragraphs: [
          "Every new trader thinks about entries. Almost none of them think about size, and size is what decides whether you are still trading next year.",
          "The rule is simple: no single trade should be able to cost you more than about 1% of your account. Not 1% of the position — 1% of everything you have in the account.",
        ],
      },
      {
        heading: "Why 1%, and not 5%",
        paragraphs: [
          "Losing streaks are longer than people expect. Even a good strategy that wins 40% of the time will hand you six losses in a row fairly regularly — that is just how randomness works. The question is whether six losses in a row is an annoyance or a catastrophe.",
        ],
        table: {
          head: ["Risk per trade", "After 6 straight losses", "After 10 straight losses"],
          rows: [
            ["1%", "−5.9%", "−9.6%"],
            ["2%", "−11.4%", "−18.3%"],
            ["5%", "−26.5%", "−40.1%"],
            ["10%", "−46.9%", "−65.1%"],
          ],
        },
      },
      {
        callout: {
          tone: "note",
          text: "Read the bottom row again. At 10% per trade, ten losses leave you needing a 187% gain just to get back to where you started. At 1% you need about 11%. That asymmetry is the whole argument.",
        },
      },
      {
        paragraphs: [
          "That table is fixed at six losses and at ten, and your own cold stretch will be neither. So here is the same arithmetic with the dials in your hands. Set what you risk on a trade, set how long the run of losses goes on, and read what it would take to get back to level.",
        ],
        widget: {
          id: "streak-simulator",
          caption:
            "Walk the risk slider from 1% up to 10% without touching anything else. The account damage roughly multiplies. The gain you need to undo it grows far faster than that, and it is the second number that ends accounts.",
        },
      },
      {
        heading: "The order of operations",
        paragraphs: [
          "This is the sequence, and it only works in this order:",
        ],
        bullets: [
          "Find a setup you can name.",
          "Decide where the idea is wrong. That is your stop.",
          "Work out the size that makes the distance to that stop cost 1% of your account.",
          "Only now, enter.",
        ],
      },
      {
        worked: {
          title: "Putting it together",
          lines: [
            "Account: $25,000",
            "Risk budget: 1% = $250",
            "Entry: $100.00, stop: $99.00 → $1.00 of risk per share",
            "Size = $250 ÷ $1.00",
          ],
          answer: "250 shares",
        },
      },
      {
        heading: "The mistake this prevents",
        paragraphs: [
          "Without this, size gets decided by feeling — a round number, or how confident you happen to be that morning. Confidence is not information. The trades you feel best about are not reliably the ones that work, and sizing up on conviction is how a single bad day erases a good month.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    slug: "position-sizing",
    number: 3,
    title: "Position sizing",
    blurb: "One formula, used on every trade you ever take.",
    topic: "sizing",
    minutes: 5,
    takeaway:
      "Size = (account × risk %) ÷ (entry − stop). A wider stop means a smaller position, never a bigger loss.",
    blocks: [
      {
        paragraphs: [
          "This is the most useful piece of arithmetic in trading, and it takes about four seconds once you are used to it.",
        ],
        worked: {
          title: "The formula",
          lines: [
            "Size = (account × risk %) ÷ (distance from entry to stop)",
            "",
            "$25,000 × 1% = $250 of risk",
            "Entry $50.00, stop $48.75 → $1.25 per share",
            "$250 ÷ $1.25",
          ],
          answer: "200 shares",
        },
      },
      {
        paragraphs: [
          "Reading that is not the same as feeling it. Put the stop somewhere on the chart below and let the size fall out of it, the way it has to on a real trade.",
        ],
        widget: {
          id: "sizing-playground",
          caption:
            "Move the stop close to the entry, then a long way from it. The number of shares swings enormously while the money you stand to lose does not move at all. Then read the next section, which is about exactly what you just watched.",
        },
      },
      {
        heading: "The part that catches people out",
        paragraphs: [
          "Notice which way round it runs. The stop is decided by the chart — by where the idea stops making sense. The size then falls out of the arithmetic. You never choose a size first and then find somewhere to put the stop.",
          "This means a trade with a wide stop gets a small position, and a trade with a tight stop gets a large one. Both risk exactly the same money. That feels wrong at first, because the tight-stop trade 'feels' bigger. It is not. It is the same bet.",
        ],
        table: {
          head: ["Entry", "Stop", "Risk per share", "Size at $250 risk"],
          rows: [
            ["$50.00", "$49.50", "$0.50", "500 shares"],
            ["$50.00", "$48.75", "$1.25", "200 shares"],
            ["$50.00", "$45.00", "$5.00", "50 shares"],
          ],
        },
      },
      {
        callout: {
          tone: "warn",
          text: "If the size the formula gives you is uncomfortably small, the honest conclusion is that your account is too small for that trade — not that you should risk more. Trade something with a tighter stop, or trade smaller instruments.",
        },
      },
      {
        heading: "Rounding",
        paragraphs: [
          "Round down, never up. If the formula says 237 shares, take 200. The difference in profit is trivial; the difference in the habit is not.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    slug: "stops",
    number: 4,
    title: "Stops: deciding where you are wrong",
    blurb: "Where the stop belongs, and why moving it is the costliest habit there is.",
    topic: "stops",
    minutes: 6,
    takeaway:
      "The stop goes where your reason for the trade stops being true. Once placed, it only ever moves toward profit.",
    blocks: [
      {
        paragraphs: [
          "A stop is not a safety net bolted on after the fact. It is the statement of what would prove your idea wrong, and it has to be decided before you enter, when you are still capable of thinking clearly.",
        ],
      },
      {
        heading: "Where it belongs",
        bullets: [
          "Below the low of the pattern you are trading, for a long. Above the high, for a short.",
          "Beyond a level that matters — the base of a breakout, the other side of a range, a moving average the move has been respecting.",
          "Far enough out that ordinary noise does not reach it. If the instrument routinely swings 30 cents in a minute, a 10-cent stop is not a stop, it is a donation.",
        ],
      },
      {
        paragraphs: [
          "That last point is the one people argue with, so try it rather than take it. Below is a stretch of practice prices with a trade already on. Bring the stop in toward the entry and watch how little movement it takes to reach you.",
        ],
        widget: {
          id: "stop-noise",
          caption:
            "Tighten the stop until it gets hit, then look at where price went afterwards. A stop sitting inside the ordinary wobble does not save you from being wrong — it just makes you wrong more often, at full price each time.",
        },
      },
      {
        callout: {
          tone: "warn",
          text: "Never place a stop at a round number or a fixed dollar amount just because it is tidy. Round numbers are where everyone else's stops sit, and price has a habit of reaching for them.",
        },
      },
      {
        heading: "The one rule that matters most",
        paragraphs: [
          "Once the stop is placed, it moves in one direction only: toward profit. Never away.",
          "Widening a stop because the trade has gone against you feels like patience. It is not. It is the moment you stop trading your plan and start hoping, and it converts a planned small loss into an unplanned large one. Almost every catastrophic retail loss you will ever read about contains this step.",
        ],
      },
      {
        paragraphs: [
          "This is the one to spend a few minutes on. The trade below is already open and already going the wrong way. Move its stop wherever you like, let the rest of the days play out, and see what each choice cost.",
        ],
        widget: {
          id: "moving-stop",
          caption:
            "Take the loss where you planned it, then run the same trade again and give the stop more room. Do it a few times. Sometimes the extra room rescues you, which is precisely why the habit survives long enough to do real damage.",
        },
      },
      {
        heading: "Moving a stop to breakeven",
        paragraphs: [
          "Once a trade has moved perhaps one R in your favour, many traders move the stop to their entry price so the trade can no longer lose. This is legitimate — it moves toward profit, not away.",
          "It is not free, though. A stop at breakeven gets hit by ordinary pullbacks, and you will watch trades stop you out and then run to your target without you. That is the price of the certainty, and it is a reasonable trade to make while you are learning.",
        ],
      },
      {
        heading: "Mental stops",
        paragraphs: [
          "A stop you are 'holding in your head' is not a stop. In the moment, with money moving, you will not honour it — that is the whole reason the real one exists. Place the order.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    slug: "r-multiples",
    number: 5,
    title: "Measuring in R",
    blurb: "The unit that makes every trade comparable, and shows whether you have an edge.",
    topic: "measuring",
    minutes: 6,
    takeaway:
      "One R is what you risked. Measure results in R and your record becomes readable regardless of account size.",
    blocks: [
      {
        paragraphs: [
          "Counting profits in dollars makes your record almost impossible to read, because the amounts depend on how big your account happened to be that month and how big the position happened to be.",
          "So traders measure in R instead. One R is the amount you risked on that trade. Get stopped out and you lose 1R. Hit a target three times as far away as your stop and you make 3R. It does not matter whether 1R was $50 or $5,000.",
        ],
      },
      {
        worked: {
          title: "Reading a trade in R",
          lines: [
            "Entry $100, stop $99 → 1R = $1 per share",
            "Size 250 shares → 1R = $250",
            "Exited at $103 → made $3 per share = $750",
            "$750 ÷ $250",
          ],
          answer: "+3R",
        },
      },
      {
        paragraphs: [
          "Those three prices — where you get in, where you are wrong, where you would take the money — are the whole of it. Move them around and watch what each arrangement is worth.",
        ],
        widget: {
          id: "reward-risk-playground",
          caption:
            "Drag the target further from the entry and watch two things move together: what the trade pays if it works, and how rarely you can afford to be right. Then drag it in close and see the win rate you would have to keep up.",
        },
      },
      {
        heading: "Expectancy",
        paragraphs: [
          "Add up your R results and divide by the number of trades. That average is your expectancy — what you make, on average, per trade, measured in units of your own risk.",
          "Above zero means you have an edge. Below zero means you do not, and no amount of position sizing will rescue it.",
        ],
        table: {
          head: ["Record", "Expectancy", "Reading"],
          rows: [
            ["+1, +1, −1, −1", "0.00R", "Breakeven before costs, losing after them."],
            ["+3, −1, −1, −1", "0.00R", "Same. One big winner paid for three losses, no more."],
            ["+3, +3, −1, −1", "+1.00R", "A real edge. Every trade is worth 1R on average."],
            ["+1, −1, −1, −1", "−0.50R", "Losing. The winners are too small for the hit rate."],
          ],
        },
      },
      {
        paragraphs: [
          "Four trades make a tidy table and tell you nothing about what a hundred of them feel like. Set a win rate and a reward below, then let a run play out.",
        ],
        widget: {
          id: "expectancy-simulator",
          caption:
            "Set 40% and 2:1 — settings that make money — then press run again and again without changing a thing. The runs land far apart. The long losing stretches in them are where people quit a method that was working.",
        },
      },
      {
        heading: "Why being right is overrated",
        paragraphs: [
          "The win rate you need depends entirely on how big your winners are relative to your losers. This is the table that changes how people think about trading.",
        ],
        table: {
          head: ["Reward:risk", "Win rate needed to break even"],
          rows: [
            ["1:1", "50%"],
            ["2:1", "33%"],
            ["3:1", "25%"],
            ["5:1", "17%"],
          ],
        },
      },
      {
        callout: {
          tone: "note",
          text: "At 3:1 you can be wrong three times out of four and still make money. Traders who need to be right most of the time end up taking tiny profits and holding big losses — which is exactly the shape of a losing account.",
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    slug: "setups",
    number: 6,
    title: "Trading a setup, not a feeling",
    blurb: "What a setup is, why you need a written list of them, and when not to trade.",
    topic: "setups",
    minutes: 6,
    takeaway:
      "If you cannot name the setup before you click, you are not trading — you are reacting.",
    blocks: [
      {
        paragraphs: [
          "A setup is a specific, repeatable situation you have decided in advance is worth risking money on. It has conditions you can check, an entry, a place the stop goes, and a way it typically fails.",
          "The test is simple: could you describe it to another trader precisely enough that they would recognise the same situation tomorrow? If not, it is not a setup yet.",
        ],
      },
      {
        heading: "Reading a single candle",
        paragraphs: [
          "Before you can describe a situation precisely, you have to be able to read what is in front of you. Almost every chart a trader looks at is drawn as candles, and each one holds four numbers: where the period opened, where it closed, and the highest and lowest price reached in between. The thick part is the distance from open to close; the thin lines above and below are how far price got and could not stay.",
          "Take a minute with the chart below before going on.",
        ],
        widget: {
          id: "candle-anatomy",
          caption:
            "Pick a candle with a long thin line and almost no thick part. Price travelled a long way and gave it all back inside one period — a different story from a candle that closed right at its high, even when the two end up at a similar price.",
        },
      },
      {
        heading: "Why you need it written down",
        bullets: [
          "It tells you when not to trade, which is most of the time. A trader without a defined setup finds a reason to be in the market all day.",
          "It makes review possible. You cannot improve 'I thought it looked good', but you can absolutely improve 'my breakout trades work and my reversal trades do not'.",
          "It removes the decision from the moment of maximum pressure. You decided in advance, calmly.",
        ],
      },
      {
        heading: "Start with two, not ten",
        paragraphs: [
          "New traders collect setups the way people collect gym memberships. Pick two that suit your temperament and your schedule, and trade only those until you have fifty logged examples of each. Fifty is roughly where a pattern starts to be readable in your own numbers.",
        ],
      },
      {
        callout: {
          tone: "warn",
          text: "The hardest skill in this lesson is sitting on your hands. Most of a trading day contains nothing worth trading. The instinct to 'find something' because you are at your desk is the reason overtrading is the most common way new accounts bleed out.",
        },
      },
      {
        heading: "When to stand aside entirely",
        bullets: [
          "The first few minutes after the open, until a range has actually formed.",
          "Immediately before a scheduled news release, when spreads widen and stops become unreliable.",
          "When you have already hit your daily loss limit. That limit exists precisely for the moment you want to ignore it.",
          "When you are tired, angry, or trying to make back money. Those are not market conditions, but they cost more than any of them.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    slug: "journaling",
    number: 7,
    title: "Why process beats outcome",
    blurb: "The four kinds of trade, and why only one of them is genuinely dangerous.",
    topic: "journal",
    minutes: 5,
    takeaway:
      "Grade the decision, not the result. A bad trade that made money is the most expensive thing that can happen to you early on.",
    blocks: [
      {
        paragraphs: [
          "A trade has two independent results: whether you traded well, and whether you made money. They are not the same thing, and confusing them is the central mistake of every new trader.",
        ],
        table: {
          head: ["", "Made money", "Lost money"],
          rows: [
            [
              "Traded well",
              "The one to repeat. Note what you did and do it again.",
              "A normal loss. Nothing to fix. This is the cost of doing business.",
            ],
            [
              "Traded badly",
              "The dangerous one. The market just paid you for a habit that will not keep paying.",
              "The cheap one. The loss is small; the lesson is free.",
            ],
          ],
        },
      },
      {
        heading: "The dangerous box",
        paragraphs: [
          "Top right is where accounts are lost. You skip the stop, size up on a hunch, and it works. The market has just handed you a reward for exactly the behaviour that will eventually take everything, and it has done so at the moment you were most impressionable.",
          "Everyone who has traded for a while can tell you about the early winning trade that taught them something completely wrong. The only defence is to grade the decision at the time, before the result has a chance to rewrite your memory of it.",
        ],
      },
      {
        heading: "What to record, while it is fresh",
        bullets: [
          "The setup, named.",
          "Entry, stop, target and size — and the risk in both dollars and percent.",
          "One sentence on why, written before you entered.",
          "A screenshot of the chart as you saw it.",
          "Afterwards: what you would do differently, if anything.",
        ],
      },
      {
        callout: {
          tone: "note",
          text: "The screenshot matters more than people expect. In a month you will not remember what the tape looked like, and a journal of numbers without pictures is far harder to learn from. Take it before you enter, not after you know how it went.",
        },
      },
      {
        heading: "Reviewing",
        paragraphs: [
          "Once a week, read the last twenty trades and look for the repeated failure rather than the interesting one. If you have moved your stop four times, that is the thing to fix — not the clever exit you are still pleased about.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 8 */
  {
    slug: "psychology",
    number: 8,
    title: "Tilt, revenge and the rest of it",
    blurb: "The failure modes that have nothing to do with charts.",
    topic: "psychology",
    minutes: 6,
    takeaway:
      "Your worst trades will come from your emotional state, not your analysis. Build rules that take the decision away from you when it matters.",
    blocks: [
      {
        paragraphs: [
          "You can know every lesson on this site and still lose money, because the difficulty is not understanding what to do. It is doing it at 10:47am with real money moving against you.",
        ],
      },
      {
        heading: "Revenge trading",
        paragraphs: [
          "You take a loss. Within a minute or two you are back in, bigger, often in the same instrument, trying to get it back. The giveaway is the clock. A trade taken while a loss is still stinging is chosen by the sting rather than by your rules, and that is a different decision from the one you would have made an hour later.",
          "The fix is mechanical, not emotional. After a loss, stand up. Walk away from the screen for five minutes. Do not negotiate with yourself about it — make it a rule that does not require willpower in the moment.",
        ],
      },
      {
        heading: "Overtrading",
        paragraphs: [
          "A good day usually contains a handful of trades your setup actually produced. A bad one contains those plus a long tail of trades you went looking for. Boredom, not opportunity, is what produces the tail.",
          "Set a hard cap on trades per day before the session starts, and treat hitting it as the end of the day regardless of how you are doing.",
        ],
      },
      {
        heading: "FOMO",
        paragraphs: [
          "Something moves without you and you chase it, entering late with a stop that is now miles away or absurdly tight. The move you missed is gone. There will be another one tomorrow, and the cost of waiting is zero.",
        ],
      },
      {
        heading: "Moving the stop",
        paragraphs: [
          "Covered in the stops lesson, but it belongs here too, because it is not a technical error. It is an emotional one wearing a technical disguise. You move the stop because accepting the loss feels worse than risking a larger one.",
        ],
      },
      {
        callout: {
          tone: "warn",
          text: "Set a daily loss limit — say three losing trades, or 3% of the account — and stop for the day when you hit it. The day you most want to override that limit is the day it is doing its job.",
        },
      },
      {
        heading: "The useful question",
        paragraphs: [
          "Before any trade, ask: would I take this if I were flat, calm, and had not just lost money? If the honest answer is no, the trade is about your feelings rather than the market.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ 9 */
  {
    slug: "account-enders",
    number: 9,
    title: "The mistakes that end accounts",
    blurb: "Nine specific things, each of which has finished more beginners than any bad setup.",
    topic: "risk",
    minutes: 5,
    takeaway:
      "Almost nobody is finished off by a bad entry. They are finished off by size, by a missing stop, or by trying to get it back.",
    blocks: [
      {
        paragraphs: [
          "None of these are subtle. All of them are common, and each has ended more accounts than any amount of poor chart reading.",
        ],
        bullets: [
          "Trading without a stop. There is no size of position that makes this safe, and no amount of watching the screen that substitutes for it.",
          "Sizing up to make back a loss. The trade that is meant to fix everything is the one that finishes it.",
          "Moving a stop away from price. A planned 1% loss becomes an unplanned 6% one.",
          "Averaging down into a loser. Adding to a position that is wrong makes you more wrong, more expensively.",
          "Risking 5% or 10% per trade. Six ordinary losses in a row then takes a quarter to half your account.",
          "Trading money you need. The pressure guarantees bad decisions at exactly the wrong moments.",
          "Trading every day regardless of conditions. Some weeks contain nothing worth trading.",
          "Changing strategy after every loss. You will never accumulate enough data on anything to know whether it worked.",
          "Not keeping records. Without them you are not learning, you are just accumulating opinions.",
        ],
      },
      {
        callout: {
          tone: "warn",
          text: "If you recognise three or more of these in your own trading, the answer is not a better setup. Cut your size to something trivial, fix the habits, and let the results follow.",
        },
      },
      {
        heading: "A short list of rules worth having",
        bullets: [
          "Maximum 1% risk on any trade.",
          "Every trade has a stop, placed as an order, before or immediately at entry.",
          "Maximum three losing trades in a day, then stop.",
          "Five-minute break after any loss.",
          "No trade without a named setup and a written reason.",
          "Every trade logged the same day, with a screenshot.",
        ],
      },
      {
        paragraphs: [
          "None of those rules will make you money on their own. What they do is keep you in the game long enough for a genuine edge to show up — and make it possible to tell whether you have one.",
        ],
      },
    ],
  },
];

export function lessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function lessonNeighbours(slug: string): {
  prev?: Lesson;
  next?: Lesson;
} {
  const i = LESSONS.findIndex((l) => l.slug === slug);
  if (i === -1) return {};
  return { prev: LESSONS[i - 1], next: LESSONS[i + 1] };
}

export const TOPIC_LABELS: Record<string, string> = {
  risk: "Risk",
  sizing: "Position sizing",
  stops: "Stops",
  measuring: "Measuring results",
  setups: "Setups",
  journal: "Journaling",
  psychology: "Psychology",
};
