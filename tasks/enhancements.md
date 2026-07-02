# MapleBoss — Enhancements One-Pager

Quick-glance list of possible enhancements. Not a spec; just the radar.
**Effort:** S (hours) · M (a day) · L (multi-day). **Status:** 💡 idea · 🔜 ready · ⛔ blocked · ✅ done.

## Features
| Enhancement | Notes | Effort | Status |
|---|---|---|---|
| Guild rankings / pages | We already store `guildName`; add a guild leaderboard + per-guild page | M | 💡 |
| Compare: more stats | Add avg level/day, class-rank comparison, 90d totals | S | 💡 |
| Activity: archetype breakdown | Stack the daily line by archetype, or per-class small multiples | M | 💡 |
| Class Stats: avg/median level per class | Show how "leveled" each class's population is | S | 💡 |
| Worlds ranking (Ain/Errai/Fang) | Feasible: enrich each char's `worldId` from `msu.io/navigator/api/navigator/characters/{assetKey}/info` (unauthenticated), then add world filters/rankings. See `reference_msn_ranking_api` | M | 🔜 |
| Full name search (beyond tracked 6,844) | Needs MSU Level 2 key; our search is limited to crawled set | M | ⛔ |

## Data quality
| Enhancement | Notes | Effort | Status |
|---|---|---|---|
| Ground-truth EXP_TABLE | Validate vs live API (`exp ÷ expPct`); known L200–224 1.25x caveat. See `project_exp_table_provenance` | M | 💡 |
| Higher-res sprites | Source is 180px; probe MSU CDN for a larger variant (crisper portraits) | S | 💡 |
| Expand crawl coverage | Bump `RANKING_TOP_N` past 6,844 as the 225+ population grows | S | 🔜 |

## Tech debt / cleanup
| Item | Notes | Effort | Status |
|---|---|---|---|
| Remove `/api/exp/search` route | Unused since the autocomplete was removed | S | 🔜 |
| Remove `/stats/[assetKey]/planner` route + helpers | Dead code | S | 🔜 |
| Delete `scripts/import-pi-data.ts` | Obsolete; targeted the pre-migration SQLite `dev.db` | S | 🔜 |
| Extract shared `Select` component | Duplicated in Activity + Class Stats pages | S | 🔜 |
| Leaderboard gainRank scan | Removed | S | ✅ |

## Infra / ops
| Item | Notes | Status |
|---|---|---|
| Neon storage | 40 MB / 7.5% of 512 MB free tier; ~25–30% at steady state | 🟢 healthy |
| MSU downtime resilience | Fallback cron (`40 12 * * *`) already in place | 🟢 done |
| Request MSU Level 2 API key | `contact_builder@nexpace.io` — unlocks name search + maybe world data | 💡 |

## Apply-order suggestion
Quick wins first (cleanup + shared `Select` + higher-res sprite probe), then a feature (Guild rankings or Class-Stats avg level). Blocked items wait on an MSU API key.
