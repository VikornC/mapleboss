// Client for MSU's internal ranking leaderboard endpoint (unauthenticated).
// This is the only source of a server-wide EXP-ranked character list; the
// official developer API has no ranking/leaderboard endpoint at any tier.
// Undocumented + rate-limited (HTTP 429) — pace politely, back off, parse defensively.

const RANKING_URL = "https://msu.io/maplestoryn/api/msn/ranking";
const PAGE_SIZE = 10; // server-side hard cap, regardless of requested size
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// Raw row as returned by the endpoint.
interface RawRankingRow {
  characterName: string;
  characterAssetKey: string;
  classCode?: string;
  jobCode?: string;
  level: number;
  exp: string; // within-level EXP, as a string
  rank: number;
  popularity?: number;
  guildName?: string;
  imageUrl?: string;
  rankFluctuation?: number;
}

// Normalized row used by the rest of the app.
export interface RankingRow {
  assetKey: string;
  name: string;
  job: string | null;
  level: number;
  exp: number; // within-level EXP
  rank: number;
  guild: string | null;
  imageUrl: string | null;
}

// jobCode -> readable class name. Ported from the Pi scraper (_format_class).
const JOB_MAP: Record<string, string> = {
  JobCode_DARK_KNIGHT: "Dark Knight",
  JobCode_DARKKNIGHT: "Dark Knight",
  JobCode_HERO: "Hero",
  JobCode_PALADIN: "Paladin",
  JobCode_BISHOP: "Bishop",
  JobCode_FIREPOISONMAGE: "F/P Mage",
  JobCode_ICETHUNDERMAGE: "I/L Mage",
  JobCode_BOWMASTER: "Bow Master",
  JobCode_MARKSMAN: "Marksman",
  JobCode_CROSSBOWMASTER: "Crossbow Master",
  JobCode_NIGHTLORD: "Night Lord",
  JobCode_SHADOWER: "Shadower",
  JobCode_CORSAIR: "Corsair",
  JobCode_BUCCANEER: "Buccaneer",
  JobCode_SOULEMASTER: "Soul Master",
  JobCode_EUNWOL4: "Shade",
  JobCode_ARAN4: "Aran",
  JobCode_EVAN9: "Evan",
  JobCode_MERCEDES4: "Mercedes",
};

function formatJob(jobCode?: string): string | null {
  if (!jobCode) return null;
  if (JOB_MAP[jobCode]) return JOB_MAP[jobCode];
  // Strip prefix + trailing advancement digits, title-case the rest.
  const clean = jobCode.replace(/^JobCode_/, "").replace(/\d+$/, "");
  return clean
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
    .trim() || null;
}

function normalize(raw: RawRankingRow): RankingRow {
  return {
    assetKey: raw.characterAssetKey,
    name: raw.characterName,
    job: formatJob(raw.jobCode),
    level: Number(raw.level),
    exp: Number(raw.exp),
    rank: Number(raw.rank),
    guild: raw.guildName || null,
    imageUrl: raw.imageUrl || null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch one ranking page (10 rows). Retries on HTTP 429 with escalating backoff
 * (60s, 120s, ...), mirroring the Pi app's scrape_friends.py. Returns [] on a
 * genuinely empty page; throws after exhausting retries or on a parse failure.
 */
export async function fetchRankingPage(pageNo: number, maxRetries = 5): Promise<RankingRow[]> {
  const url =
    `${RANKING_URL}?rankingFilter.classCode=-1&rankingFilter.jobCode=-1` +
    `&paginationParam.pageNo=${pageNo}&paginationParam.pageSize=${PAGE_SIZE}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    } catch (e) {
      if (attempt === maxRetries - 1) throw e;
      await sleep(30_000);
      continue;
    }

    if (res.status === 429) {
      await sleep(60_000 * (attempt + 1));
      continue;
    }
    if (!res.ok) {
      if (attempt === maxRetries - 1) throw new Error(`Ranking page ${pageNo}: HTTP ${res.status}`);
      await sleep(30_000);
      continue;
    }

    const json = (await res.json()) as { ranking?: RawRankingRow[] };
    const rows = json?.ranking;
    if (!Array.isArray(rows)) {
      if (attempt === maxRetries - 1) throw new Error(`Ranking page ${pageNo}: malformed response`);
      await sleep(30_000);
      continue;
    }
    return rows.map(normalize);
  }
  throw new Error(`Ranking page ${pageNo}: exhausted retries`);
}

/**
 * Lazily sweep the top `topN` ranks, paced by `delayMs` between pages.
 * Stops when a page is empty, rank exceeds topN, or level drops below minLevel
 * (the ranking is EXP-sorted, so once we fall under minLevel we're done).
 */
export async function* sweepTopRanks(
  topN: number,
  minLevel: number,
  { delayMs = 5000 }: { delayMs?: number } = {}
): AsyncGenerator<RankingRow> {
  const lastPage = Math.ceil(topN / PAGE_SIZE);
  for (let pageNo = 1; pageNo <= lastPage; pageNo++) {
    const rows = await fetchRankingPage(pageNo);
    if (rows.length === 0) return;
    for (const row of rows) {
      if (row.rank > topN) return;
      if (row.level < minLevel) return;
      yield row;
    }
    if (pageNo < lastPage) await sleep(delayMs);
  }
}
