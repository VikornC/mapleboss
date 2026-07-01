/**
 * ONE-TIME history bootstrap from lulumi-tools' public data file.
 *
 * lulumi serves a static /data/rankings.json (~48MB) with ~6,844 characters and
 * ~32 days of per-character history. The game API has no history, and our own
 * crawler only builds it going forward — so this seeds instant history. After
 * this, our daily sweep maintains the data; the seeded rows age out via
 * retention. This is a bootstrap, NOT an ongoing dependency.
 *
 * Run:  npx tsx scripts/import-lulumi-data.ts
 * Env:  LULUMI_FILE=/path/to/rankings.json  (skip the download; use a local copy)
 *       LULUMI_LIMIT=50                      (import only the top N, for testing)
 */
import { readFileSync } from "fs";
import { prisma } from "../src/lib/db";
import { EXP_TABLE, cumulativeExp } from "../src/lib/expData";

const URL = "https://lulumi-tools.com/data/rankings.json";

interface LuluHistory { snapshotDate: string; level: number; levelExpPercent: number }
interface LuluChar {
  characterAssetKey: string;
  name: string;
  job: string | null;
  worldId: string | null;
  imageUrl: string | null;
  rank: number;
  level: number;
  exp: number;
  levelExpPercent: number;
  dailyGain: number | null;
  weeklyGain: number | null;
  monthlyGain: number | null;
  history: LuluHistory[];
}

const bg = (n: number | null | undefined) => (n != null ? BigInt(Math.round(n)) : null);
const expFromPct = (level: number, pct: number) => Math.round((EXP_TABLE[level] ?? 0) * (pct / 100));

async function main() {
  const file = process.env.LULUMI_FILE;
  const limit = process.env.LULUMI_LIMIT ? parseInt(process.env.LULUMI_LIMIT, 10) : Infinity;

  console.log(file ? `[lulumi] reading ${file}` : `[lulumi] downloading ${URL} (~48MB)...`);
  const raw = file ? readFileSync(file, "utf8") : await (await fetch(URL)).text();
  const data = JSON.parse(raw) as { characters: LuluChar[] };
  const chars = data.characters.slice(0, limit);
  console.log(`[lulumi] ${chars.length} characters to import`);

  let created = 0, skipped = 0, done = 0;

  for (const c of chars) {
    const character = await prisma.expCharacter.upsert({
      where: { assetKey: c.characterAssetKey },
      create: {
        assetKey: c.characterAssetKey,
        name: c.name, className: c.job, job: c.job, worldId: c.worldId,
        imageUrl: c.imageUrl, rank: c.rank, level: c.level,
        exp: BigInt(Math.round(c.exp)), expPct: c.levelExpPercent,
        dailyGain: bg(c.dailyGain), weeklyGain: bg(c.weeklyGain), monthlyGain: bg(c.monthlyGain),
      },
      update: {
        name: c.name, className: c.job, job: c.job, worldId: c.worldId,
        imageUrl: c.imageUrl, rank: c.rank, level: c.level,
        exp: BigInt(Math.round(c.exp)), expPct: c.levelExpPercent,
        dailyGain: bg(c.dailyGain), weeklyGain: bg(c.weeklyGain), monthlyGain: bg(c.monthlyGain),
      },
    });

    // Days already stored for this character (dedup — e.g. Loot's Pi history).
    // FRESH_SEED=1 skips this query when seeding an empty DB (fewer round-trips).
    const haveDays = new Set<string>();
    if (process.env.FRESH_SEED !== "1") {
      const existing = await prisma.expSnapshot.findMany({
        where: { characterId: character.id },
        select: { snappedAt: true },
      });
      for (const s of existing) haveDays.add(s.snappedAt.toISOString().slice(0, 10));
    }

    // Build snapshot rows from history (ascending), deriving exp + per-day gain.
    const rows: { characterId: number; level: number; exp: bigint; expPct: number; gain: bigint | null; snappedAt: Date }[] = [];
    const hist = [...c.history].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
    let prevCum: number | null = null;
    for (const h of hist) {
      const exp = expFromPct(h.level, h.levelExpPercent);
      const cum = cumulativeExp(h.level, exp);
      const gain = prevCum != null ? Math.max(0, Math.round(cum - prevCum)) : null;
      prevCum = cum;
      if (haveDays.has(h.snapshotDate)) { skipped++; continue; }
      rows.push({
        characterId: character.id,
        level: h.level,
        exp: BigInt(exp),
        expPct: h.levelExpPercent,
        gain: gain != null ? BigInt(gain) : null,
        snappedAt: new Date(`${h.snapshotDate}T00:00:00.000Z`),
      });
    }
    if (rows.length) {
      await prisma.expSnapshot.createMany({ data: rows });
      created += rows.length;
    }

    if (++done % 500 === 0) console.log(`[lulumi] ${done}/${chars.length} chars, ${created} snapshots...`);
  }

  console.log(`[lulumi] done — chars=${chars.length} snapshotsCreated=${created} daysSkipped=${skipped}`);
}

main()
  .catch((e) => { console.error("[lulumi] failed:", e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
