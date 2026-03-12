export interface BattleInput {
  bossHP: number;
  timeLimitSeconds: number;
  playerDPM: number; // your damage per minute (averaged from burst test)
  partySize: number;
  uptimePercent: number;
  partyMemberDPMs?: number[]; // individual DPMs for other party members (excluding you)
}

export interface BattleResult {
  canClear: boolean;
  estimatedClearTime: number; // seconds
  requiredDPMPerMember: number;
  effectivePlayerDPM: number; // playerDPM * uptime fraction
  dpmGap: number;
  overkillPercent: number;
  totalPartyDPM: number;
  damageContribution: number;
  hpPercentSolo: number;
  fairSharePercent: number;
}

export interface BurstCheckInput {
  burstHP: number; // HP to burn
  burstTimeSeconds: number; // time window
  playerBurstDamage: number; // damage the player deals in the burst window
  partySize: number;
  memberBurstDamages?: number[]; // burst damage for other party members (if provided, overrides equal-split assumption)
}

export interface BurstCheckResult {
  canBurst: boolean;
  partyBurstDamage: number; // total party damage in the window
  requiredPerMember: number; // damage each member needs to deal
  yourDamageInWindow: number; // your damage scaled to the burst window
  surplus: number; // positive = overkill, negative = deficit
}

export function calculateBattle(input: BattleInput): BattleResult {
  const {
    bossHP,
    timeLimitSeconds,
    playerDPM,
    partySize,
    uptimePercent,
    partyMemberDPMs,
  } = input;

  const uptimeFraction = uptimePercent / 100;
  const effectiveDPM = playerDPM * uptimeFraction;

  // If individual party DPMs are provided, sum them up. Otherwise assume equal DPM.
  let totalPartyDPM: number;
  if (partyMemberDPMs && partyMemberDPMs.length > 0) {
    const otherMembersDPM = partyMemberDPMs.reduce((sum, dpm) => sum + dpm, 0);
    totalPartyDPM = (effectiveDPM + otherMembersDPM) * 1; // uptime already applied to yours; others enter raw DPM, apply uptime
    // Actually, apply uptime to all members equally (boss mechanics affect everyone)
    totalPartyDPM = (playerDPM + otherMembersDPM) * uptimeFraction;
  } else {
    totalPartyDPM = effectiveDPM * partySize;
  }

  // Convert to per-second for time estimates
  const totalPartyDPS = totalPartyDPM / 60;
  const estimatedClearTime =
    totalPartyDPS > 0 ? bossHP / totalPartyDPS : Infinity;
  const canClear = estimatedClearTime <= timeLimitSeconds;

  const timeLimitMinutes = timeLimitSeconds / 60;
  const requiredDPMPerMember =
    partySize > 0 && uptimeFraction > 0 && timeLimitMinutes > 0
      ? bossHP / (partySize * uptimeFraction * timeLimitMinutes)
      : Infinity;

  const dpmGap = Math.max(0, requiredDPMPerMember - playerDPM);

  const overkillPercent = canClear
    ? ((timeLimitSeconds - estimatedClearTime) / timeLimitSeconds) * 100
    : 0;

  const fightDurationMinutes =
    Math.min(estimatedClearTime, timeLimitSeconds) / 60;
  const damageContribution = effectiveDPM * fightDurationMinutes;

  // Your share of total party damage (not boss HP)
  const totalPartyDamage = totalPartyDPM * fightDurationMinutes;
  const hpPercentSolo =
    totalPartyDamage > 0
      ? (damageContribution / totalPartyDamage) * 100
      : 0;
  const fairSharePercent = partySize > 0 ? 100 / partySize : 0;

  return {
    canClear,
    estimatedClearTime,
    requiredDPMPerMember,
    effectivePlayerDPM: effectiveDPM,
    dpmGap,
    overkillPercent,
    totalPartyDPM,
    damageContribution,
    hpPercentSolo,
    fairSharePercent,
  };
}

export function calculateBurstCheck(input: BurstCheckInput): BurstCheckResult {
  const { burstHP, playerBurstDamage, partySize, memberBurstDamages } = input;

  const partyBurstDamage =
    memberBurstDamages && memberBurstDamages.length > 0
      ? playerBurstDamage + memberBurstDamages.reduce((sum, d) => sum + d, 0)
      : playerBurstDamage * partySize;

  const requiredPerMember = burstHP / partySize;
  const canBurst = partyBurstDamage >= burstHP;
  const surplus = playerBurstDamage - requiredPerMember;

  return {
    canBurst,
    partyBurstDamage,
    requiredPerMember,
    yourDamageInWindow: playerBurstDamage,
    surplus,
  };
}
