import { NextRequest, NextResponse } from "next/server";
import { getEstimate } from "@/lib/expStats";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;
  const sp = req.nextUrl.searchParams;
  const targetLevel = parseInt(sp.get("targetLevel") ?? "0", 10);
  if (!targetLevel || targetLevel < 1) {
    return NextResponse.json({ error: "targetLevel is required" }, { status: 400 });
  }
  const dailyRaw = sp.get("dailyExp");
  const dailyExp = dailyRaw ? parseInt(dailyRaw, 10) : undefined;

  const result = await getEstimate(assetKey, targetLevel, dailyExp);
  if (!result) return NextResponse.json({ error: "No data" }, { status: 404 });
  return NextResponse.json(result);
}
