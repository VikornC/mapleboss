import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Instant name search over the swept character DB. (The official dev API has no
// player-name search at any key tier — only marketplace listings — so search is
// served from our own leaderboard data.)
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const matches = await prisma.expCharacter.findMany({
    where: { name: { contains: name, mode: "insensitive" } },
    orderBy: [{ rank: "asc" }],
    take: 10,
    select: {
      assetKey: true,
      name: true,
      job: true,
      guild: true,
      imageUrl: true,
      level: true,
      rank: true,
    },
  });

  return NextResponse.json(
    matches.map((c) => ({
      assetKey: c.assetKey,
      name: c.name,
      class: c.job,
      server: c.guild,
      level: c.level,
      rank: c.rank,
      imageUrl: c.imageUrl,
    }))
  );
}
