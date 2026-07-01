import { NextRequest, NextResponse } from "next/server";
import { getCharacterSummary } from "@/lib/expStats";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;
  const summary = await getCharacterSummary(assetKey);
  if (!summary) return NextResponse.json({ error: "No data" }, { status: 404 });
  return NextResponse.json(summary);
}
