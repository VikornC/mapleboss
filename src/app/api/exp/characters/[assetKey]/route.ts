import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;

  const existing = await prisma.expCharacter.findUnique({ where: { assetKey } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expCharacter.delete({ where: { assetKey } });
  return NextResponse.json({ ok: true });
}
