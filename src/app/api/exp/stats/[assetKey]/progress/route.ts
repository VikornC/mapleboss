import { NextRequest, NextResponse } from "next/server";
import { getLevelProgress } from "@/lib/expStats";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const progress = await getLevelProgress(assetKey, days);
  return NextResponse.json(progress);
}
