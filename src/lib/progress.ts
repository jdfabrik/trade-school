/**
 * Quiz progress, stored in this browser only.
 *
 * Every read and write is wrapped, because localStorage throws in private
 * windows and when site data is blocked. A learner with storage disabled should
 * still be able to take a quiz — they just will not get a weak-spot list.
 */

const KEY = "ats:progress:v1";

export interface QuestionRecord {
  attempts: number;
  correct: number;
  /** ISO date of the last attempt. */
  last: string;
}

export type Progress = Record<string, QuestionRecord>;

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Progress) : {};
  } catch {
    return {};
  }
}

function save(progress: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* nothing useful to do — the quiz still works, it just will not persist */
  }
}

export function recordAnswer(id: string, correct: boolean): Progress {
  const progress = loadProgress();
  const prior = progress[id] ?? { attempts: 0, correct: 0, last: "" };
  progress[id] = {
    attempts: prior.attempts + 1,
    correct: prior.correct + (correct ? 1 : 0),
    last: new Date().toISOString().slice(0, 10),
  };
  save(progress);
  return progress;
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Fraction of attempts answered correctly, or null if never attempted. */
export function accuracy(record?: QuestionRecord): number | null {
  if (!record || record.attempts === 0) return null;
  return record.correct / record.attempts;
}

/**
 * Weakest first: anything answered wrong at least once, ordered by how often it
 * has been missed. Questions never attempted are not "weak", they are unseen.
 */
export function weakest(progress: Progress, limit = 50): string[] {
  return Object.entries(progress)
    .map(([id, r]) => ({ id, missed: r.attempts - r.correct, attempts: r.attempts }))
    .filter((x) => x.missed > 0)
    .sort((a, b) => b.missed - a.missed || b.attempts - a.attempts)
    .slice(0, limit)
    .map((x) => x.id);
}

export function summarise(progress: Progress) {
  const records = Object.values(progress);
  const attempts = records.reduce((n, r) => n + r.attempts, 0);
  const correct = records.reduce((n, r) => n + r.correct, 0);
  return {
    seen: records.length,
    attempts,
    correct,
    rate: attempts === 0 ? null : correct / attempts,
  };
}
