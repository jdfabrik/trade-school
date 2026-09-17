"use client";

import { useSyncExternalStore } from "react";
import { rulesStore } from "@/lib/clientStore";
import {
  DEFAULT_RULES,
  RISK_MAX,
  RISK_MIN,
  RR_MAX,
  RR_MIN,
  rulesWarning,
} from "@/lib/rules";
import { Callout } from "@/components/ui";

export default function Settings() {
  const rules = useSyncExternalStore(
    rulesStore.subscribe,
    rulesStore.snapshot,
    rulesStore.serverSnapshot,
  );
  const warning = rulesWarning(rules);
  const atDefaults =
    rules.maxRiskPct === DEFAULT_RULES.maxRiskPct && rules.minRR === DEFAULT_RULES.minRR;

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-display text-lg font-semibold">
          Most you will risk on one trade
        </h2>
        <p className="mt-1 text-sm text-muted">
          As a share of your whole account. This decides your position size, and
          it is the single number that determines whether a bad run is an
          annoyance or the end of your account.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={RISK_MIN}
            max={RISK_MAX}
            step={0.1}
            value={rules.maxRiskPct}
            onChange={(e) =>
              rulesStore.set({ ...rules, maxRiskPct: Number(e.target.value) })
            }
            aria-label="Most you will risk on one trade, as a percentage"
            className="flex-1"
          />
          <span className="tabular w-20 text-right font-mono text-xl text-accent">
            {rules.maxRiskPct}%
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          On a $25,000 account that is {" "}
          <strong className="tabular text-fg">
            ${((25000 * rules.maxRiskPct) / 100).toFixed(0)}
          </strong>{" "}
          a trade. Ten losses in a row would cost about{" "}
          <strong className="tabular text-fg">
            {Math.round((1 - Math.pow(1 - rules.maxRiskPct / 100, 10)) * 100)}%
          </strong>{" "}
          of the account.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="font-display text-lg font-semibold">
          Smallest reward worth taking
        </h2>
        <p className="mt-1 text-sm text-muted">
          How far your target must be compared with your stop. The higher this
          is, the less often you need to be right.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={RR_MIN}
            max={RR_MAX}
            step={0.25}
            value={rules.minRR}
            onChange={(e) => rulesStore.set({ ...rules, minRR: Number(e.target.value) })}
            aria-label="Smallest reward to risk ratio worth taking"
            className="flex-1"
          />
          <span className="tabular w-20 text-right font-mono text-xl text-accent">
            {rules.minRR} : 1
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          At {rules.minRR} to 1 you need to win about{" "}
          <strong className="tabular text-fg">
            {Math.round((1 / (1 + rules.minRR)) * 100)}%
          </strong>{" "}
          of your trades just to break even, before costs.
        </p>
      </section>

      {warning && <Callout tone="warn">{warning}</Callout>}

      {!atDefaults && (
        <button
          type="button"
          onClick={() => rulesStore.reset()}
          className="rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent"
        >
          Put them back to 1% and 2 to 1
        </button>
      )}
    </div>
  );
}
