import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Leaderboard list, served entirely from denormalized ExpCharacter fields
// (populated by the daily sweep). No external calls, no per-row snapshot joins.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const search = sp.get("search")?.trim() ?? "";
  const job = sp.get("job")?.trim() ?? "";
  const sort = sp.get("sort") === "dailyGain" ? "dailyGain" : "rank";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "50", 10)));

  const where = {
    rank: { not: null },
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(job && job !== "all" ? { job } : {}),
  };

  const orderBy =
    sort === "dailyGain"
      ? [{ dailyGain: "desc" as const }, { rank: "asc" as const }]
      : [{ rank: "asc" as const }];

  const [total, rows, latest] = await Promise.all([
    prisma.expCharacter.count({ where }),
    prisma.expCharacter.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        assetKey: true,
        name: true,
        job: true,
        guild: true,
        imageUrl: true,
        rank: true,
        level: true,
        expPct: true,
        dailyGain: true,
        weeklyGain: true,
        monthlyGain: true,
      },
    }),
    prisma.expSnapshot.aggregate({ _max: { snappedAt: true } }),
  ]);

  // gainRank: dense rank by dailyGain across the whole tracked set (cheap: one
  // ordered scan of a single small column).
  let gainRankByKey: Record<string, number> = {};
  if (rows.length > 0) {
    const allByGain = await prisma.expCharacter.findMany({
      where: { rank: { not: null }, dailyGain: { not: null } },
      orderBy: [{ dailyGain: "desc" }],
      select: { assetKey: true },
    });
    gainRankByKey = Object.fromEntries(allByGain.map((c, i) => [c.assetKey, i + 1]));
  }

  return NextResponse.json({
    total,
    page,
    pageSize,
    updatedAt: latest._max.snappedAt,
    characters: rows.map((c, i) => ({
      assetKey: c.assetKey,
      name: c.name,
      job: c.job,
      guild: c.guild,
      imageUrl: c.imageUrl,
      rank: c.rank,
      // Position within the current filtered/sorted list — the "class rank" when a job filter is on.
      classRank: job && job !== "all" ? (page - 1) * pageSize + i + 1 : null,
      level: c.level,
      expPct: c.expPct,
      dailyGain: c.dailyGain != null ? Number(c.dailyGain) : null,
      weeklyGain: c.weeklyGain != null ? Number(c.weeklyGain) : null,
      monthlyGain: c.monthlyGain != null ? Number(c.monthlyGain) : null,
      gainRank: gainRankByKey[c.assetKey] ?? null,
    })),
  });
}
