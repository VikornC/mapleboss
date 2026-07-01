/**
 * One-time import of Pi app historical snapshots into the new tracker DB.
 * Run with: npx tsx scripts/import-pi-data.ts
 */
import path from "path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { EXP_TABLE } from "../src/lib/expData";

const PI_DB_PATH = path.join(process.cwd(), "exp-tracker/exp-tracker/data/exp_tracker.db");
const NEW_DB_PATH = path.join(process.cwd(), "dev.db");

// Map Pi character names to their MSU assetKeys
const ASSET_KEY_MAP: Record<string, string> = {
  Loot: "CHARd0is8pjfpavs73dovpa0",
  // Add more here if needed: CharName: "CHARxxxxxxxxxx"
};

function deriveExpPct(level: number, exp: bigint): number {
  const expToNext = EXP_TABLE[level];
  if (!expToNext) return 0;
  return Math.min(100, (Number(exp) / expToNext) * 100);
}

async function main() {
  const piDb = new Database(PI_DB_PATH, { readonly: true });
  const newDb = new Database(NEW_DB_PATH);
  const adapter = new PrismaBetterSqlite3({ url: NEW_DB_PATH });
  const prisma = new PrismaClient({ adapter });

  const piChars = piDb.prepare("SELECT * FROM characters").all() as {
    id: number; ign: string; class_name: string; last_known_rank: number; created_at: string; image_url: string;
  }[];

  for (const piChar of piChars) {
    const assetKey = ASSET_KEY_MAP[piChar.ign];
    if (!assetKey) {
      console.log(`Skipping ${piChar.ign} — no assetKey mapping`);
      continue;
    }

    // Upsert the character
    const char = await prisma.expCharacter.upsert({
      where: { assetKey },
      create: {
        assetKey,
        name: piChar.ign,
        className: piChar.class_name,
        server: null,
        imageUrl: null,
        levelRank: piChar.last_known_rank,
      },
      update: {},
    });

    // Fetch Pi snapshots for this character
    const piSnaps = piDb.prepare(
      "SELECT * FROM snapshots WHERE character_id = ? ORDER BY timestamp ASC"
    ).all(piChar.id) as {
      id: number; character_id: number; level: number; exp: number; rank: number; timestamp: string;
    }[];

    console.log(`Importing ${piSnaps.length} snapshots for ${piChar.ign}...`);

    let imported = 0;
    for (const snap of piSnaps) {
      const exp = BigInt(snap.exp);
      const expPct = deriveExpPct(snap.level, exp);
      const snappedAt = new Date(snap.timestamp);

      // Skip if a snapshot already exists within 30 minutes of this one
      const existing = await prisma.expSnapshot.findFirst({
        where: {
          characterId: char.id,
          snappedAt: {
            gte: new Date(snappedAt.getTime() - 30 * 60 * 1000),
            lte: new Date(snappedAt.getTime() + 30 * 60 * 1000),
          },
        },
      });
      if (existing) continue;

      await prisma.expSnapshot.create({
        data: {
          characterId: char.id,
          level: snap.level,
          exp,
          expPct,
          snappedAt,
        },
      });
      imported++;
    }

    console.log(`  ✓ Imported ${imported} new snapshots for ${piChar.ign}`);
  }

  await prisma.$disconnect();
  piDb.close();
  newDb.close();
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
