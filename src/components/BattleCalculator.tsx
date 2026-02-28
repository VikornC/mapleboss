"use client";

import { useState } from "react";
import { BOSS_DATA, type BossEntry } from "@/lib/bossData";
import { calculateBattle, calculateBurstCheck } from "@/lib/calculator";
import type { BurstCheckResult } from "@/lib/calculator";
import { formatNumber, parseNumberInput } from "@/lib/format";
import BossSelector from "./BossSelector";
import PartySize from "./PartySize";
import DpmInput from "./DpmInput";
import UptimeSlider from "./UptimeSlider";
import PartyMembers from "./PartyMembers";
import CalculatorResults from "./CalculatorResults";
import BossInfoCard from "./BossInfoCard";

interface Props {
  initialBossId?: string | null;
}

export default function BattleCalculator({ initialBossId }: Props) {
  const [selectedBossId, setSelectedBossId] = useState<string | null>(
    initialBossId ?? null
  );
  const [partySize, setPartySize] = useState(1);
  const [totalDamage, setTotalDamage] = useState<number | null>(null);
  const [burstMinutes, setBurstMinutes] = useState(2);
  const [uptime, setUptime] = useState(85);
  const [burstDamage, setBurstDamage] = useState<number | null>(null);
  const [burstText, setBurstText] = useState("");
  const [memberDPMs, setMemberDPMs] = useState<(number | null)[]>(
    Array(5).fill(null)
  );

  const selectedBoss = BOSS_DATA.find((b) => b.id === selectedBossId) ?? null;

  // Update uptime when boss changes (use boss default)
  function handleBossSelect(boss: BossEntry) {
    setSelectedBossId(boss.id);
    setUptime(boss.defaultUptime);
  }

  function handleBurstTextChange(raw: string) {
    setBurstText(raw);
    setBurstDamage(parseNumberInput(raw));
  }

  function handleBurstBlur() {
    if (burstDamage && burstDamage > 0) {
      setBurstText(formatNumber(burstDamage));
    }
  }

  // Calculate average DPM from total damage and burst window
  const playerDPM =
    totalDamage && totalDamage > 0 ? totalDamage / burstMinutes : null;

  // Build party member DPMs array for the calculator
  // Only include filled-in members; empty slots default to playerDPM
  const otherCount = partySize - 1;
  const hasAnyCustomDPM = memberDPMs.slice(0, otherCount).some((d) => d !== null && d > 0);

  let partyMemberDPMs: number[] | undefined;
  if (hasAnyCustomDPM && playerDPM) {
    partyMemberDPMs = Array.from({ length: otherCount }, (_, i) =>
      memberDPMs[i] && memberDPMs[i]! > 0 ? memberDPMs[i]! : playerDPM
    );
  }

  const result =
    selectedBoss && playerDPM && playerDPM > 0
      ? calculateBattle({
          bossHP: selectedBoss.hp,
          timeLimitSeconds: selectedBoss.timeLimitSeconds,
          playerDPM,
          partySize,
          uptimePercent: uptime,
          partyMemberDPMs,
        })
      : null;

  // Burst check (only if boss has one and user entered burst damage)
  let burstResult: BurstCheckResult | null = null;
  if (selectedBoss?.burstCheck && burstDamage && burstDamage > 0) {
    burstResult = calculateBurstCheck({
      burstHP: selectedBoss.burstCheck.hp,
      burstTimeSeconds: selectedBoss.burstCheck.timeSeconds,
      playerBurstDamage: burstDamage,
      partySize,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      {/* Inputs Column */}
      <div className="space-y-5">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
          <h2 className="mb-5 text-lg font-semibold">Battle Setup</h2>
          <div className="space-y-5">
            <BossSelector
              selectedId={selectedBossId}
              onSelect={handleBossSelect}
            />
            <PartySize value={partySize} onChange={setPartySize} />
            <DpmInput
              totalDamage={totalDamage}
              burstMinutes={burstMinutes}
              onDamageChange={setTotalDamage}
              onBurstChange={setBurstMinutes}
            />
            {partySize > 1 && (
              <PartyMembers
                playerDPM={playerDPM}
                partySize={partySize}
                memberDPMs={memberDPMs}
                onMemberDPMsChange={setMemberDPMs}
              />
            )}
            <UptimeSlider value={uptime} onChange={setUptime} />
          </div>
        </div>

        {/* Burst Check Input — only for bosses with a burst phase */}
        {selectedBoss?.burstCheck && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 md:p-6">
            <h2 className="mb-1 text-sm font-semibold text-purple-400">
              {selectedBoss.burstCheck.label}
            </h2>
            <p className="mb-4 text-xs text-[var(--color-muted)]">
              Burn {formatNumber(selectedBoss.burstCheck.hp)} HP in{" "}
              {selectedBoss.burstCheck.timeSeconds}s — enter your burst damage
              in that window
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-secondary)]">
                Your {selectedBoss.burstCheck.timeSeconds}s Burst Damage
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 5t, 3.5t"
                value={burstText}
                onChange={(e) => handleBurstTextChange(e.target.value)}
                onBlur={handleBurstBlur}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-hover)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <p className="text-xs text-[var(--color-muted)]">
                Supports shorthand: 5T, 3.5T, 500B
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results Column */}
      <div>
        {result && selectedBoss ? (
          <CalculatorResults
            result={result}
            boss={selectedBoss}
            burstResult={burstResult}
          />
        ) : selectedBoss ? (
          <div className="space-y-4">
            <BossInfoCard boss={selectedBoss} />
            <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] p-6">
              <p className="text-center text-sm text-[var(--color-muted)]">
                Enter your damage to see results
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] p-8">
            <p className="text-center text-sm text-[var(--color-muted)]">
              Select a boss to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
