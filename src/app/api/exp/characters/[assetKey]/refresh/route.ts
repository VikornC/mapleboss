import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCharacter } from "@/lib/msuApi";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;

  const record = await prisma.expCharacter.findUnique({ where: { assetKey } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const char = await getCharacter(assetKey);

    await prisma.expCharacter.update({
      where: { assetKey },
      data: {
        name: char.name,
        className: char.class ?? null,
        server: char.server ?? null,
        imageUrl: char.imageUrl ?? null,
        levelRank: char.levelRank ?? null,
      },
    });

    const snapshot = await prisma.expSnapshot.create({
      data: {
        characterId: record.id,
        level: char.level,
        exp: BigInt(Math.round(char.exp)),
        expPct: char.expPct,
      },
    });

    return NextResponse.json({
      ok: true,
      level: char.level,
      exp: char.exp,
      expPct: char.expPct,
      snappedAt: snapshot.snappedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
