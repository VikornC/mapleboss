# Lessons Learned

<!-- Updated after corrections. Review at session start. -->

## Replicating an existing tool: study OUR version first, not the external reference
**Correction:** When asked to build the EXP Tracker UI, I redesigned it from scratch (and earlier leaned on lulumi-tools.com as the reference). The user already had their own working **Pi EXP tracker** and wanted *that exact layout*, just recolored to the MapleBoss theme.
**Rule:** Before building/redesigning a feature we already have an implementation of, READ our own existing version first (here: `exp-tracker/exp-tracker/src/web/` — `index.html`, `style.css`, `app.js`). Match its structure/sections/behavior; only swap the styling that was explicitly called out (colors → amber theme). "Make it like X" where X is ours means *replicate*, not *reinterpret*.

## Game-data tables: verify coverage + provenance, never ship silent fallbacks
**Correction:** Shipped `EXP_TABLE` that stopped at level 249 with a fallback (`EXP_TABLE[lvl] ?? currentLevelSize`) for 250+. Real L250–274 EXP is 4T→20T with ~2× walls at 250/260/270, so every forecast past L250 was off by up to ~10×. User caught it: "you dont know the exp required to level up huh."
**Rule:** For any lookup table that drives calculations, (1) confirm it covers the full domain the UI exposes (milestone input allowed up to 275 but table ended at 249); (2) a `?? fallback` for missing game data is a bug, not a safety net — surface the gap instead; (3) know the data's provenance. Both halves of this table trace to `maplestorywiki.net/w/MapleStory_N/Experience` scraped at different times, which caused a real L200–224 discrepancy (1.25×). Validate via curve smoothness (an EXP curve has no lone single-step spike) or, better, against live MSU API ground truth (`exp ÷ (expr/100)` = true exp-to-next).
