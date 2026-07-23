// Client for MSU's unauthenticated navigator /info endpoint. Unlike msuApi.ts
// (the API-key openapi), this needs no key and exposes fields the ranking feed
// omits — notably `totalExp` (EXP required to complete the current level) and
// `worldId`. We use `totalExp` to keep the live EXP-per-level curve fresh.

const UA = "Mozilla/5.0";
const INFO_URL = (key: string) =>
  `https://msu.io/navigator/api/navigator/characters/${encodeURIComponent(key)}/info`;

export interface NavigatorInfo {
  level: number;
  exp: number; // within-level EXP
  totalExp: number; // EXP required to finish this level (class-independent)
  worldId: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a character's live navigator info. Retries transient failures (incl.
 * 429/403 like the ranking client). Returns null if unavailable after retries.
 */
export async function fetchNavigatorInfo(
  assetKey: string,
  maxRetries = 3
): Promise<NavigatorInfo | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(INFO_URL(assetKey), {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        return null;
      }
      const json = (await res.json()) as {
        character?: { common?: Record<string, unknown> };
        common?: Record<string, unknown>;
      };
      // Current shape is character.common.*; fall back to a flat common.* just in case.
      const c = json?.character?.common ?? json?.common;
      if (!c) return null;
      const totalExp = Number(c.totalExp ?? 0);
      const level = Number(c.level ?? 0);
      if (!level || !totalExp) return null;
      return {
        level,
        exp: Number(c.exp ?? 0),
        totalExp,
        worldId: (typeof c.worldId === "string" ? c.worldId.trim() : "") || null,
      };
    } catch {
      await sleep(500 * (attempt + 1));
    }
  }
  return null;
}
