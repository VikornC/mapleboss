"use client";

import type { BattleResult, BurstCheckResult } from "@/lib/calculator";
import type { BossEntry } from "@/lib/bossData";
import { formatNumber, formatTime } from "@/lib/format";
import BossInfoCard from "./BossInfoCard";

interface Props {
  result: BattleResult;
  boss: BossEntry;
  burstResult: BurstCheckResult | null;
}

export default function CalculatorResults({
  result,
  boss,
  burstResult,
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

  const contributionDiff = result.hpPercentSolo - result.fairSharePercent;
  const contributionStatus =
    contributionDiff > 1
      ? { label: "Carrying", color: "text-emerald-500", sign: "+" }
      : contributionDiff < -1
        ? { label: "Being carried", color: "text-red-500", sign: "" }
        : {
            label: "Even split",
            color: "text-[var(--color-secondary)]",
            sign: "",
          };

  // Calculate "need Nx more" multiplier for cannot-clear scenario
  const playerDPM = result.requiredDPMPerMember - result.dpmGap;
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

      {/* Burst Check — only for bosses with a burst phase */}
      {burstResult && boss.burstCheck && (
        <div
          className={`rounded-xl border p-4 ${
            burstResult.canBurst
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                burstResult.canBurst
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {burstResult.canBurst ? "\u2713" : "\u2717"}
            </span>
            <h3 className="text-sm font-semibold">
              {boss.burstCheck.label}
            </h3>
            <span className="ml-auto font-mono text-xs text-[var(--color-muted)]">
              {formatNumber(boss.burstCheck.hp)} in{" "}
              {boss.burstCheck.timeSeconds}s
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">
                Required / Member
              </span>
              <span className="font-mono font-medium">
                {formatNumber(burstResult.requiredPerMember)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">
                Your Burst Damage
              </span>
              <span className="font-mono font-medium">
                {formatNumber(burstResult.yourDamageInWindow)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-secondary)]">
                {burstResult.surplus >= 0 ? "Surplus" : "Deficit"}
              </span>
              <span
                className={`font-mono font-medium ${
                  burstResult.surplus >= 0
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {burstResult.surplus >= 0 ? "+" : ""}
                {formatNumber(burstResult.surplus)}
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
            <span className="text-[var(--color-secondary)]">Per Member</span>
            <span className="font-mono font-medium">
              {formatNumber(result.requiredDPMPerMember)}/min
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-secondary)]">Your DPM</span>
            <span className="flex items-center gap-2 font-mono font-medium">
              {formatNumber(playerDPM)}/min
              {result.dpmGap === 0 ? (
                <span className="text-xs text-emerald-500">ahead</span>
              ) : (
                <span className="text-xs text-red-500">behind</span>
              )}
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

      {/* Your Contribution */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Your Contribution
          </h3>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
              contributionDiff > 1
                ? "bg-emerald-500/15 text-emerald-500"
                : contributionDiff < -1
                  ? "bg-red-500/15 text-red-500"
                  : "bg-zinc-500/15 text-zinc-400"
            }`}
          >
            {contributionStatus.label}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-secondary)]">Total Damage</span>
            <span className="font-mono font-medium">
              {formatNumber(result.damageContribution)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-secondary)]">Your Share</span>
            <span className="font-mono font-medium">
              {result.hpPercentSolo.toFixed(1)}%
              <span className="ml-1 text-xs text-[var(--color-muted)]">
                / {result.fairSharePercent.toFixed(0)}% fair
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Boss Info */}
      <BossInfoCard boss={boss} />
    </div>
  );
}
