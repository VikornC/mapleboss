import { NextRequest, NextResponse } from "next/server";
import { getLevelPlannerAt, getRequiredGain, getAverages } from "@/lib/expStats";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetKey: string }> }
) {
  const { assetKey } = await params;
  const sp = req.nextUrl.searchParams;
  const targetLevel = parseInt(sp.get("targetLevel") ?? "0", 10);
  const targetDate = sp.get("targetDate");
  const rate = sp.get("rate") ?? "daily"; // daily | weekly | monthly | custom
  const customExp = sp.get("customExp") ? parseInt(sp.get("customExp")!, 10) : null;

  const averages = await getAverages(assetKey);

  // Pick daily avg based on rate selector
  let avgPerDay = customExp ?? 0;
  if (!customExp && averages) {
    if (rate === "weekly") avgPerDay = Math.round(averages["7d"].avgPerDay);
    else if (rate === "monthly") avgPerDay = Math.round(averages["30d"].avgPerDay);
    else avgPerDay = averages["7d"].avgPerDay; // "daily" uses 7d avg as proxy
  }

  const result: Record<string, unknown> = { avgPerDay };

  if (targetLevel > 0) {
    result.daysToLevel = await getLevelPlannerAt(assetKey, targetLevel, avgPerDay);
  }

  if (targetDate && targetLevel > 0) {
    result.requiredGain = await getRequiredGain(assetKey, targetLevel, targetDate);
  }

  // Always include quick estimates to Lv250 and Lv275
  const [to250, to275] = await Promise.all([
    getLevelPlannerAt(assetKey, 250, avgPerDay),
    getLevelPlannerAt(assetKey, 275, avgPerDay),
  ]);
  result.to250 = to250;
  result.to275 = to275;

  return NextResponse.json(result);
}
