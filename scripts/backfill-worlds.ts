/**
 * URGENT one-time backfill: fetch each tracked character's worldId from MSU's
 * navigator /info endpoint and store it. worldId is static per character, so
 * this runs once. Idempotent (skips rows that already have a worldId) and
 * resumable if MSU drops mid-run.
 *
 * Run: npx tsx scripts/backfill-worlds.ts
 */
import { prisma } from "../src/lib/db";

const UA = "Mozilla/5.0";
const CONCURRENCY = 20;
const INFO_URL = (key: string) =>
  `https://msu.io/navigator/api/navigator/characters/${encodeURIComponent(key)}/info`;

async function fetchWorld(assetKey: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(INFO_URL(assetKey), { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!res.ok) {
        if (res.status === 429) { await sleep(2000); continue; }
        return null;
      }
      const json = (await res.json()) as { common?: { worldId?: string } };
      return json?.common?.worldId?.trim() || null;
    } catch {
      await sleep(500);
    }
  }
  return null;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const chars = await prisma.expCharacter.findMany({
    where: { worldId: null },
    select: { id: true, assetKey: true },
  });
  console.log(`[worlds] ${chars.length} characters need worldId`);

  let done = 0, ok = 0, fail = 0;
  const queue = [...chars];

  async function worker() {
    for (;;) {
      const c = queue.pop();
      if (!c) return;
      const world = await fetchWorld(c.assetKey);
      if (world) {
        await prisma.expCharacter.update({ where: { id: c.id }, data: { worldId: world } });
        ok++;
      } else {
        fail++;
      }
      if (++done % 200 === 0) console.log(`[worlds] ${done}/${chars.length} (ok=${ok} fail=${fail})`);
    }
  }

  const startedAt = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`[worlds] done in ${mins}m — ok=${ok} fail=${fail}`);

  const dist = await prisma.expCharacter.groupBy({ by: ["worldId"], _count: { _all: true } });
  console.log("[worlds] distribution:", dist.map((d) => `${d.worldId ?? "null"}=${d._count._all}`).join("  "));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("[worlds] failed:", e); process.exit(1); });
