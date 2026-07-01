import { NextRequest, NextResponse } from "next/server";
import { getDailyGains, getPeriodGain } from "@/lib/expStats";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;
  const sp = req.nextUrl.searchParams;
  const period = sp.get("period") ?? "daily";
  const days = parseInt(sp.get("days") ?? "30", 10);

  if (period === "summary") {
    const [d, w, m] = await Promise.all([
      getPeriodGain(assetKey, 1),
      getPeriodGain(assetKey, 7),
      getPeriodGain(assetKey, 30),
    ]);
    return NextResponse.json({ daily: d, weekly: w, monthly: m });
  }

  const gains = await getDailyGains(assetKey, days);
  return NextResponse.json(gains);
}
