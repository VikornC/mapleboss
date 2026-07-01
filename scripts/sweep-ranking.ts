/**
 * Daily leaderboard crawler. Sweeps the top ranks of MSU's ranking endpoint
 * and writes one snapshot per character per UTC day, then prunes old snapshots.
 *
 * Run: npx tsx scripts/sweep-ranking.ts
 * Env: RANKING_TOP_N (default 6844), MIN_LEVEL (default 225),
 *      SWEEP_DELAY_MS (default 5000), RETENTION_DAYS (default 120)
 *
 * Retention (120d) covers the 90-day detail charts with headroom while keeping
 * the table small enough for Neon's free 0.5GB tier.
 *
 * Decoupled + once-daily + idempotent (dedup per day) — safe to re-run.
 */
import { ingestSweep, pruneOldSnapshots } from "../src/lib/ingest";
import { prisma } from "../src/lib/db";

async function main() {
  const topN = parseInt(process.env.RANKING_TOP_N ?? "6844", 10);
  const minLevel = parseInt(process.env.MIN_LEVEL ?? "225", 10);
  const delayMs = parseInt(process.env.SWEEP_DELAY_MS ?? "5000", 10);
  const retentionDays = parseInt(process.env.RETENTION_DAYS ?? "120", 10);

  const startedAt = Date.now();
  console.log(`[sweep] start topN=${topN} minLevel=${minLevel} delayMs=${delayMs}`);

  const result = await ingestSweep(topN, minLevel, {
    delayMs,
    onProgress: (seen) => {
      if (seen % 100 === 0) console.log(`[sweep] processed ${seen} characters...`);
    },
  });

  const pruned = await pruneOldSnapshots(retentionDays);
  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);

  console.log(
    `[sweep] done in ${mins}m — seen=${result.charactersSeen} ` +
      `created=${result.snapshotsCreated} dupSkipped=${result.duplicatesSkipped} pruned=${pruned}`
  );
}

main()
  .catch((e) => {
    console.error("[sweep] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
