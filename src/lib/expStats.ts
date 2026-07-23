import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { cumulativeExp, expToNextFor, hydrateExpTable } from "@/lib/expData";

// A minimal snapshot shape for gain math (level + within-level exp + time).
export interface SnapshotLike {
  level: number;
  exp: bigint;
  snappedAt: Date;
}

// MSU ranking resets all occur at 00:00 UTC (= 09:00 JST).
// Returns the most recent reset boundary (UTC) for each gain period.
export function jstResetBoundaries(now: Date = new Date()) {
  const daily = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // weekly: most recent Thursday (getUTCDay: Thu = 4) at 00:00 UTC
  const weekly = new Date(daily);
  weekly.setUTCDate(weekly.getUTCDate() - ((daily.getUTCDay() - 4 + 7) % 7));
  // monthly: 1st of the current month at 00:00 UTC
  const monthly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { daily, weekly, monthly };
}

// EXP gained between the latest snapshot and the last snapshot at/before `boundary`.
// Snapshots must be ascending by snappedAt. Returns null if there's no baseline.
function gainSince(snapshots: SnapshotLike[], boundary: Date): number | null {
  if (snapshots.length === 0) return null;
  const latest = snapshots[snapshots.length - 1];
  let baseline: SnapshotLike | null = null;
  for (const s of snapshots) {
    if (s.snappedAt.getTime() <= boundary.getTime()) baseline = s;
    else break;
  }
  if (!baseline) return null;
  const g =
    cumulativeExp(latest.level, Number(latest.exp)) -
    cumulativeExp(baseline.level, Number(baseline.exp));
  return Math.max(0, Math.round(g));
}

// Daily/weekly/monthly gains aligned to the JST resets (mirrors lulumi).
export function computePeriodGains(snapshots: SnapshotLike[], now: Date = new Date()) {
  const b = jstResetBoundaries(now);
  return {
    daily: gainSince(snapshots, b.daily),
    weekly: gainSince(snapshots, b.weekly),
    monthly: gainSince(snapshots, b.monthly),
  };
}

// Derive expToNext from stored snapshot data (avoids depending on incomplete EXP table for levels 250+)
function deriveExpToNext(exp: bigint, expPct: number): number {
  if (expPct <= 0) return 0;
  return Math.round(Number(exp) / (expPct / 100));
}

interface DailyGain {
  date: string;
  expGained: number;
}

interface AveragePeriod { avgPerDay: number; dailyPct: number; total: number; days: number }
interface Averages {
  "7d": AveragePeriod;
  "14d": AveragePeriod;
  "30d": AveragePeriod;
  "90d": AveragePeriod;
}

interface ProgressPoint {
  date: string;
  level: number;
  exp: number;
  expToNext: number;
  pct: number;
}

interface EstimateMilestone {
  level: number;
  daysRequired: number;
  date: string;
  totalExpNeeded: number;
}

interface EstimateProjectionPoint {
  date: string;
  level: number;
  pct: number;
}

interface Estimate {
  currentLevel: number;
  targetLevel: number;
  avgDailyExp: number;
  totalExpNeeded: number;
  estimatedDays: number;
  estimatedDate: string;
  projection: EstimateProjectionPoint[];
  milestones: EstimateMilestone[];
}

interface CharacterSummary {
  level: number;
  exp: number;
  expPct: number;
  expToNext: number;
  levelRank: number | null;
  lastUpdated: string;
}

interface AllTimeBest {
  expGained: number;
  date: string;
}

interface LevelPlannerResult {
  days: number;
  date: string;
  expNeeded: number;
}

interface RequiredGainResult {
  daysLeft: number;
  daily: number;
  weekly: number;
  monthly: number;
}

async function getSnapshots(assetKey: string, days?: number) {
  const character = await prisma.expCharacter.findUnique({ where: { assetKey } });
  if (!character) return [];

  const where: { characterId: number; snappedAt?: { gte: Date } } = {
    characterId: character.id,
  };
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    where.snappedAt = { gte: cutoff };
  }

  return prisma.expSnapshot.findMany({
    where,
    orderBy: { snappedAt: "asc" },
  });
}

