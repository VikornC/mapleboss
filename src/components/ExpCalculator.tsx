"use client";

import { useState } from "react";
import { calcExpNeeded, EXP_TABLE, MAX_LEVEL } from "@/lib/expData";
import { formatNumber } from "@/lib/format";

export default function ExpCalculator() {
  const [currentLevel, setCurrentLevel] = useState<number>(200);
  const [currentPct, setCurrentPct] = useState<number>(0);
  const [targetLevel, setTargetLevel] = useState<number>(210);

  const validCurrent = currentLevel >= 1 && currentLevel <= MAX_LEVEL - 1;
  const validTarget = targetLevel > currentLevel && targetLevel <= MAX_LEVEL;
  const validPct = currentPct >= 0 && currentPct < 100;
  const isValid = validCurrent && validTarget && validPct;

  const expNeeded = isValid ? calcExpNeeded(currentLevel, currentPct, targetLevel) : null;
  const currentLevelTotal = EXP_TABLE[currentLevel] ?? 0;
  const currentExpSoFar = isValid ? Math.floor(currentLevelTotal * (currentPct / 100)) : null;

  return (
    <div className="mx-auto max-w-lg">
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

        {/* EXP % */}
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
      </div>

      {/* Result */}
      {isValid && expNeeded !== null && (
        <div className="mt-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-6 text-center">
          <div className="mb-1 text-xs text-[var(--color-muted)]">
            Level {currentLevel} ({currentPct}%) → Level {targetLevel}
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
            {formatNumber(expNeeded)}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">EXP needed</div>
        </div>
      )}
    </div>
  );
}
