import { NextRequest, NextResponse } from "next/server";
import { getItemsByTier, TIERS, type GearTier } from "@/lib/enhanceData";
import { fetchItemPrice, getItemImageUrl } from "@/lib/msuApi";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  const tier = req.nextUrl.searchParams.get("tier") as GearTier | null;

  if (!tier || !TIERS.includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const items = getItemsByTier(tier);

  const results = await Promise.all(
    items.map(async (item, i) => {
      // Stagger requests to stay within 1 req/sec rate limit
      await sleep(i * 1100);
      try {
        const price = await fetchItemPrice(item.id);
        return { item, price, imageUrl: getItemImageUrl(item.id) };
      } catch {
        return { item, price: null, imageUrl: getItemImageUrl(item.id) };
      }
    })
  );

  return NextResponse.json({ items: results });
}
