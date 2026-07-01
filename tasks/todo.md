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

## Production deploy (LIVE)
- [x] Postgres migration: swapped `@prisma/adapter-better-sqlite3` → `@prisma/adapter-pg`; `provider = "postgresql"`.
- [x] Neon Postgres via Vercel integration — pooled `DATABASE_URL` + direct `DATABASE_URL_UNPOOLED` (migrations).
- [x] `prisma.config.ts` uses UNPOOLED for migrate; `src/lib/db.ts` uses pooled `DATABASE_URL` + `dotenv/config`.
- [x] Seeded Neon from lulumi bootstrap: 6,844 characters, ~195,906 snapshots (May 29 → Jun 29).
- [x] `postinstall: prisma generate`; GitHub Actions builds the Postgres client on CI.
- [x] Daily sweep live on GitHub Actions (`DATABASE_URL` secret + `SWEEP_ENABLED=true` var set via GH UI).
- [x] Fallback cron: second schedule `40 12 * * *` alongside `40 0 * * *` (concurrency + per-day dedup → no-op if morning succeeded).

## Per-character pages + SEO (built)
- [x] `src/app/tools/exp-tracker/[name]/page.tsx` — server component, name-resolved case-insensitively, highest rank on collision.
- [x] `generateMetadata` → indexable `<title>`/description per character (the lulumi/MapleBot search-traffic play).
- [x] `src/components/CharacterDetail.tsx` — detail view extracted from ExpTracker; keyed by assetKey.
- [x] `[name]/not-found.tsx` — friendly "character not found" fallback.
- [x] ExpTracker rows: `<Link>` on name (crawlable anchor) + whole-row `router.push` for UX.

## Leaderboard polish (built)
- [x] Case-insensitive search (Postgres `mode: "insensitive"`) — search filters the table directly.
- [x] Class filter: `src/lib/classes.ts` canonicalizes raw spellings (Bowmaster/Bow Master, Arch Mage variants, etc.) → 37 raw → 31 canonical; archetype tabs (Warrior/Mage/Archer/Thief/Pirate) + class chips.
- [x] `/api/exp/classes` — groupBy job, canonicalize + merge counts, tag archetype.
- [x] `/api/exp/leaderboard` — `job` param resolves canonical → raw variants; returns `classRank` + `updatedAt`.
- [x] "Data updated {…} UTC · refreshes daily" indicator (from max snapshot time, `timeZone: "UTC"`).
- [x] Removed sort toggle (rank-only) and search autocomplete preview per user feedback.
- [x] `npm run build` clean; page returns 200.

## Known follow-ups
- [ ] **Push** stacked local commits to origin/master (redeploys Vercel) — awaiting explicit "push".
- [ ] Confirm the manual GH Actions crawl advanced "Data updated" to the current day.
- [ ] Verify EXP table against live MSU API ground truth (`exp ÷ (expr/100)`)
- [ ] Request MSU Level 2 key for name-based search (contact_builder@nexpace.io)
- [ ] Optionally import Pi history for other characters (Bloop, comfy, aura, ante)
- [ ] Dead code: unused `sort`/`gainRank` branch in leaderboard route (UI no longer sends `sort`); unused `/api/exp/search` route (autocomplete removed); `/api/exp/stats/[assetKey]/planner` route + helpers.
