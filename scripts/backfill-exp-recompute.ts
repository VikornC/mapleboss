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
import { hydrateExpTable, cumulativeExp } from "../src/lib/expData";
import { computePeriodGains } from "../src/lib/expStats";

const CONCURRENCY = 12;

async function main() {
  await hydrateExpTable(true); // load the freshly-seeded live table

  // 1. Every snapshot's expPct, from the live per-level requirement.
  const r1 = await prisma.$executeRawUnsafe(`
    UPDATE "ExpSnapshot" s
    SET "expPct" = LEAST(100, s."exp"::float8 / r."totalExp"::float8 * 100)
    FROM "ExpLevelReq" r
    WHERE s."level" = r."level" AND r."totalExp" > 0
  `);
  console.log(`[backfill] snapshot.expPct updated: ${r1}`);

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
  const now = new Date();
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

      // Recompute each snapshot's gain; write only the ones that changed.
      for (let i = 0; i < snaps.length; i++) {
        const cur = snaps[i];
        const newGain =
          i === 0
            ? null
            : Math.max(0, Math.round(cumulativeExp(cur.level, Number(cur.exp)) -
                cumulativeExp(snaps[i - 1].level, Number(snaps[i - 1].exp))));
        const newVal = newGain != null ? BigInt(newGain) : null;
        if (newVal !== cur.gain) {
          await prisma.expSnapshot.update({ where: { id: cur.id }, data: { gain: newVal } });
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
