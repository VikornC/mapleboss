/**
 * One-time seed of the live EXP-per-level curve (ExpLevelReq).
 *
 * For each level currently present among tracked characters, fetch one
 * character's navigator /info and read `totalExp` (the level's exact EXP
 * requirement, class-independent). Then seed *provisional* values for levels
 * above the current max (no live characters yet) by scaling the old static
 * table by the measured reduction ratio; those auto-correct once players reach
 * them. The daily crawler keeps everything fresh thereafter.
 *
 * Run: npx tsx scripts/derive-exp-table.ts
 */
import { prisma } from "../src/lib/db";
import { EXP_TABLE, MAX_LEVEL } from "../src/lib/expData";
import { fetchNavigatorInfo } from "../src/lib/navigatorApi";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // Distinct levels among tracked characters (≥230 cutoff → ~230..258).
  const grouped = await prisma.expCharacter.groupBy({
    by: ["level"],
    where: { level: { not: null } },
    _count: { _all: true },
  });
  const levels = grouped
    .map((g) => g.level!)
    .filter((l) => l != null)
    .sort((a, b) => a - b);
  console.log(`[derive] ${levels.length} distinct levels present: ${levels[0]}..${levels[levels.length - 1]}`);

  // `totalExp` is a per-character cache that only updates when the character is
  // active, so inactive chars keep the stale (higher) pre-reduction value. Since
  // reductions only lower the requirement, the true current value is the MINIMUM
  // across a sample of characters at each level. Sample several and keep the min.
  const SAMPLE = 10;
  const live = new Map<number, number>(); // level -> min totalExp

  for (const level of levels) {
    const chars = await prisma.expCharacter.findMany({
      where: { level },
      orderBy: { rank: "asc" },
      take: SAMPLE,
      select: { assetKey: true },
    });
    for (const c of chars) {
      const info = await fetchNavigatorInfo(c.assetKey);
      if (!info || info.totalExp <= 0) continue;
      const cur = live.get(info.level);
      if (cur == null || info.totalExp < cur) live.set(info.level, info.totalExp);
      await sleep(150);
    }
  }

  // Upsert the min per level.
  for (const [lvl, totalExp] of [...live.entries()].sort((a, b) => a[0] - b[0])) {
    await prisma.expLevelReq.upsert({
      where: { level: lvl },
      create: { level: lvl, totalExp: BigInt(totalExp), source: "live" },
      update: { totalExp: BigInt(totalExp), source: "live" },
    });
    const oldVal = EXP_TABLE[lvl];
    const delta = oldVal ? `${(((totalExp - oldVal) / oldVal) * 100).toFixed(1)}%` : "n/a";
    console.log(`[derive] Lv${lvl}: totalExp=${totalExp.toLocaleString()} (vs table ${delta})`);
  }

  // Measured reduction ratio from the 250s decade (where we have live values).
  const ratioSamples: number[] = [];
  for (let l = 250; l <= 259; l++) {
    const lv = live.get(l);
    const old = EXP_TABLE[l];
    if (lv && old) ratioSamples.push(lv / old);
  }
  const ratio =
    ratioSamples.length > 0
      ? ratioSamples.reduce((a, b) => a + b, 0) / ratioSamples.length
      : 1;
  console.log(`[derive] measured reduction ratio (250s): ${ratio.toFixed(4)} (from ${ratioSamples.length} levels)`);

  // Provisional seed (old table x measured ratio) for every level from the
  // lowest tracked level up to MAX_LEVEL-1 that lacks a live value — this fills
  // both gaps inside the range (e.g. a level with no character right now) and
  // levels above the current max. Never overwrites a live value. Each is
  // auto-replaced with a live value once a character occupies that level.
  const minLive = Math.min(...live.keys());
  let provisioned = 0;
  for (let l = minLive; l < MAX_LEVEL; l++) {
    if (live.has(l)) continue;
    const old = EXP_TABLE[l];
    if (!old) continue;
    const existing = await prisma.expLevelReq.findUnique({ where: { level: l } });
    if (existing?.source === "live") continue;
    const provisional = Math.round(old * ratio);
    await prisma.expLevelReq.upsert({
      where: { level: l },
      create: { level: l, totalExp: BigInt(provisional), source: "provisional" },
      update: { totalExp: BigInt(provisional), source: "provisional" },
    });
    provisioned++;
  }
  console.log(`[derive] seeded ${live.size} live + ${provisioned} provisional (gaps in ${minLive}..${MAX_LEVEL - 1})`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[derive] failed:", e);
  process.exit(1);
});
