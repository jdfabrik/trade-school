/**
 * Minimal external stores for the two pieces of state that live in the browser
 * rather than in React: the theme and the quiz progress.
 *
 * These exist so components can read localStorage through `useSyncExternalStore`
 * instead of setting state inside an effect. That is not just lint appeasement —
 * it is the difference between rendering once with the right value and rendering
 * twice with a flash of the wrong one.
 */
import { loadProgress, recordAnswer, clearProgress, type Progress } from "./progress";
import { loadTrades } from "./journal";
import { loadRules, saveRules, DEFAULT_RULES, type TradingRules } from "./rules";
import type { Trade } from "./trade";

/* ---------------------------------- theme --------------------------------- */

export type Theme = "light" | "dark" | null;

const THEME_KEY = "ts:theme";
let themeListeners: (() => void)[] = [];

function emitTheme() {
  for (const l of themeListeners) l();
}

export const themeStore = {
  subscribe(listener: () => void) {
    themeListeners.push(listener);
    return () => {
      themeListeners = themeListeners.filter((l) => l !== listener);
    };
  },

  /** Read from the DOM, which the inline boot script has already populated. */
  snapshot(): Theme {
    if (typeof document === "undefined") return null;
    const value = document.documentElement.dataset.theme;
    return value === "light" || value === "dark" ? value : null;
  },

  /** Nothing is known about the browser's preference on the server. */
  serverSnapshot(): Theme {
    return null;
  },

  toggle() {
    const current =
      themeStore.snapshot() ??
      (typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    const next: Exclude<Theme, null> = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — the toggle still works for this page view */
    }
    emitTheme();
  },
};

/**
 * Runs before first paint, from a plain inline script that the root layout puts
 * first in the body, so a reader who chose light mode never sees a flash of
 * dark. It must stay a raw `<script>`: a `beforeInteractive` next/script is not
 * inlined by a static export, and {@link themeStore.snapshot} reads the
 * attribute this sets.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/* --------------------------------- progress -------------------------------- */

let progressListeners: (() => void)[] = [];
let cached: Progress | null = null;
const EMPTY: Progress = {};

function emitProgress() {
  for (const l of progressListeners) l();
}

export const progressStore = {
  subscribe(listener: () => void) {
    progressListeners.push(listener);
    return () => {
      progressListeners = progressListeners.filter((l) => l !== listener);
    };
  },

  /**
   * Must return a stable reference between changes, or useSyncExternalStore
   * re-renders forever. Hence the cache.
   */
  snapshot(): Progress {
    if (cached === null) cached = loadProgress();
    return cached;
  },

  serverSnapshot(): Progress {
    return EMPTY;
  },

  record(id: string, correct: boolean) {
    cached = recordAnswer(id, correct);
    emitProgress();
  },

  reset() {
    clearProgress();
    cached = {};
    emitProgress();
  },
};

/* --------------------------------- journal --------------------------------- */

let journalListeners: (() => void)[] = [];
let cachedTrades: Trade[] | null = null;
const NO_TRADES: Trade[] = [];

function emitJournal() {
  for (const l of journalListeners) l();
}

export const journalStore = {
  subscribe(listener: () => void) {
    journalListeners.push(listener);
    return () => {
      journalListeners = journalListeners.filter((l) => l !== listener);
    };
  },

  /** Stable reference between changes, or useSyncExternalStore loops forever. */
  snapshot(): Trade[] {
    if (cachedTrades === null) cachedTrades = loadTrades();
    return cachedTrades;
  },

  serverSnapshot(): Trade[] {
    return NO_TRADES;
  },

  /** Call after any write through the journal module. */
  refresh(next: Trade[]) {
    cachedTrades = next;
    emitJournal();
  },
};

/* ---------------------------------- rules ---------------------------------- */

let rulesListeners: (() => void)[] = [];
let cachedRules: TradingRules | null = null;

function emitRules() {
  for (const l of rulesListeners) l();
}

export const rulesStore = {
  subscribe(listener: () => void) {
    rulesListeners.push(listener);
    return () => {
      rulesListeners = rulesListeners.filter((l) => l !== listener);
    };
  },

  /** Stable reference between changes, as useSyncExternalStore requires. */
  snapshot(): TradingRules {
    if (cachedRules === null) cachedRules = loadRules();
    return cachedRules;
  },

  serverSnapshot(): TradingRules {
    return DEFAULT_RULES;
  },

  set(next: TradingRules) {
    cachedRules = saveRules(next);
    emitRules();
  },

  reset() {
    cachedRules = saveRules(DEFAULT_RULES);
    emitRules();
  },
};
