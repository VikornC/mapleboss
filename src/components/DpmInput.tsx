"use client";

import { useState } from "react";
import { formatNumber, parseNumberInput } from "@/lib/format";

interface Props {
  totalDamage: number | null;
  burstMinutes: number;
  onDamageChange: (damage: number | null) => void;
  onBurstChange: (minutes: number) => void;
}

const BURST_OPTIONS = [1, 2, 3];

export default function DpmInput({
  totalDamage,
  burstMinutes,
  onDamageChange,
  onBurstChange,
}: Props) {
  const [text, setText] = useState(
    totalDamage ? formatNumber(totalDamage) : ""
  );

  const dpm =
    totalDamage && totalDamage > 0 ? totalDamage / burstMinutes : null;

  function handleChange(raw: string) {
    setText(raw);
    const parsed = parseNumberInput(raw);
    onDamageChange(parsed);
  }

  function handleBlur() {
    if (totalDamage !== null && totalDamage > 0) {
      setText(formatNumber(totalDamage));
    }
  }

  return (
    <div className="space-y-3">
      {/* Burst Timer */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-secondary)]">
          Burst Timer
        </label>
        <div className="flex rounded-lg bg-[var(--color-elevated)] p-1">
          {BURST_OPTIONS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => onBurstChange(min)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                burstMinutes === min
                  ? "bg-[var(--color-accent)] font-medium text-zinc-950"
                  : "text-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      {/* Damage Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-secondary)]">
          Total Damage in {burstMinutes} min
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 50b, 1.2t"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-hover)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
          />
        </div>
        {dpm !== null && (
          <p className="font-mono text-xs text-[var(--color-accent)]">
            = {formatNumber(dpm)} DPM
          </p>
        )}
        <p className="text-xs text-[var(--color-muted)]">
          Supports shorthand: 1.2T, 50B, 500M
        </p>
      </div>
    </div>
  );
}
