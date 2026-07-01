import { NextRequest, NextResponse } from "next/server";
import { getAverages } from "@/lib/expStats";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;
  const averages = await getAverages(assetKey);
  if (!averages) return NextResponse.json({ error: "Not enough data" }, { status: 404 });
  return NextResponse.json(averages);
}
