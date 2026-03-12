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
  const [memberBurstTexts, setMemberBurstTexts] = useState<string[]>(Array(5).fill(""));
  const [memberBurstDamages, setMemberBurstDamages] = useState<(number | null)[]>(Array(5).fill(null));
  const [memberDPMs, setMemberDPMs] = useState<(number | null)[]>(
    Array(5).fill(null)
  );
  const [bishopBuff, setBishopBuff] = useState(false);

  const BISHOP_MULTIPLIER = 1.35;

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
  // Bishop buff only applies to the P3 DPS race burst check
  const effectiveBurstDamage = bishopBuff && burstDamage ? burstDamage * BISHOP_MULTIPLIER : burstDamage;

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
  if (selectedBoss?.burstCheck && effectiveBurstDamage && effectiveBurstDamage > 0) {
    const otherBurstCount = partySize - 1;
    const hasAnyMemberBurst = memberBurstDamages.slice(0, otherBurstCount).some((d) => d !== null && d > 0);
    const buffed = bishopBuff ? BISHOP_MULTIPLIER : 1;
    const resolvedMemberBursts = hasAnyMemberBurst
      ? Array.from({ length: otherBurstCount }, (_, i) => {
          const base = memberBurstDamages[i] && memberBurstDamages[i]! > 0 ? memberBurstDamages[i]! : (burstDamage ?? 0);
          return base * buffed;
        })
      : undefined;

    burstResult = calculateBurstCheck({
      burstHP: selectedBoss.burstCheck.hp,
      burstTimeSeconds: selectedBoss.burstCheck.timeSeconds,
      playerBurstDamage: effectiveBurstDamage,
      partySize,
      memberBurstDamages: resolvedMemberBursts,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      {/* Inputs Column */}
      <div className="space-y-5">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-medium text-[var(--color-secondary)] uppercase tracking-wider">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            Setup
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </h2>
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
            <div className="space-y-3">
              {/* Your burst */}
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
              </div>

              {/* Party member burst inputs */}
              {partySize > 1 && Array.from({ length: partySize - 1 }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-secondary)]">
                    P{i + 2} Burst Damage
                    <span className="ml-1 text-[var(--color-muted)]">(defaults to pt leader burst)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={burstText || "e.g. 5t, 3.5t"}
                    value={memberBurstTexts[i]}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseNumberInput(val);
                      setMemberBurstTexts((prev) => { const next = [...prev]; next[i] = val; return next; });
                      setMemberBurstDamages((prev) => { const next = [...prev]; next[i] = parsed; return next; });
                    }}
                    onBlur={() => {
                      const val = memberBurstDamages[i];
                      if (val && val > 0) {
                        setMemberBurstTexts((prev) => { const next = [...prev]; next[i] = formatNumber(val); return next; });
                      }
                    }}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-hover)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              ))}

              <p className="text-xs text-[var(--color-muted)]">
                Supports shorthand: 5T, 3.5T, 500B
              </p>

              {/* Bishop Buff Toggle — party only */}
              {partySize > 1 && <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 transition-colors hover:border-purple-500/40">
                <input
                  type="checkbox"
                  checked={bishopBuff}
                  onChange={(e) => setBishopBuff(e.target.checked)}
                  className="mt-0.5 accent-purple-500"
                />
                <div>
                  <div className="text-sm font-medium text-purple-300">
                    Bishop Buff
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    Check this if your run will include a Bishop but your BA was done without one. Applies ~35% FD based on a 25M CP Bishop.
                  </p>
                </div>
              </label>}
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
            partySize={partySize}
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
