"use client";

import type { BattleResult, BurstCheckResult } from "@/lib/calculator";
import type { BossEntry } from "@/lib/bossData";
import { formatNumber, formatTime } from "@/lib/format";
import BossInfoCard from "./BossInfoCard";

interface Props {
  result: BattleResult;
  boss: BossEntry;
  burstResult: BurstCheckResult | null;
  partySize: number;
}

export default function CalculatorResults({
  result,
  boss,
  burstResult,
  partySize,
}: Props) {
  const timePercent = Math.min(
    (result.estimatedClearTime / boss.timeLimitSeconds) * 100,
    150
  );
  const timeBarColor =
    timePercent <= 70
      ? "bg-emerald-500"
      : timePercent <= 90
        ? "bg-amber-500"
        : "bg-red-500";

  // Calculate "need Nx more" multiplier for cannot-clear scenario
  const playerDPM = result.effectivePlayerDPM;
  const needMultiplier =
    playerDPM > 0 ? result.requiredDPMPerMember / playerDPM : Infinity;

  return (
    <div className="space-y-4">
      {/* Primary Result */}
      <div
        className={`rounded-xl border p-5 ${
          result.canClear
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
              result.canClear
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-red-500/20 text-red-500"
            }`}
          >
            {result.canClear ? "\u2713" : "\u2717"}
          </div>
          <div>
            <div
              className={`text-lg font-bold ${
                result.canClear ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {result.canClear ? "CAN CLEAR" : "CANNOT CLEAR"}
            </div>
            <div className="font-mono text-sm text-[var(--color-secondary)]">
              {result.canClear
                ? `Clear in ${formatTime(result.estimatedClearTime)}`
                : isFinite(needMultiplier)
                  ? `Est. ${formatTime(result.estimatedClearTime)} — Need ${needMultiplier.toFixed(1)}x more FD`
                  : "Need more damage"}
            </div>
          </div>
        </div>

        {/* Time Progress Bar */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-mono text-[var(--color-secondary)]">
              {formatTime(
                Math.min(result.estimatedClearTime, boss.timeLimitSeconds)
              )}
            </span>
            <span className="font-mono text-[var(--color-muted)]">
              {formatTime(boss.timeLimitSeconds)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--color-elevated)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${timeBarColor}`}
              style={{ width: `${Math.min(timePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* P3 Burst Check */}
      {burstResult && boss.burstCheck && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-purple-300">
                {boss.burstCheck.label}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Burn {formatNumber(boss.burstCheck.hp)} HP in {boss.burstCheck.timeSeconds}s
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                burstResult.canBurst
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {burstResult.canBurst ? "PASS" : "FAIL"}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">Your burst damage</span>
              <span className="font-mono font-medium">
                {formatNumber(burstResult.yourDamageInWindow)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">{partySize === 1 ? "Required (solo)" : "Required per member"}</span>
              <span className="font-mono font-medium">
                {formatNumber(burstResult.requiredPerMember)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">Your P3 contribution</span>
              <span className={`font-mono font-medium ${
                burstResult.canBurst ? "text-emerald-400" : "text-red-400"
              }`}>
                {((burstResult.yourDamageInWindow / boss.burstCheck.hp) * 100).toFixed(1)}% of P3 HP
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">Party total</span>
              <span className={`font-mono font-medium ${burstResult.canBurst ? "text-emerald-400" : "text-red-400"}`}>
                {formatNumber(burstResult.partyBurstDamage)} / {formatNumber(boss.burstCheck.hp)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Required DPM */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Required DPM
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-secondary)]">Est. Clear Time</span>
            <span className={`font-mono font-medium ${result.canClear ? "text-emerald-500" : "text-red-500"}`}>
              {isFinite(result.estimatedClearTime)
                ? formatTime(result.estimatedClearTime)
                : "N/A"}
              {isFinite(result.estimatedClearTime) && (
                <span className="ml-1 text-xs text-[var(--color-muted)]">
                  / {formatTime(boss.timeLimitSeconds)}
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-secondary)]">{partySize === 1 ? "Required (solo)" : "Required per member"}</span>
            <span className="font-mono font-medium">
              {formatNumber(result.requiredDPMPerMember)}/min
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-secondary)]">Your DPM</span>
            <span className={`font-mono font-medium ${result.dpmGap === 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatNumber(playerDPM)}/min
            </span>
          </div>
          {result.dpmGap > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">FD Gap</span>
              <span className="font-mono font-medium text-red-500">
                +{((needMultiplier - 1) * 100).toFixed(0)}% FD needed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Boss Info */}
      <BossInfoCard boss={boss} />
    </div>
  );
}
