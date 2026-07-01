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
- [x] Mapped the High Flora classes: MSU's `ClassCode_LEF_WARRIOR` / `LEF_PIRATE` (rendered "Lef Warrior"/"Lef Pirate") were falling into "Other". Aliased `lefwarrior`→**Adele** (Warrior), `lefpirate`→**Ark** (Pirate) in `classes.ts`. "Other" bucket now empty (Adele 11, Ark 2).

## Home redesign + character-page polish (shipped)
- [x] Home (`src/app/page.tsx`) now leads with the EXP Tracker: **live top-5 leaderboard preview** (server component, `revalidate = 3600` ISR, try/catch fallback) + slim value-prop strip + compact icon-left "More tools" row. Narrowed to `max-w-3xl`.
- [x] Removed the standalone Level Calculator (`/tools/exp` + `ExpCalculator.tsx`) — forecasting lives in the per-character pages now.
- [x] Character detail estimate section: dropped the projection chart, auto-defaults target level (275 at 250+, else 250), merged the duplicate Days columns, added **MSU Navigator link** (`msu.io/navigator/character/{assetKey}` — assetKey IS the navigator id).
- [x] Compared A/B home variants live (Option A live-preview vs B static banner); **user picked A**, temp `/home-alt` route removed.

## Pi historical backfill (shipped)
- [x] `scripts/import-pi-to-neon.ts` — idempotent, one snapshot/UTC day, skips days already in Neon. Backfilled **249 snapshots** for all 5 tracked chars (Bloop, Loot, comfy, Aura, Ante) → each now spans **Apr 10 → present** (was May 29+). Pi exp verified = within-level exp (same semantics as Neon).
- [x] **Timezone seam fix:** the lulumi bootstrap (collected/labeled vs UTC) was off-by-one against the PST-collected Pi data → flat/duplicate days (e.g. Loot 6/30 showed ~0 gain). Deleted the 160 misaligned bootstrap rows (32/char, `rank=null`) and re-imported Pi (UTC-normalized, aligns with the crawler). Verified all 5: 82–83 snaps, Apr 10→Jul 1, no duplicate UTC days, no leftover bootstrap. See lesson in `tasks/lessons.md`.

## Deploy status
- [x] All session work pushed to origin/master → **live on www.mapleboss.com** (apex 307-redirects to www).

## Known follow-ups
- [ ] Verify EXP table against live MSU API ground truth (`exp ÷ (expr/100)`)
- [ ] Request MSU Level 2 key for name-based search (contact_builder@nexpace.io)
- [ ] Dead code: unused `sort`/`gainRank` branch in leaderboard route (UI no longer sends `sort`); unused `/api/exp/search` route (autocomplete removed); `/api/exp/stats/[assetKey]/planner` route + helpers; obsolete `scripts/import-pi-data.ts` (targeted pre-migration SQLite `dev.db`).
