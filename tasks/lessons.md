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

## Long Neon writes need the UNPOOLED direct connection
**Correction:** Seeding ~6,844 chars over the pooled `DATABASE_URL` dropped the connection at ~6,808 (pooler killed the long-lived link). 
**Rule:** For migrations and bulk/long-running writes, use `DATABASE_URL_UNPOOLED` (direct). Reserve the pooled URL for short request-scoped queries. Make bulk importers idempotent (dedup on) so a re-run cleanly fills the gap.
