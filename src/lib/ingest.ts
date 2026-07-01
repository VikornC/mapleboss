import { prisma } from "@/lib/db";
import { EXP_TABLE, cumulativeExp } from "@/lib/expData";
import { computePeriodGains } from "@/lib/expStats";
import { sweepTopRanks } from "@/lib/rankingApi";

// EXP needed to leave `level`. Table covers 1..274; the cap (275) has no "next".
function expToNextForLevel(level: number): number {
  return EXP_TABLE[level] ?? 0;
}

function expPctFor(level: number, exp: number): number {
  const toNext = expToNextForLevel(level);
  if (toNext <= 0) return 0; // level cap or unknown
  return Math.min(100, (exp / toNext) * 100);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export interface SweepResult {
  charactersSeen: number;
  snapshotsCreated: number;
  duplicatesSkipped: number;
}

/**
 * Crawl the top `topN` ranks (level >= minLevel) and write one snapshot per
 * character per UTC day. Idempotent within a day. After the sweep, recompute
 * denormalized daily/weekly/monthly gains for every character touched.
 */
export async function ingestSweep(
  topN: number,
  minLevel: number,
  opts: { delayMs?: number; onProgress?: (seen: number) => void } = {}
): Promise<SweepResult> {
  const today = startOfUtcDay(new Date());
  let charactersSeen = 0;
  let snapshotsCreated = 0;
  let duplicatesSkipped = 0;
  const touched = new Set<number>();

  for await (const row of sweepTopRanks(topN, minLevel, { delayMs: opts.delayMs })) {
    charactersSeen++;

    const expPct = expPctFor(row.level, row.exp);
    const fields = {
      name: row.name,
      className: row.job,
      job: row.job,
      guild: row.guild,
      imageUrl: row.imageUrl,
      rank: row.rank,
      level: row.level,
      exp: BigInt(Math.round(row.exp)),
      expPct,
    };
    const character = await prisma.expCharacter.upsert({
      where: { assetKey: row.assetKey },
      create: { assetKey: row.assetKey, ...fields },
      update: fields,
    });
    touched.add(character.id);

    // Dedup: one snapshot per character per UTC day.
    const existingToday = await prisma.expSnapshot.findFirst({
      where: { characterId: character.id, snappedAt: { gte: today } },
    });
    if (existingToday) {
      duplicatesSkipped++;
      if (opts.onProgress) opts.onProgress(charactersSeen);
      continue;
    }

    // Per-snapshot gain vs the character's latest prior snapshot.
    const prev = await prisma.expSnapshot.findFirst({
      where: { characterId: character.id },
      orderBy: { snappedAt: "desc" },
    });
    const cumNow = cumulativeExp(row.level, row.exp);
    const gain =
      prev != null
        ? Math.max(0, Math.round(cumNow - cumulativeExp(prev.level, Number(prev.exp))))
        : null;

    await prisma.expSnapshot.create({
      data: {
        characterId: character.id,
        level: row.level,
        exp: BigInt(Math.round(row.exp)),
        expPct,
        rank: row.rank,
        gain: gain != null ? BigInt(gain) : null,
      },
    });
    snapshotsCreated++;
    if (opts.onProgress) opts.onProgress(charactersSeen);
  }

  await recomputeGains([...touched]);
  return { charactersSeen, snapshotsCreated, duplicatesSkipped };
}

// Recompute denormalized daily/weekly/monthly gains for the given characters.
async function recomputeGains(characterIds: number[]): Promise<void> {
  const now = new Date();
  for (const characterId of characterIds) {
    const snaps = await prisma.expSnapshot.findMany({
      where: { characterId },
      orderBy: { snappedAt: "asc" },
      select: { level: true, exp: true, snappedAt: true },
    });
    const g = computePeriodGains(snaps, now);
    await prisma.expCharacter.update({
      where: { id: characterId },
      data: {
        dailyGain: g.daily != null ? BigInt(g.daily) : null,
        weeklyGain: g.weekly != null ? BigInt(g.weekly) : null,
        monthlyGain: g.monthly != null ? BigInt(g.monthly) : null,
      },
    });
  }
}

/** Delete snapshots older than `retentionDays` (default 35, matching lulumi). */
export async function pruneOldSnapshots(retentionDays = 35): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
  const { count } = await prisma.expSnapshot.deleteMany({
    where: { snappedAt: { lt: cutoff } },
  });
  return count;
}
