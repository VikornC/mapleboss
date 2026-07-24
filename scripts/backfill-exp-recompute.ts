/**
 * One-time history backfill after the EXP curve is corrected.
 *
 * The raw within-level `exp` on every snapshot is untouched by MSU's rebalance,
 * so EXP% and gains are fully recomputable from it against the live ExpLevelReq
 * table. Steps:
 *   1. snapshot.expPct  — bulk SQL (every row changes; exp / totalExp).
 *   2. ExpCharacter.expPct — bulk SQL from each char's latest snapshot.
 *   3. Per character — recompute snapshot.gain (only cross-level rows change,
 *      since within-level gains cancel the table) and the denormalized
 *      daily/weekly/monthly gains via computePeriodGains.
 *
 * Idempotent. Run AFTER scripts/derive-exp-table.ts has seeded ExpLevelReq.
 * Run: npx tsx scripts/backfill-exp-recompute.ts
 */
import { prisma } from "../src/lib/db";
import { hydrateExpTable, gainBetween, EXP_TABLE } from "../src/lib/expData";
import { computePeriodGains } from "../src/lib/expStats";

const CONCURRENCY = 12;

async function main() {
  await hydrateExpTable(true); // load the freshly-seeded live table

  // 1. Every snapshot's expPct, per-reading (old vs new curve). A reading whose
  //    within-level exp exceeds the current requirement predates the reduction,
  //    so it uses the OLD static requirement; the rest use the new one.
  // 1a. New-curve readings (exp <= current requirement).
  const r1a = await prisma.$executeRawUnsafe(`
    UPDATE "ExpSnapshot" s
    SET "expPct" = LEAST(100, s."exp"::float8 / r."totalExp"::float8 * 100)
    FROM "ExpLevelReq" r
    WHERE s."level" = r."level" AND r."totalExp" > 0 AND s."exp" <= r."totalExp"
  `);
  // 1b. Old-curve readings (exp > current requirement) -> old static requirement.
  const reqs = await prisma.expLevelReq.findMany({ select: { level: true, totalExp: true } });
  let r1b = 0;
  for (const { level, totalExp } of reqs) {
    const oldReq = EXP_TABLE[level];
    if (!oldReq) continue;
    r1b += await prisma.$executeRawUnsafe(
      `UPDATE "ExpSnapshot" SET "expPct" = LEAST(100, "exp"::float8 / $1::float8 * 100)
       WHERE "level" = $2 AND "exp" > $3`,
      oldReq, level, Number(totalExp)
    );
  }
  console.log(`[backfill] snapshot.expPct updated: new-era=${r1a} old-era=${r1b}`);

  // 2. ExpCharacter.expPct from each character's latest snapshot.
  const r2 = await prisma.$executeRawUnsafe(`
    UPDATE "ExpCharacter" c
    SET "expPct" = sub."expPct"
    FROM (
      SELECT DISTINCT ON ("characterId") "characterId", "expPct"
      FROM "ExpSnapshot" ORDER BY "characterId", "snappedAt" DESC
    ) sub
    WHERE sub."characterId" = c."id"
  `);
  console.log(`[backfill] ExpCharacter.expPct updated: ${r2}`);

  // 3. Per-character: fix cross-level snapshot.gain + denormalized period gains.
  const chars = await prisma.expCharacter.findMany({ select: { id: true } });
  console.log(`[backfill] recomputing gains for ${chars.length} characters...`);
  // Anchor period boundaries to the latest snapshot, not wall-clock: the daily
  // crawler computes gains at crawl time (same day as the snapshot), so a
  // backfill run on a later date must simulate that or every "since today's
  // reset" gain collapses to 0 (baseline == latest).
  const latestSnap = await prisma.expSnapshot.aggregate({ _max: { snappedAt: true } });
  const now = latestSnap._max.snappedAt ?? new Date();
  console.log(`[backfill] anchoring period gains to latest snapshot: ${now.toISOString()}`);
  const queue = [...chars];
  let done = 0, gainRowsFixed = 0;

  async function worker() {
    for (;;) {
      const c = queue.pop();
      if (!c) return;
      const snaps = await prisma.expSnapshot.findMany({
        where: { characterId: c.id },
        orderBy: { snappedAt: "asc" },
        select: { id: true, level: true, exp: true, gain: true, snappedAt: true },
      });

      // Recompute each snapshot's gain (per-step, reduction-safe); write changed.
      for (let i = 0; i < snaps.length; i++) {
        const newGain =
          i === 0
            ? null
            : Math.round(gainBetween(
                { level: snaps[i - 1].level, exp: Number(snaps[i - 1].exp) },
                { level: snaps[i].level, exp: Number(snaps[i].exp) }
              ));
        const newVal = newGain != null ? BigInt(newGain) : null;
        if (newVal !== snaps[i].gain) {
          await prisma.expSnapshot.update({ where: { id: snaps[i].id }, data: { gain: newVal } });
          gainRowsFixed++;
        }
      }

      // Denormalized daily/weekly/monthly gains (leaderboard columns).
      const g = computePeriodGains(snaps, now);
      await prisma.expCharacter.update({
        where: { id: c.id },
        data: {
          dailyGain: g.daily != null ? BigInt(g.daily) : null,
          weeklyGain: g.weekly != null ? BigInt(g.weekly) : null,
          monthlyGain: g.monthly != null ? BigInt(g.monthly) : null,
        },
      });

      if (++done % 500 === 0) console.log(`[backfill] ${done}/${chars.length} (gain rows fixed: ${gainRowsFixed})`);
    }
  }

  const startedAt = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`[backfill] done in ${mins}m — chars=${chars.length} snapshot.gain rows fixed=${gainRowsFixed}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[backfill] failed:", e);
  process.exit(1);
});
