# MSN Battle Calc — CLAUDE.md

## Project Overview
MapleStory N tools suite, targeting public release at **mapleboss.com**. Started as a boss HP database + damage calculator, expanding into a full player tools suite.

- **Stack**: Next.js (App Router) + Prisma v7 + PostgreSQL (Neon, both dev & prod via `@prisma/adapter-pg`)
- **Style**: Tailwind CSS
- **Deploy**: LIVE on Vercel → mapleboss.com; Neon Postgres; daily GitHub Actions ranking crawler
- **Auth**: None for now — design components to support auth later without major refactors

> **DB note:** Migrated off SQLite. Use pooled `DATABASE_URL` for request-scoped queries, direct `DATABASE_URL_UNPOOLED` for migrations & bulk writes. After any schema/provider change, run `npx prisma generate` **and restart the dev server** (the running client is cached in memory).

## Key Features
1. **EXP Tracker (LIVE — primary tool, home page leads with it)** — Daily ranking leaderboard (6,844+ chars) crawled from MSU's internal ranking endpoint; case-insensitive search, archetype/class filters, daily/weekly/monthly gains, level forecasts, and indexable per-character pages at `/tools/exp-tracker/[name]` (SEO play). Data source & internals: see memory `project_exp_tracker_live.md`.
2. **Boss Database** — HP values, phases, mechanics notes for MSN bosses
3. **Battle Calculator** — Input your damage output, party size (1-6), see estimated damage needed per member to clear
4. **Hungry Muto** — In-game crafting recipe reference
5. **Data Management** — Seed boss data from community sources + manual add/edit UI
6. **Crypto / DeFi Tools** — Planned: `/tools/crypto/*` routes for MSN blockchain economy (dormant until API keys)

> **Removed:** the standalone Level/EXP Calculator (`/tools/exp`) — its forecasting lives inside the EXP Tracker's per-character pages now.

## Architecture Decisions
- Use Next.js App Router with server components by default, client components only when needed
- Prisma for DB access — SQLite locally, easy swap to Postgres for deploy
- No auth layer yet, but keep data models user-agnostic (no hardcoded single-user assumptions)
- Boss data lives in DB, seeded via a script — not hardcoded in components
- Keep calculations client-side for snappy UX; DB only for boss reference data

---

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run `npm run build` and check for errors before marking frontend tasks done
- Test calculations manually with known boss values

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Game Data Accuracy**: Boss HP values and calculations must be correct — double-check formulas and data sources.

## Conventions

- Components in `src/components/` — PascalCase filenames
- Pages use Next.js App Router in `src/app/`
- DB models in `prisma/schema.prisma`
- Seed scripts in `prisma/seed.ts`
- Utility/calc functions in `src/lib/` — pure functions, easy to test
- Use TypeScript strict mode everywhere
