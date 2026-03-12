"use client";

import { useState } from "react";
import type { BossEntry } from "@/lib/bossData";
import { formatNumber } from "@/lib/format";

interface Props {
  bosses: BossEntry[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-400/10",
  Normal: "text-blue-400 bg-blue-400/10",
  Hard: "text-amber-400 bg-amber-400/10",
  Chaos: "text-red-400 bg-red-400/10",
  Extreme: "text-purple-400 bg-purple-400/10",
};

function BossRow({ boss }: { boss: BossEntry }) {
  const [open, setOpen] = useState(false);
  const diffColor = DIFFICULTY_COLORS[boss.difficulty] ?? "text-[var(--color-muted)] bg-[var(--color-elevated)]";

  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      {/* Row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-elevated)]"
      >
        <img
          src={boss.image}
          alt={boss.name}
          className="h-10 w-10 rounded-lg object-contain bg-[var(--color-elevated)]"
        />
        <div className="flex flex-1 items-center gap-3 text-left">
          <span className="font-medium text-[var(--color-foreground)]">{boss.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${diffColor}`}>
            {boss.difficulty}
          </span>
        </div>
        <span className="font-mono text-sm text-[var(--color-muted)]">
          {formatNumber(boss.hp)}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-[var(--color-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
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
            <div className="rounded-lg bg-[var(--color-elevated)] px-3 py-2 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Min AF</div>
              <div className="font-mono text-sm font-semibold">
                {boss.arcaneForce ?? <span className="text-[var(--color-muted)]">—</span>}
              </div>
            </div>
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
                      {tier.fdMultiplier === 1 ? "base" : `+${((tier.fdMultiplier - 1) * 100).toFixed(0)}% FD`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* P3 DPS Race */}
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
      )}
    </div>
  );
}

export default function BossAccordion({ bosses }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      {bosses.map((boss) => (
        <BossRow key={boss.id} boss={boss} />
      ))}
    </div>
  );
}
