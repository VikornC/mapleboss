import { prisma } from "@/lib/db";
import { gainBetween, expToNextFor, hydrateExpTable } from "@/lib/expData";
import { computePeriodGains } from "@/lib/expStats";
import { sweepTopRanks } from "@/lib/rankingApi";
import { fetchNavigatorInfo } from "@/lib/navigatorApi";

function expPctFor(level: number, exp: number): number {
  const toNext = expToNextFor(level, exp); // per-reading (old vs new curve)
  if (toNext <= 0) return 0; // level cap or unknown
  return Math.min(100, (exp / toNext) * 100);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Persist the sampled per-level EXP requirements (keyed on live level). Only
// lowers an existing "live" value (reductions) or fills absent/provisional
// levels, so an unlucky sample of stale-cache characters can't raise a good one.
async function upsertLevelReqs(mins: Map<number, number>): Promise<void> {
  if (mins.size === 0) return;
  const existing = await prisma.expLevelReq.findMany({
    where: { level: { in: [...mins.keys()] } },
    select: { level: true, totalExp: true, source: true },
  });
  const exMap = new Map(existing.map((e) => [e.level, e]));
  for (const [level, totalExp] of mins) {
    const ex = exMap.get(level);
    if (ex && ex.source === "live" && Number(ex.totalExp) <= totalExp) continue;
    await prisma.expLevelReq.upsert({
      where: { level },
      create: { level, totalExp: BigInt(totalExp), source: "live" },
      update: { totalExp: BigInt(totalExp), source: "live" },
    });
  }
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
  // Load the live EXP curve so expPct/gains use current requirements.
  await hydrateExpTable(true);

  const today = startOfUtcDay(new Date());
  let charactersSeen = 0;
  let snapshotsCreated = 0;
  let duplicatesSkipped = 0;
  const touched = new Set<number>();
  // Self-maintaining EXP curve: `totalExp` is a per-character cache that's stale
  // on inactive chars, and reductions only lower it — so we sample a few chars
  // per level and keep the MIN (the true current requirement). Upserted after
  // the sweep. ~5 /info calls per level — negligible against the full crawl.
  const SAMPLES_PER_LEVEL = 5;
  const levelSamples = new Map<number, number>(); // stored level -> # sampled
  const levelReqMin = new Map<number, number>(); // live level -> min totalExp

  for await (const row of sweepTopRanks(topN, minLevel, { delayMs: opts.delayMs })) {
    charactersSeen++;

    const sampled = levelSamples.get(row.level) ?? 0;
    if (sampled < SAMPLES_PER_LEVEL) {
      levelSamples.set(row.level, sampled + 1);
      const info = await fetchNavigatorInfo(row.assetKey);
      if (info && info.totalExp > 0) {
        const cur = levelReqMin.get(info.level);
        if (cur == null || info.totalExp < cur) levelReqMin.set(info.level, info.totalExp);
      }
    }

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
    // Per-step gain (level-up-safe and reduction-safe).
    const gain =
      prev != null
        ? Math.round(gainBetween({ level: prev.level, exp: Number(prev.exp) }, { level: row.level, exp: row.exp }))
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

  await upsertLevelReqs(levelReqMin);
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
