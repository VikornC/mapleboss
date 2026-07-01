/**
 * Import Pi app historical snapshots into the LIVE Neon tracker DB.
 *
 * Pi holds months of earlier history (Apr 9 →) for a handful of characters that
 * Neon only has from the May 29 lulumi bootstrap onward. This backfills the gap.
 *
 * Behavior:
 *  - One snapshot per UTC day (Pi scraped several times/day → take the day's last row).
 *  - Skips any UTC day the character already has in Neon → idempotent, overlap-safe.
 *  - Matches Pi name → Neon assetKey. exp is within-level EXP in both (verified).
 *
 * Dry-run by default (reports what WOULD be inserted). Set IMPORT=1 to write.
 *   Preview:  npx tsx scripts/import-pi-to-neon.ts
 *   Commit:   IMPORT=1 npx tsx scripts/import-pi-to-neon.ts
 */
import path from "path";
import Database from "better-sqlite3";
import { prisma } from "../src/lib/db";
import { EXP_TABLE } from "../src/lib/expData";

const PI_DB_PATH = path.join(process.cwd(), "exp-tracker/exp-tracker/data/exp_tracker.db");
const COMMIT = process.env.IMPORT === "1";

// Pi ign → MSU assetKey (resolved from the live Neon leaderboard).
const ASSET_KEY_MAP: Record<string, string> = {
  Bloop: "CHARd0mk0qhvjlcc73e3dej0",
  Loot: "CHARd0is8pjfpavs73dovpa0",
  comfy: "CHARd0ovj336t7hs738vmp80",
  aura: "CHARd0ttv2m875kc73cjltt0",
  ante: "CHARd0lod0eu8blc73bn4klg",
};

interface PiSnap { level: number; exp: number; rank: number; timestamp: string }

function expPctFor(level: number, exp: bigint): number {
  const toNext = EXP_TABLE[level];
  if (!toNext) return 0;
  return Math.min(100, (Number(exp) / toNext) * 100);
}
function utcDayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}
function startOfUtcDay(iso: string): Date {
  return new Date(utcDayKey(iso) + "T00:00:00.000Z");
}

async function main() {
  const piDb = new Database(PI_DB_PATH, { readonly: true });
  console.log(COMMIT ? "=== IMPORT (writing to Neon) ===" : "=== DRY RUN (no writes) ===\n");

  let grandNew = 0;
  for (const [ign, assetKey] of Object.entries(ASSET_KEY_MAP)) {
    const piChar = piDb
      .prepare("SELECT id FROM characters WHERE ign = ?")
      .get(ign) as { id: number } | undefined;
    if (!piChar) { console.log(`${ign}: not found in Pi DB`); continue; }

    const neon = await prisma.expCharacter.findUnique({ where: { assetKey }, select: { id: true } });
    if (!neon) { console.log(`${ign}: assetKey ${assetKey} not in Neon`); continue; }

    // One Pi row per UTC day: keep the latest timestamp of each day.
    const rows = piDb
      .prepare("SELECT level, exp, rank, timestamp FROM snapshots WHERE character_id = ? ORDER BY timestamp ASC")
      .all(piChar.id) as PiSnap[];
    const byDay = new Map<string, PiSnap>();
    for (const r of rows) byDay.set(utcDayKey(r.timestamp), r); // last write per day wins

    let skipped = 0, inserted = 0;
    const insertedDays: string[] = [];
    for (const [day, r] of byDay) {
      const dayStart = startOfUtcDay(r.timestamp);
      const nextDay = new Date(dayStart.getTime() + 86_400_000);
      const existing = await prisma.expSnapshot.findFirst({
        where: { characterId: neon.id, snappedAt: { gte: dayStart, lt: nextDay } },
        select: { id: true },
      });
      if (existing) { skipped++; continue; }

      if (COMMIT) {
        const exp = BigInt(r.exp);
        await prisma.expSnapshot.create({
          data: {
            characterId: neon.id,
            level: r.level,
            exp,
            expPct: expPctFor(r.level, exp),
            rank: r.rank,
            snappedAt: new Date(r.timestamp),
          },
        });
      }
      inserted++;
      insertedDays.push(day);
    }
    grandNew += inserted;
    const range = insertedDays.length ? `${insertedDays[0]} → ${insertedDays[insertedDays.length - 1]}` : "—";
    console.log(
      `${ign.padEnd(8)} pi_days=${String(byDay.size).padStart(3)}  ` +
      `already_in_neon=${String(skipped).padStart(3)}  ${COMMIT ? "inserted" : "would_insert"}=${String(inserted).padStart(3)}  [${range}]`
    );
  }

  console.log(`\nTotal ${COMMIT ? "inserted" : "to insert"}: ${grandNew} snapshots`);
  if (!COMMIT) console.log("Re-run with  IMPORT=1  to commit.");
  await prisma.$disconnect();
  piDb.close();
}
main().catch((e) => { console.error("ERR", e); process.exit(1); });
