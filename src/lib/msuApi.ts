const MSU_BASE = "https://openapi.msu.io";

export interface DynamicPrice {
  currentPrice: {
    price: string;       // wei string e.g. "27912600000000000000000"
    startDate: string;
    endDate: string;
    step: string;
  };
  previousPrice: {
    price: string;
    startDate: string;
    endDate: string;
    step: string;
  };
}

export interface ItemPriceData {
  starforce: Record<string, DynamicPrice>;   // key = star number "0"-"24"
  potential: Record<string, DynamicPrice>;   // key = cube item ID e.g. "5062009"
}

// Convert wei string to NESO number
export function weiToNeso(wei: string): number {
  return Number(BigInt(wei) / BigInt(10 ** 15)) / 1000;
}

async function msuFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.MSU_API_KEY;
  if (!apiKey) throw new Error("MSU_API_KEY is not set");

  const res = await fetch(`${MSU_BASE}${path}`, {
    headers: { "x-nxopen-api-key": apiKey },
    next: { revalidate: 3600 }, // 1-hour cache
  });

  if (!res.ok) {
    throw new Error(`MSU API ${res.status} for ${path}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`MSU API error: ${json.error.message}`);
  }

  return json.data as T;
}

export async function fetchItemPrice(itemId: number): Promise<ItemPriceData> {
  const data = await msuFetch<{ currentPrices: ItemPriceData }>(
    `/v1rc1/enhancement/items/${itemId}/dynamicprice`
  );
  return data.currentPrices;
}

export function getItemImageUrl(itemId: number): string {
  return `https://api-static.msu.io/itemimages/icon/${itemId}.png`;
}
