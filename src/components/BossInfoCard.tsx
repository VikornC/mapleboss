"use client";

import type { BossEntry } from "@/lib/bossData";
import { formatNumber } from "@/lib/format";

interface Props {
  boss: BossEntry;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-400/10",
  Normal: "text-blue-400 bg-blue-400/10",
  Hard: "text-amber-400 bg-amber-400/10",
  Chaos: "text-red-400 bg-red-400/10",
  Extreme: "text-purple-400 bg-purple-400/10",
};

export default function BossInfoCard({ boss }: Props) {
  const diffColor = DIFFICULTY_COLORS[boss.difficulty] ?? "text-[var(--color-muted)] bg-[var(--color-elevated)]";

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <img src={boss.image} alt={boss.name} className="h-12 w-12 object-contain" />
        <div className="flex-1">
          <h3 className="text-base font-semibold">{boss.name}</h3>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${diffColor}`}>
            {boss.difficulty}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[var(--color-elevated)] px-3 py-2 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Level</div>
          <div className="font-mono text-sm font-semibold">{boss.level}</div>
        </div>
        <div className="rounded-lg bg-[var(--color-elevated)] px-3 py-2 text-center">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Defense</div>
          <div className="font-mono text-sm font-semibold">{boss.defense ?? "—"}</div>
        </div>
        {boss.arcaneForce ? (
          <div className="rounded-lg bg-[var(--color-elevated)] px-3 py-2 text-center">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Min AF</div>
            <div className="font-mono text-sm font-semibold">{boss.arcaneForce}</div>
          </div>
        ) : (
          <div className="rounded-lg bg-[var(--color-elevated)] px-3 py-2 text-center">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">AF</div>
            <div className="font-mono text-sm font-semibold text-[var(--color-muted)]">—</div>
          </div>
        )}
      </div>

      {/* HP */}
      <div className="mb-3 rounded-lg bg-[var(--color-elevated)] px-3 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Total HP</div>
        <div className="font-mono text-sm font-semibold">
          {formatNumber(boss.hp)}
          {boss.burstCheck && (
            <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
              ({formatNumber(boss.hp - boss.burstCheck.hp)} P1+P2 · {formatNumber(boss.burstCheck.hp)} P3)
            </span>
          )}
        </div>
      </div>

      {/* AF Tiers */}
      {boss.afTiers && boss.afTiers.length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">AF Tiers</div>
          <div className="flex gap-2">
            {boss.afTiers.map((tier) => (
              <div
                key={tier.af}
                className="flex-1 rounded-lg bg-[var(--color-elevated)] px-2 py-1.5 text-center"
              >
                <div className="font-mono text-xs font-medium">{tier.af}</div>
                <div className={`font-mono text-[10px] ${tier.fdMultiplier > 1 ? "text-emerald-500" : "text-[var(--color-muted)]"}`}>
                  {tier.fdMultiplier === 1 ? "100%" : `+${((tier.fdMultiplier - 1) * 100).toFixed(0)}% FD`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Burst check badge */}
      {boss.burstCheck && (
        <div className="mb-3 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-purple-400">P3 DPS Race</div>
          <div className="text-xs text-[var(--color-secondary)]">
            Burn {formatNumber(boss.burstCheck.hp)} HP in {boss.burstCheck.timeSeconds}s
          </div>
        </div>
      )}

      {boss.note && (
        <p className="text-xs text-amber-500/80">* {boss.note}</p>
      )}
    </div>
  );
}
