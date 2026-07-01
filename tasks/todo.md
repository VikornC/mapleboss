# MSN Battle Calc — Task Tracker

## Current Sprint — EXP Tracker
- [x] Prisma schema (ExpCharacter, ExpSnapshot) + SQLite adapter (v7)
- [x] MSU API client (server-side only; parses nested `common.*` response)
- [x] Stats lib: daily gains, 7/14/30/90d averages, level progress, estimate+milestones
- [x] API routes: search, characters CRUD/refresh, stats (summary/gains/averages/progress/estimate)
- [x] Import 85 historical Pi snapshots for Loot (Apr 10 → Jun 30)
- [x] ExpTracker UI rebuilt to match the Pi tracker layout, recolored to amber theme
- [x] EXP_TABLE extended to L274 (was 249); MAX_LEVEL 250 → 275
- [x] NavBar "EXP Tracker" link
- [x] `npm run build` clean

## Leaderboard crawler re-architecture (built)
- [x] Confirmed (via docs.msu.io + reverse-engineering lulumi) the only data source is the
      internal ranking endpoint; lulumi = static GitHub Pages SPA fed by a once-daily bot.
- [x] Schema: ExpCharacter +rank/job/guild/level/exp/expPct/daily|weekly|monthlyGain; ExpSnapshot +rank/gain.
- [x] `src/lib/rankingApi.ts` — paged client (10/page), 5s pacing, 60s 429 backoff.
- [x] `src/lib/expData.ts` — `cumulativeExp` (prefix sums); `expStats.ts` — JST-reset period gains.
- [x] `src/lib/ingest.ts` — ingestSweep (dedup/day, denorm gains) + pruneOldSnapshots.
- [x] `scripts/sweep-ranking.ts` + `npm run sweep` + `.github/workflows/exp-sweep.yml` (daily cron, inert w/o secrets).
- [x] `/api/exp/leaderboard` (search/sort/paginate) + `/api/exp/search` → DB.
- [x] `ExpTracker.tsx` rebuilt: leaderboard table + search + click→Pi-style detail.
- [x] Verified: small live sweep, dedup, Loot detail stats, build clean. expPct matches lulumi (9.143).
- Deviation: retention 35→400 days (35d deletes imported history + can't feed 90d charts).

## Known follow-ups
- [ ] Verify EXP table against live MSU API ground truth (`exp ÷ (expr/100)`)
- [ ] Request MSU Level 2 key for name-based search (contact_builder@nexpace.io)
- [ ] Optionally import Pi history for other characters (Bloop, comfy, aura, ante)
- [ ] Remove now-unused `/api/exp/stats/[assetKey]/planner` route + helpers (dead code)
