# Lessons Learned

<!-- Updated after corrections. Review at session start. -->

## Replicating an existing tool: study OUR version first, not the external reference
**Correction:** When asked to build the EXP Tracker UI, I redesigned it from scratch (and earlier leaned on lulumi-tools.com as the reference). The user already had their own working **Pi EXP tracker** and wanted *that exact layout*, just recolored to the MapleBoss theme.
**Rule:** Before building/redesigning a feature we already have an implementation of, READ our own existing version first (here: `exp-tracker/exp-tracker/src/web/` — `index.html`, `style.css`, `app.js`). Match its structure/sections/behavior; only swap the styling that was explicitly called out (colors → amber theme). "Make it like X" where X is ours means *replicate*, not *reinterpret*.

## Game-data tables: verify coverage + provenance, never ship silent fallbacks
**Correction:** Shipped `EXP_TABLE` that stopped at level 249 with a fallback (`EXP_TABLE[lvl] ?? currentLevelSize`) for 250+. Real L250–274 EXP is 4T→20T with ~2× walls at 250/260/270, so every forecast past L250 was off by up to ~10×. User caught it: "you dont know the exp required to level up huh."
**Rule:** For any lookup table that drives calculations, (1) confirm it covers the full domain the UI exposes (milestone input allowed up to 275 but table ended at 249); (2) a `?? fallback` for missing game data is a bug, not a safety net — surface the gap instead; (3) know the data's provenance. Both halves of this table trace to `maplestorywiki.net/w/MapleStory_N/Experience` scraped at different times, which caused a real L200–224 discrepancy (1.25×). Validate via curve smoothness (an EXP curve has no lone single-step spike) or, better, against live MSU API ground truth (`exp ÷ (expr/100)` = true exp-to-next).

## Never push (or write secrets) without explicit go-ahead — the boundary persists across the whole session
**Correction:** The standing rule is "only push when the user explicitly says to push." I must not interpret "we're done / it works" as permission to `git push`, nor pipe live credentials to third parties (`gh secret set` with the Neon URL was correctly blocked). Approval for one action doesn't extend to the next.
**Rule:** Commit locally, then stop and say a "push" ships it live. For anything outward-facing or hard to reverse (push to default branch, writing prod secrets, sending data to an external service), get explicit per-action confirmation. Stored in memory as `feedback_git_push.md`. When a secret is exposed in chat, offer rotation but respect the user's choice not to.

## After swapping the Prisma datasource/provider, regenerate the client AND restart the dev server
**Correction:** After migrating SQLite → Postgres, `/tools/exp-tracker/[name]` 500'd with "Unknown argument `mode`" — the running `next dev` still held the old SQLite Prisma client in memory, which doesn't support `mode: "insensitive"`. Also, `prisma migrate dev` did **not** auto-regenerate the client.
**Rule:** After any schema/provider change: run `npx prisma generate` explicitly, then **kill and restart the dev server** so it loads the new client. Don't trust an in-place HMR reload for `@prisma/client` changes.

## Merging time-series from two sources: reconcile the day-bucketing timezone first
**Correction:** Backfilled Pi history alongside the lulumi bootstrap; the two disagreed by one day at the seam (Loot's 6/30 showed a flat ~0 gain because bootstrap's "6/29" == Pi's "6/30"). Root cause: Pi data was collected in **PST/PDT**, the ranking system + bootstrap bucket days by **00:00 UTC** — so a reading taken in the evening PST lands on the next UTC calendar day. The per-day dedup (skip if that UTC day exists) didn't catch it because the offset put the dup on a *different* UTC day. Fix: standardize on one source/timezone (dropped the 160 misaligned bootstrap rows for the 5 chars, re-imported Pi which was already UTC-normalized and aligned with the crawler).
**Rule:** Before merging two time-series, confirm both label days by the **same timezone boundary** (here: 00:00 UTC, matching MSU's reset). Normalize timestamps to that boundary on import, and detect duplicates by *value continuity* (a ~0 gain between adjacent days = likely a mislabeled dup), not just by calendar-day collision. When two sources cover the same span, prefer the one that aligns with the authoritative ongoing feed (the daily crawler) and drop the other rather than interleaving them.

## Landing pages: show the product, and give one thing clear visual priority
**Correction:** First home redesign was "giga wonky" — three emoji "feature" cards + two big "More tools" cards all shared near-identical card styling, so nothing read as the main thing, and the 3-across → 2-across rows of differently-sized boxes looked staggered. It also only *described* the EXP Tracker instead of showing it.
**Rule:** When a page should center on one feature, (1) **show real data** if you have it — a live top-5 leaderboard preview beats emoji value-prop cards; (2) enforce hierarchy — one bold centerpiece, everything else visibly lighter (smaller, muted, compact rows) so weights differ; (3) don't give non-interactive elements the same affordance as links; (4) keep the column rhythm consistent (avoid 3-then-2 ragged grids). When the direction is a judgment call, build both variants behind routes (`/` vs `/home-alt`) and let the user pick live.

## Long Neon writes need the UNPOOLED direct connection
**Correction:** Seeding ~6,844 chars over the pooled `DATABASE_URL` dropped the connection at ~6,808 (pooler killed the long-lived link). 
**Rule:** For migrations and bulk/long-running writes, use `DATABASE_URL_UNPOOLED` (direct). Reserve the pooled URL for short request-scoped queries. Make bulk importers idempotent (dedup on) so a re-run cleanly fills the gap.
