"use client";

import { useState } from "react";
import { calcExpNeeded, EXP_TABLE, MAX_LEVEL } from "@/lib/expData";
import { formatNumber, parseNumberInput } from "@/lib/format";

export default function ExpCalculator() {
  const [currentLevel, setCurrentLevel] = useState<number>(200);
  const [currentPct, setCurrentPct] = useState<number>(0);
  const [targetLevel, setTargetLevel] = useState<number>(210);
  const [dailyExpInput, setDailyExpInput] = useState<string>("");

  const validCurrent = currentLevel >= 1 && currentLevel <= MAX_LEVEL - 1;
  const validTarget = targetLevel > currentLevel && targetLevel <= MAX_LEVEL;
  const validPct = currentPct >= 0 && currentPct < 100;
  const isValid = validCurrent && validTarget && validPct;

  const dailyExp = parseNumberInput(dailyExpInput);
  const currentLevelTotal = EXP_TABLE[currentLevel] ?? 0;
  const currentExpSoFar = isValid ? Math.floor(currentLevelTotal * (currentPct / 100)) : null;
  const expNeeded = isValid ? calcExpNeeded(currentLevel, currentPct, targetLevel) : null;

  const pctPerDay =
    dailyExp && dailyExp > 0 && currentLevelTotal > 0
      ? (dailyExp / currentLevelTotal) * 100
      : null;

  const daysToTarget =
    dailyExp && dailyExp > 0 && expNeeded !== null && expNeeded > 0
      ? expNeeded / dailyExp
      : null;

  const eta =
    daysToTarget !== null
      ? new Date(Date.now() + daysToTarget * 86400_000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Input card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Current Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              Current Level
            </label>
            <input
              type="number"
              min={1}
              max={MAX_LEVEL - 1}
              value={currentLevel}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setCurrentLevel(v);
                if (v >= targetLevel) setTargetLevel(Math.min(v + 1, MAX_LEVEL));
              }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Target Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              Target Level
            </label>
            <input
              type="number"
              min={currentLevel + 1}
              max={MAX_LEVEL}
              value={targetLevel}
              onChange={(e) => setTargetLevel(parseInt(e.target.value))}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* EXP % slider */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              Current EXP %
            </label>
            <span className="text-xs tabular-nums text-[var(--color-foreground)]">
              {currentPct}%
              {currentExpSoFar !== null && currentLevelTotal > 0 && (
                <span className="ml-1.5 text-[var(--color-muted)]">
                  ({formatNumber(currentExpSoFar)} / {formatNumber(currentLevelTotal)})
                </span>
              )}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={99}
            value={currentPct}
            onChange={(e) => setCurrentPct(parseInt(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        {/* Daily EXP */}
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-muted)]">
            Daily EXP Gain
          </label>
          <input
            type="text"
            placeholder="e.g. 500M, 1.2B, 3T"
            value={dailyExpInput}
            onChange={(e) => setDailyExpInput(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]"
          />
          {dailyExpInput && !dailyExp && (
            <span className="text-[11px] text-red-400">Invalid format</span>
          )}
          {dailyExp && (
            <span className="text-[11px] text-[var(--color-muted)]">
              = {formatNumber(dailyExp)} EXP/day
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {isValid && (
        <div className="grid grid-cols-2 gap-4">
          {/* % per day */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
            <div className="text-[11px] text-[var(--color-muted)]">% per day</div>
            <div className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
              {pctPerDay !== null ? `${pctPerDay.toFixed(2)}%` : "—"}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
              at Lv {currentLevel}
            </div>
          </div>

          {/* Days to target */}
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4 text-center">
            <div className="text-[11px] text-[var(--color-muted)]">
              days to Lv {targetLevel}
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
              {daysToTarget !== null ? Math.ceil(daysToTarget) : "—"}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
              {eta ? `ETA ${eta}` : "enter daily EXP"}
            </div>
          </div>
        </div>
      )}

      {/* EXP needed breakdown */}
      {isValid && expNeeded !== null && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-muted)]">
              Lv {currentLevel} ({currentPct}%) → Lv {targetLevel}
            </span>
            <span className="font-semibold tabular-nums text-[var(--color-foreground)]">
              {formatNumber(expNeeded)} EXP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
