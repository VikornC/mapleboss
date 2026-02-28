"use client";

import { useState } from "react";
import { formatNumber, parseNumberInput } from "@/lib/format";

interface MemberState {
  burstMinutes: number;
  totalDamage: number | null;
  text: string;
}

interface Props {
  playerDPM: number | null;
  partySize: number;
  memberDPMs: (number | null)[];
  onMemberDPMsChange: (dpms: (number | null)[]) => void;
}

const BURST_OPTIONS = [1, 2, 3];

export default function PartyMembers({
  playerDPM,
  partySize,
  memberDPMs,
  onMemberDPMsChange,
}: Props) {
  const [members, setMembers] = useState<MemberState[]>(
    Array(5)
      .fill(null)
      .map(() => ({ burstMinutes: 2, totalDamage: null, text: "" }))
  );

  const otherCount = partySize - 1;
  if (otherCount <= 0) return null;

  function updateMember(index: number, updates: Partial<MemberState>) {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], ...updates };
    setMembers(newMembers);

    // Recalculate DPM for this member
    const member = newMembers[index];
    const damage = updates.totalDamage !== undefined ? updates.totalDamage : member.totalDamage;
    const burst = updates.burstMinutes !== undefined ? updates.burstMinutes : member.burstMinutes;
    const dpm = damage && damage > 0 ? damage / burst : null;

    const newDPMs = [...memberDPMs];
    newDPMs[index] = dpm;
    onMemberDPMsChange(newDPMs);
  }

  function handleTextChange(index: number, raw: string) {
    const parsed = parseNumberInput(raw);
    updateMember(index, { text: raw, totalDamage: parsed });
  }

  function handleBlur(index: number) {
    const member = members[index];
    if (member.totalDamage && member.totalDamage > 0) {
      updateMember(index, { text: formatNumber(member.totalDamage) });
    }
  }

  function handleBurstChange(index: number, minutes: number) {
    updateMember(index, { burstMinutes: minutes });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--color-secondary)]">
          Party Members
        </label>
        <span className="text-[10px] text-[var(--color-muted)]">
          Empty slots assume same damage as you
        </span>
      </div>

      {/* You (read-only summary) */}
      <div className="flex items-center gap-2 rounded-lg bg-[var(--color-elevated)] px-3 py-2">
        <span className="w-8 shrink-0 text-xs font-semibold text-[var(--color-accent)]">
          You
        </span>
        <span className="flex-1 font-mono text-sm text-[var(--color-secondary)]">
          {playerDPM ? `${formatNumber(playerDPM)}/min` : "—"}
        </span>
      </div>

      {/* Other members */}
      {Array.from({ length: otherCount }, (_, i) => {
        const member = members[i];
        const dpm = member.totalDamage && member.totalDamage > 0
          ? member.totalDamage / member.burstMinutes
          : null;

        return (
          <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)]/50 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-semibold text-[var(--color-secondary)]">
                P{i + 2}
              </span>
              {/* Compact burst timer */}
              <div className="flex rounded bg-[var(--color-elevated)] p-0.5">
                {BURST_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => handleBurstChange(i, min)}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      member.burstMinutes === min
                        ? "bg-[var(--color-accent)] text-zinc-950"
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    {min}m
                  </button>
                ))}
              </div>
              {dpm && (
                <span className="ml-auto font-mono text-[10px] text-[var(--color-accent)]">
                  = {formatNumber(dpm)}/min
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder={`Damage in ${member.burstMinutes} min`}
              value={member.text}
              onChange={(e) => handleTextChange(i, e.target.value)}
              onBlur={() => handleBlur(i)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] px-2.5 py-1.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/40 transition-colors hover:border-[var(--color-border-hover)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
            />
          </div>
        );
      })}
    </div>
  );
}
