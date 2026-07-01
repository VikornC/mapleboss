import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canonicalClass, archetypeOf } from "@/lib/classes";

// Distinct classes with member counts, canonicalized (variants merged) and
// tagged with archetype, for the leaderboard class filter.
export async function GET() {
  const groups = await prisma.expCharacter.groupBy({
    by: ["job"],
    where: { rank: { not: null }, job: { not: null } },
    _count: { _all: true },
  });

  // Merge raw spellings into canonical names.
  const merged = new Map<string, number>();
  for (const g of groups) {
    const canon = canonicalClass(g.job);
    if (!canon) continue;
    merged.set(canon, (merged.get(canon) ?? 0) + g._count._all);
  }

  const classes = [...merged.entries()]
    .map(([name, count]) => ({ name, archetype: archetypeOf(name), count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(classes);
}
