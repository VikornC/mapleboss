"use client";

import type { BossEntry } from "@/lib/bossData";
import { formatNumber, formatTime } from "@/lib/format";

interface Props {
  boss: BossEntry;
}

export default function BossInfoCard({ boss }: Props) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center gap-3">
        <img src={boss.image} alt={boss.name} className="h-10 w-10 object-contain" />
        <div>
          <h3 className="text-sm font-semibold">
            {boss.name} — {boss.difficulty}
          </h3>
          <p className="text-xs text-[var(--color-muted)]">Boss Info</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-[var(--color-muted)]">Lv. </span>
          <span className="font-mono">{boss.level}</span>
        </div>
        {boss.arcaneForce && (
          <div>
            <span className="text-[var(--color-muted)]">AF: </span>
            <span className="font-mono">{boss.arcaneForce}</span>
          </div>
        )}
        <div>
          <span className="text-[var(--color-muted)]">HP: </span>
          <span className="font-mono">
            {formatNumber(boss.hp)}
            {boss.burstCheck && (
              <span className="text-[var(--color-muted)]">
                {" "}({formatNumber(boss.hp - boss.burstCheck.hp)} P1+P2, +{formatNumber(boss.burstCheck.hp)} P3)
              </span>
            )}
          </span>
        </div>
        <div>
          <span className="text-[var(--color-muted)]">Time: </span>
          <span className="font-mono">
            {formatTime(boss.timeLimitSeconds)}
          </span>
        </div>
      </div>
      {boss.afTiers && boss.afTiers.length > 0 && (
        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <span className="text-xs font-medium text-[var(--color-muted)]">AF Tiers</span>
          <div className="mt-1.5 flex gap-2">
            {boss.afTiers.map((tier) => (
              <div
                key={tier.af}
                className="flex-1 rounded-lg bg-[var(--color-elevated)] px-2 py-1.5 text-center"
              >
                <div className="font-mono text-xs font-medium">{tier.af}</div>
                <div className={`font-mono text-[10px] ${tier.fdMultiplier > 1 ? "text-emerald-500" : "text-[var(--color-muted)]"}`}>
                  {tier.fdMultiplier === 1 ? "100%" : `${(tier.fdMultiplier * 100).toFixed(0)}% FD`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {boss.note && (
        <p className="mt-2 text-xs text-amber-500/80">
          * {boss.note}
        </p>
      )}
    </div>
  );
}
