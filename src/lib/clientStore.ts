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

/* ---------------------------------- theme --------------------------------- */

export type Theme = "light" | "dark" | null;

const THEME_KEY = "ats:theme";
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
 * Runs before first paint, from a script tag in the document head, so a reader
 * who chose light mode never sees a flash of dark.
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