// Compute daily gains from snapshot pairs
function computeDailyGains(snapshots: Awaited<ReturnType<typeof getSnapshots>>): DailyGain[] {
  if (snapshots.length < 2) return [];

  const daily: Record<string, number> = {};

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const curr = snapshots[i];
    const date = curr.snappedAt.toISOString().slice(0, 10);

    // Exact, level-up-safe: difference of cumulative totals.
    const gained =
      cumulativeExp(curr.level, Number(curr.exp)) - cumulativeExp(prev.level, Number(prev.exp));

    if (gained > 0) {
      daily[date] = (daily[date] ?? 0) + gained;
    }
  }

  return Object.entries(daily)
    .map(([date, expGained]) => ({ date, expGained }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDailyGains(assetKey: string, days: number): Promise<DailyGain[]> {
  await hydrateExpTable();
  const snapshots = await getSnapshots(assetKey, days + 1);
  return computeDailyGains(snapshots);
}

export async function getAverages(assetKey: string): Promise<Averages | null> {
  const summary = await getCharacterSummary(assetKey);
  if (!summary) return null;
  const expToNext = summary.expToNext;

  async function avgFor(period: number): Promise<AveragePeriod> {
    const gains = await getDailyGains(assetKey, period);
    if (gains.length === 0) return { avgPerDay: 0, dailyPct: 0, total: 0, days: 0 };
    const total = gains.reduce((s, g) => s + g.expGained, 0);
    const avg = total / gains.length;
    return {
      avgPerDay: Math.round(avg),
      dailyPct: expToNext > 0 ? Math.round((avg / expToNext) * 10000) / 100 : 0,
      total: Math.round(total),
      days: gains.length,
    };
  }

  const [a7, a14, a30, a90] = await Promise.all([avgFor(7), avgFor(14), avgFor(30), avgFor(90)]);
  return { "7d": a7, "14d": a14, "30d": a30, "90d": a90 };
}

// Historical level + EXP% over time, for the Level Progress line chart
export async function getLevelProgress(assetKey: string, days: number): Promise<ProgressPoint[]> {
  await hydrateExpTable();
  const snapshots = await getSnapshots(assetKey, days);
  return snapshots.map((s) => {
    const expToNext = deriveExpToNext(s.exp, s.expPct);
    return {
      date: s.snappedAt.toISOString().slice(0, 10),
      level: s.level,
      exp: Number(s.exp),
      expToNext,
      pct: Math.round(s.expPct * 100) / 100,
    };
  });
}

// EXP progress forecast: projection line + per-level milestones table
export async function getEstimate(
  assetKey: string,
  targetLevel: number,
  dailyExpOverride?: number
): Promise<Estimate | { error: string } | null> {
  const summary = await getCharacterSummary(assetKey);
  if (!summary) return null;

  const currentLevel = summary.level;
  const currentExp = summary.exp;

  // Determine daily EXP rate (override, else 7-day average)
  let avgDaily: number;
  if (dailyExpOverride && dailyExpOverride > 0) {
    avgDaily = dailyExpOverride;
  } else {
    const gains = await getDailyGains(assetKey, 7);
    const total = gains.reduce((s, g) => s + g.expGained, 0);
    avgDaily = gains.length > 0 ? total / gains.length : 0;
  }

  if (avgDaily <= 0) return { error: "Not enough data to estimate" };
  if (targetLevel <= currentLevel) return { error: "Already at or past target level" };

  const expToNext = (lvl: number, fallback: number) => expToNextFor(lvl) || fallback;

  // Total EXP needed to reach target
  let totalExpNeeded = summary.expToNext - currentExp;
  for (let lvl = currentLevel + 1; lvl < targetLevel; lvl++) {
    totalExpNeeded += expToNext(lvl, summary.expToNext);
  }

  const totalDays = totalExpNeeded / avgDaily;
  const targetDate = new Date(Date.now() + totalDays * 86400000);

  // Projection points for the line chart
  const projection: EstimateProjectionPoint[] = [];
  let simLevel = currentLevel;
  let simExp = currentExp;
  let simToNext = summary.expToNext;
  const maxDays = Math.min(Math.ceil(totalDays) + 2, 2000);

  for (let day = 0; day <= maxDays; day++) {
    const date = new Date(Date.now() + day * 86400000).toISOString().slice(0, 10);
    const pct = simToNext > 0 ? (simExp / simToNext) * 100 : 0;
    projection.push({ date, level: simLevel, pct: Math.round(pct * 10) / 10 });
    if (simLevel >= targetLevel) break;

    simExp += avgDaily;
    while (simToNext > 0 && simExp >= simToNext) {
      simExp -= simToNext;
      simLevel += 1;
      simToNext = expToNext(simLevel, summary.expToNext);
      if (simLevel >= targetLevel) break;
    }
  }

  // Milestones table
  const milestones: EstimateMilestone[] = [];
  let mileRemaining = summary.expToNext - currentExp;
  for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
    const daysReq = mileRemaining / avgDaily;
    const mileDate = new Date(Date.now() + daysReq * 86400000);
    milestones.push({
      level: lvl,
      daysRequired: Math.round(daysReq * 10) / 10,
      date: mileDate.toISOString().slice(0, 10),
      totalExpNeeded: Math.round(mileRemaining),
    });
    mileRemaining += expToNext(lvl, summary.expToNext);
  }

  return {
    currentLevel,
    targetLevel,
    avgDailyExp: Math.round(avgDaily),
    totalExpNeeded: Math.round(totalExpNeeded),
    estimatedDays: Math.round(totalDays * 10) / 10,
    estimatedDate: targetDate.toISOString().slice(0, 10),
    projection,
    milestones,
  };
}

export async function getCharacterSummary(assetKey: string): Promise<CharacterSummary | null> {
  await hydrateExpTable();
  const character = await prisma.expCharacter.findUnique({ where: { assetKey } });
  if (!character) return null;

  const latest = await prisma.expSnapshot.findFirst({
    where: { characterId: character.id },
    orderBy: { snappedAt: "desc" },
  });
  if (!latest) return null;

  return {
    level: latest.level,
    exp: Number(latest.exp),
    expPct: latest.expPct,
    expToNext: deriveExpToNext(latest.exp, latest.expPct),
    levelRank: character.levelRank,
    lastUpdated: latest.snappedAt.toISOString(),
  };
}

export async function getAllTimeBest(assetKey: string): Promise<AllTimeBest | null> {
  await hydrateExpTable();
  const snapshots = await getSnapshots(assetKey);
  const gains = computeDailyGains(snapshots);
  if (gains.length === 0) return null;

  const best = gains.reduce((max, g) => (g.expGained > max.expGained ? g : max), gains[0]);
  return best;
}

export async function getPeriodGain(
  assetKey: string,
  days: number
): Promise<{ total: number; rank: null }> {
  const gains = await getDailyGains(assetKey, days);
  const total = gains.reduce((s, g) => s + g.expGained, 0);
  return { total, rank: null }; // rank requires global data (V2)
}

export async function getLevelPlannerAt(
  assetKey: string,
  targetLevel: number,
  avgPerDay: number
): Promise<LevelPlannerResult | null> {
  const summary = await getCharacterSummary(assetKey);
  if (!summary || avgPerDay <= 0) return null;
  if (targetLevel <= summary.level) return { days: 0, date: new Date().toISOString().slice(0, 10), expNeeded: 0 };

  // EXP to finish current level
  let expNeeded = summary.expToNext - summary.exp;
  // Add full levels between current and target
  for (let lvl = summary.level + 1; lvl < targetLevel; lvl++) {
    expNeeded += expToNextFor(lvl) || summary.expToNext; // fallback to current level size for unknown levels
  }

  const days = Math.ceil(expNeeded / avgPerDay);
  const date = new Date();
  date.setDate(date.getDate() + days);

  return {
    days,
    date: date.toISOString().slice(0, 10),
    expNeeded,
  };
}

export async function getRequiredGain(
  assetKey: string,
  targetLevel: number,
  targetDateStr: string
): Promise<RequiredGainResult | null> {
  const summary = await getCharacterSummary(assetKey);
  if (!summary) return null;

  let expNeeded = summary.expToNext - summary.exp;
  for (let lvl = summary.level + 1; lvl < targetLevel; lvl++) {
    expNeeded += expToNextFor(lvl) || summary.expToNext;
  }

  const targetDate = new Date(targetDateStr);
  const now = new Date();
  const daysLeft = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / 86400000));

  return {
    daysLeft,
    daily: Math.ceil(expNeeded / daysLeft),
    weekly: Math.ceil(expNeeded / (daysLeft / 7)),
    monthly: Math.ceil(expNeeded / (daysLeft / 30)),
  };
}

// Formatted display helpers
export function fmtExp(n: number): string {
  return formatNumber(n);
}
