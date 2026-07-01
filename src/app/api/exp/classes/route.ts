import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Distinct classes (jobs) with member counts, for the leaderboard class filter.
export async function GET() {
  const groups = await prisma.expCharacter.groupBy({
    by: ["job"],
    where: { rank: { not: null }, job: { not: null } },
    _count: { _all: true },
  });

  const classes = groups
    .filter((g) => g.job)
    .map((g) => ({ job: g.job as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(classes);
}
