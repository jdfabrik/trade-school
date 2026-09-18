"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { WidgetId } from "@/content/types";

/**
 * One place that knows which interactive piece belongs to which name.
 *
 * A lesson says `widget: { id: "moving-stop" }` and nothing more. That keeps the
 * teaching content readable as writing rather than as wiring, and it means a
 * widget can be rebuilt or renamed without anybody having to go and edit nine
 * lessons.
 *
 * Each one is fetched only when a page that uses it is opened, and drawn only in
 * the reader's browser. None of these have anything to say until somebody moves
 * a slider, so there is no reason to make every visitor download all seven up
 * front — the lesson text should be on screen immediately, and the chart can
 * arrive a moment later.
 */

function WidgetSkeleton() {
  return (
    <div className="card p-5 sm:p-6" aria-hidden>
      <div className="h-5 w-48 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-5 h-40 animate-pulse rounded-xl bg-surface-2 sm:h-56" />
    </div>
  );
}

const loading = () => <WidgetSkeleton />;

const CandleAnatomy = dynamic(() => import("./CandleAnatomy"), {
  ssr: false,
  loading,
});
const SizingPlayground = dynamic(() => import("./SizingPlayground"), {
  ssr: false,
  loading,
});
const RewardRiskPlayground = dynamic(() => import("./RewardRiskPlayground"), {
  ssr: false,
  loading,
});
const StopNoise = dynamic(() => import("./StopNoise"), { ssr: false, loading });
const MovingStop = dynamic(() => import("./MovingStop"), { ssr: false, loading });
const ExpectancySimulator = dynamic(() => import("./ExpectancySimulator"), {
  ssr: false,
  loading,
});
const StreakSimulator = dynamic(() => import("./StreakSimulator"), {
  ssr: false,
  loading,
});

/*
 * Partial on purpose. A name that has no chart behind it yet leaves the lesson
 * reading exactly as it did before, rather than taking the page down with it.
 */
const WIDGETS: Partial<Record<WidgetId, ComponentType>> = {
  "candle-anatomy": CandleAnatomy,
  "sizing-playground": SizingPlayground,
  "reward-risk-playground": RewardRiskPlayground,
  "stop-noise": StopNoise,
  "moving-stop": MovingStop,
  "expectancy-simulator": ExpectancySimulator,
  "streak-simulator": StreakSimulator,
};

export default function LessonWidget({
  id,
  caption,
}: {
  id: WidgetId;
  caption?: string;
}) {
  const Widget = WIDGETS[id];
  if (!Widget) return null;

  return (
    <figure className="my-6 rounded-2xl border border-border bg-surface-2 p-1.5 sm:p-3">
      <p className="px-2.5 pb-2 pt-1 font-mono text-[11px] uppercase tracking-widest text-accent">
        Interactive
      </p>

      <Widget />

      <noscript>
        <p className="card p-5 text-sm text-muted">
          This part of the lesson is something you move and watch, so it needs a
          browser with scripting turned on. Everything the lesson teaches is written
          out above and below it.
        </p>
      </noscript>

      {caption && (
        <figcaption className="px-2.5 pb-1 pt-3 text-sm leading-6 text-muted">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Try this ·{" "}
          </span>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
