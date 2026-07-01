const BASE = "https://openapi.msu.io/v1rc1";

function apiKey(): string {
  const key = process.env.MSU_API_KEY;
  if (!key) throw new Error("MSU_API_KEY is not set");
  return key;
}

async function msuFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-nxopen-api-key": apiKey() },
    next: { revalidate: 0 },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message ?? `MSU API error ${res.status}`);
  }
  return json.data as T;
}

// ---- Types (based on confirmed lulumi data + API docs) ----

export interface MsuCharacterSearchResult {
  assetKey: string;
  tokenId?: string;
  name: string;
  class?: string;
  server?: string;
  level?: number;
  imageUrl?: string;
  price?: number;
}

export interface MsuCharacter {
  assetKey: string;
  tokenId?: string;
  name: string;
  class?: string;
  server?: string;
  level: number;
  exp: number;       // raw EXP within current level
  expPct: number;    // percentage e.g. 25.015
  levelRank?: number;
  imageUrl?: string;
}

interface SearchResponse {
  characters: MsuCharacterSearchResult[];
  paginationResult: {
    totalCount: number;
    currPageNo: number;
    pageSize: number;
    isLastPage: boolean;
  };
}

// ---- API calls ----

export async function searchCharactersByName(
  name: string
): Promise<MsuCharacterSearchResult[]> {
  const params = new URLSearchParams({ "filter.name": name });
  const data = await msuFetch<SearchResponse>(`/search/characters?${params}`);
  return data.characters ?? [];
}

export async function getCharacter(assetKey: string): Promise<MsuCharacter> {
  const data = await msuFetch<{ character: Record<string, unknown> }>(
    `/characters/${encodeURIComponent(assetKey)}`
  );
  const c = data.character as Record<string, unknown>;
  const common = (c.common ?? {}) as Record<string, unknown>;
  const image = (c.image ?? {}) as Record<string, unknown>;
  const job = (common.job ?? {}) as Record<string, unknown>;
  const world = (common.world ?? {}) as Record<string, unknown>;

  return {
    assetKey: (c.assetKey ?? assetKey) as string,
    tokenId: undefined,
    name: (common.name ?? "") as string,
    class: (job.jobName ?? job.className) as string | undefined,
    server: (world.name) as string | undefined,
    level: Number(common.level ?? 0),
    exp: Number(common.exp ?? 0),
    expPct: parseFloat((common.expr as string) ?? "0"),
    levelRank: common.popularity != null ? Number(common.popularity) : undefined,
    imageUrl: (image.imageUrl) as string | undefined,
  };
}
