import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCharacter } from "@/lib/msuApi";

export async function GET() {
  const characters = await prisma.expCharacter.findMany({
    orderBy: { addedAt: "desc" },
    include: {
      snapshots: {
        orderBy: { snappedAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(
    characters.map((c) => {
      const latest = c.snapshots[0];
      return {
        assetKey: c.assetKey,
        name: c.name,
        className: c.className,
        server: c.server,
        imageUrl: c.imageUrl,
        levelRank: c.levelRank,
        level: latest?.level ?? null,
        expPct: latest?.expPct ?? null,
        lastUpdated: latest?.snappedAt ?? null,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const assetKey = body?.assetKey?.trim();
  if (!assetKey) return NextResponse.json({ error: "assetKey is required" }, { status: 400 });

  try {
    const char = await getCharacter(assetKey);

    const record = await prisma.expCharacter.upsert({
      where: { assetKey },
      create: {
        assetKey,
        name: char.name,
        className: char.class ?? null,
        server: char.server ?? null,
        imageUrl: char.imageUrl ?? null,
        levelRank: char.levelRank ?? null,
      },
      update: {
        name: char.name,
        className: char.class ?? null,
        server: char.server ?? null,
        imageUrl: char.imageUrl ?? null,
        levelRank: char.levelRank ?? null,
      },
    });

    await prisma.expSnapshot.create({
      data: {
        characterId: record.id,
        level: char.level,
        exp: BigInt(Math.round(char.exp)),
        expPct: char.expPct,
      },
    });

    return NextResponse.json({ ok: true, assetKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add character";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
