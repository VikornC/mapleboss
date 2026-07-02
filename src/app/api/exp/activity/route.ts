import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canonicalClass } from "@/lib/classes";

// Daily count of tracked characters that gained EXP (snapshot.gain > 0), with
// optional job / minimum-level / time-range filters. Incomplete days (bootstrap
// ramp-up, the Jun-30 crawl gap) are gated out via the unfiltered gained count.
interface DayRow { day: string; all_gained: number; gained: number }

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const job = sp.get("job")?.trim() ?? "all";
  const world = sp.get("world")?.trim() ?? "all";
  const minLevel = Math.max(0, parseInt(sp.get("minLevel") ?? "0", 10) || 0);
  const rangeParam = sp.get("days") ?? "all";

  const cutoff =
    rangeParam === "all"
      ? new Date(0)
      : new Date(Date.now() - Math.max(1, parseInt(rangeParam, 10) || 30) * 86_400_000);

  // Resolve a canonical class name to the raw job spellings stored in the DB.
  let variants: string[] | null = null;
  if (job && job !== "all") {
    const rawJobs = await prisma.expCharacter.findMany({
      where: { job: { not: null } },
      distinct: ["job"],
      select: { job: true },
    });
    variants = rawJobs.map((r) => r.job!).filter((rj) => canonicalClass(rj) === job);
    if (!variants.length) variants = ["__none__"];
  }

  // Shared job + min-level predicate; positional params start after $1 (cutoff).
  function jobLevelPredicate(bag: unknown[]): string {
    let s = "";
    if (minLevel > 0) { bag.push(minLevel); s += ` AND s."level" >= $${bag.length}`; }
    if (variants) { bag.push(variants); s += ` AND c."job" = ANY($${bag.length})`; }
    return s;
  }

  // Main daily series — respects job / min-level / world.
  const params: unknown[] = [cutoff];
  let extra = jobLevelPredicate(params);
  if (world && world !== "all") { params.push(world); extra += ` AND c."worldId" = $${params.length}`; }

  const sql = `
    SELECT to_char(s."snappedAt", 'YYYY-MM-DD') AS day,
      COUNT(DISTINCT s."characterId") FILTER (WHERE s."gain" > 0)::int AS all_gained,
      COUNT(DISTINCT s."characterId") FILTER (WHERE s."gain" > 0${extra})::int AS gained
    FROM "ExpSnapshot" s
    JOIN "ExpCharacter" c ON c."id" = s."characterId"
    WHERE s."snappedAt" >= $1
    GROUP BY day
    ORDER BY day
  `;

  const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as DayRow[];

  // Keep only days with a complete crawl (unfiltered gained count is substantial).
  const series = rows
    .filter((r) => r.all_gained > 1000)
    .map((r) => ({ date: r.day, count: r.gained }));

  const counts = series.map((s) => s.count);
  const avg = counts.length ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
  const peak = series.reduce<{ date: string; count: number } | null>(
    (best, s) => (!best || s.count > best.count ? { date: s.date, count: s.count } : best),
    null
  );

  // Per-world share of active characters over the range (respects job/min-level, ignores world).
  const splitParams: unknown[] = [cutoff];
  const splitExtra = jobLevelPredicate(splitParams);
  const splitSql = `
    SELECT c."worldId" AS world, COUNT(DISTINCT s."characterId")::int AS active
    FROM "ExpSnapshot" s
    JOIN "ExpCharacter" c ON c."id" = s."characterId"
    WHERE s."snappedAt" >= $1 AND s."gain" > 0 AND c."worldId" IS NOT NULL${splitExtra}
    GROUP BY c."worldId"
  `;
  const splitRows = (await prisma.$queryRawUnsafe(splitSql, ...splitParams)) as { world: string; active: number }[];
  const splitTotal = splitRows.reduce((a, r) => a + r.active, 0);
  const worldSplit = splitRows
    .map((r) => ({ world: r.world, active: r.active, pct: splitTotal ? Math.round((r.active / splitTotal) * 1000) / 10 : 0 }))
    .sort((a, b) => b.active - a.active);

  return NextResponse.json({ series, avg, peak, worldSplit });
}
