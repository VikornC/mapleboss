// EXP_TABLE[level] = EXP required to go from `level` to `level + 1`
// Source: maplestorywiki.net/w/MapleStory_N/Experience
// Covers levels 1–274 (275 is max level). Levels 250–274 from the
// MSN ranking tracker's scraped table; "wall" jumps (~2x) at 250/260/270.
export const EXP_TABLE: Record<number, number> = {
  1: 15, 2: 34, 3: 57, 4: 92, 5: 135, 6: 372, 7: 560, 8: 840, 9: 1242,
  10: 1304, 11: 1317, 12: 1330, 13: 1343, 14: 1356, 15: 1627, 16: 1952,
  17: 2342, 18: 2810, 19: 3372, 20: 4383, 21: 5259, 22: 6310, 23: 7572,
  24: 9086, 25: 10903, 26: 13083, 27: 15699, 28: 18838, 29: 22605, 30: 24865,
  31: 26108, 32: 27413, 33: 28783, 34: 30222, 35: 36266, 36: 43519, 37: 52222,
  38: 62666, 39: 75199, 40: 82718, 41: 89335, 42: 96481, 43: 104199, 44: 112534,
  45: 123787, 46: 133689, 47: 144384, 48: 155934, 49: 168408, 50: 181880,
  51: 196430, 52: 212144, 53: 229115, 54: 247444, 55: 267239, 56: 288618,
  57: 311707, 58: 336643, 59: 363574, 60: 381752, 61: 400839, 62: 420880,
  63: 441924, 64: 464020, 65: 498821, 66: 536232, 67: 576449, 68: 619682,
  69: 666158, 70: 732773, 71: 787730, 72: 846809, 73: 910319, 74: 978592,
  75: 1056879, 76: 1125576, 77: 1198738, 78: 1276655, 79: 1359637, 80: 1448013,
  81: 1542133, 82: 1642371, 83: 1749125, 84: 1862818, 85: 1983901, 86: 2112854,
  87: 2250189, 88: 2396451, 89: 2552220, 90: 2718114, 91: 2894791, 92: 3082952,
  93: 3283343, 94: 3496760, 95: 3724049, 96: 3966112, 97: 4223909, 98: 4498463,
  99: 4790863, 100: 5653218, 101: 5653218, 102: 5653218, 103: 5653218, 104: 5653218,
  105: 5992411, 106: 6351955, 107: 6764832, 108: 7204546, 109: 7672841,
  110: 8133211, 111: 8661869, 112: 9224890, 113: 9824507, 114: 10463099,
  115: 11090884, 116: 11811791, 117: 12579557, 118: 13397228, 119: 14268047,
  120: 15124129, 121: 16107197, 122: 17154164, 123: 18269184, 124: 19456680,
  125: 20624080, 126: 21964645, 127: 23392346, 128: 24912848, 129: 26532183,
  130: 28522096, 131: 30376032, 132: 32350474, 133: 34453254, 134: 36692715,
  135: 39444668, 136: 42008571, 137: 44739128, 138: 47647171, 139: 50744237,
  140: 55564939, 141: 59037747, 142: 62727606, 143: 66648081, 144: 70813586,
  145: 77540876, 146: 82387180, 147: 87536378, 148: 93007401, 149: 98820363,
  150: 108208297, 151: 114971315, 152: 122157022, 153: 129791835, 154: 137903824,
  155: 151004687, 156: 160064968, 157: 169668866, 158: 179848997, 159: 190639936,
  160: 208750729, 161: 221275772, 162: 234552318, 163: 248625457, 164: 263542984,
  165: 289897282, 166: 307291118, 167: 326496812, 168: 346902862, 169: 368584290,
  170: 405442719, 171: 430782888, 172: 457706818, 173: 486313494, 174: 516708087,
  175: 568378895, 176: 603902575, 177: 641646485, 178: 681749390, 179: 724358726,
  180: 796794598, 181: 844602273, 182: 895278409, 183: 948995113, 184: 1005934819,
  185: 1106528300, 186: 1172919998, 187: 1243295197, 188: 1317892908, 189: 1396966482,
  190: 1536663130, 191: 1628862917, 192: 1726594692, 193: 1830190373, 194: 1940001795,
  195: 2134001974, 196: 2262042092, 197: 2397764617, 198: 2541630494, 199: 2694128323,
  200: 6730116728, 201: 8076140073, 202: 9691368085, 203: 11629641701, 204: 13955570038,
  205: 16746684044, 206: 20096020850, 207: 24115225018, 208: 28938270020, 209: 34725924024,
  210: 73618958927, 211: 78036096459, 212: 82718262245, 213: 87681357979, 214: 92942239455,
  215: 98518773821, 216: 104429900248, 217: 110695694261, 218: 117337435913, 219: 124377682065,
  220: 258705578694, 221: 269053801840, 222: 279815953911, 223: 291008592064, 224: 302648935745,
  225: 314754893173, 226: 327345088899, 227: 340438892454, 228: 354056448150, 229: 368218706074,
  230: 751166160390, 231: 766189483595, 232: 781513273265, 233: 797143538730, 234: 813086409503,
  235: 829348137691, 236: 845935100443, 237: 862853802451, 238: 880110878499, 239: 897713096067,
  240: 1813380454053, 241: 1831514258591, 242: 1849829401175, 243: 1868327695184, 244: 1887010972134,
  245: 1905881081854, 246: 1924939892669, 247: 1944189291594, 248: 1963631184509, 249: 1983267496351,
  250: 4006200342629, 251: 4046262346055, 252: 4086724969515, 253: 4127592219210, 254: 4168868141402,
  255: 4210556822816, 256: 4252662391044, 257: 4295189014954, 258: 4338140905103, 259: 4381522314154,
  260: 8850675074591, 261: 8939181825336, 262: 9028573643589, 263: 9118859380024, 264: 9210047973824,
  265: 9302148453562, 266: 9395169938097, 267: 9489121637477, 268: 9584012853851, 269: 9679852982389,
  270: 19553303024425, 271: 19748836054669, 272: 19946324415215, 273: 20145787659367, 274: 20347245535960,
};

export const MAX_LEVEL = 275;

// The static EXP_TABLE above is only the seed/fallback. MSU periodically
// rebalances EXP, so the *authoritative* per-level requirements live in the
// `ExpLevelReq` DB table (fed by the daily crawler's navigator /info reads).
// `hydrateExpTable()` overlays those live values onto the active table; every
// EXP computation reads the active table, so it self-heals across rebalances.
// Callers should `await hydrateExpTable()` before relying on fresh values; if
// they don't, they transparently fall back to the static seed.
let ACTIVE: Record<number, number> = { ...EXP_TABLE };

// Cache the DB overlay for a short TTL so warm serverless instances issue at
// most one small query per window. The crawler and scripts get a fresh read
// each process start (module state is per-process).
let lastHydrated = 0;
const HYDRATE_TTL_MS = 5 * 60 * 1000;
let hydrating: Promise<void> | null = null;

export async function hydrateExpTable(force = false): Promise<void> {
  if (!force && Date.now() - lastHydrated < HYDRATE_TTL_MS) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const { prisma } = await import("@/lib/db");
      const rows = await prisma.expLevelReq.findMany({ select: { level: true, totalExp: true } });
      if (rows.length) {
        const next: Record<number, number> = { ...EXP_TABLE };
        for (const r of rows) next[r.level] = Number(r.totalExp);
        ACTIVE = next;
      }
      lastHydrated = Date.now();
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}

/**
 * EXP required to complete `level`. MSU rolls EXP reductions out per character
 * (a character's within-level EXP is cached and only re-scales when it next
 * updates), so old and new readings coexist. A reading whose within-level EXP
 * exceeds the current (reduced) requirement is impossible under the new curve,
 * so it's still on the OLD curve — use the old (static) requirement for it.
 * Pass `withinLevelExp` to get this per-reading resolution; omit it (e.g. for
 * future-level forecasts) to always get the current requirement.
 */
export function expToNextFor(level: number, withinLevelExp?: number): number {
  const cur = ACTIVE[level] ?? 0;
  if (withinLevelExp != null && cur > 0 && withinLevelExp > cur) return EXP_TABLE[level] ?? cur;
  return cur;
}

/**
 * EXP earned between two consecutive readings of one character, correct across a
 * reduction. Prefix sums can't be used: an EXP reduction lowers every level's
 * requirement, so cumulative totals aren't a common scale before/after it.
 * Instead we work locally:
 *   - same level  -> within-level delta (requirement-independent);
 *   - level-up    -> finish the departing level (using THAT reading's era — a
 *                    within-level EXP above the new requirement is still on the
 *                    old curve) + any full intermediate levels + the new
 *                    within-level EXP.
 * A normal level-up produces a low new reading, so the departing reading's own
 * value (not the new one) is what tells us which curve the completed level was on.
 */
function reqForReading(level: number, within: number): number {
  const cur = ACTIVE[level] ?? 0;
  if (cur > 0 && within > cur) return EXP_TABLE[level] ?? cur; // old-curve reading
  return cur;
}
export function gainBetween(
  prev: { level: number; exp: number },
  now: { level: number; exp: number }
): number {
  if (now.level <= prev.level) return Math.max(0, now.exp - prev.exp);
  let g = reqForReading(prev.level, prev.exp) - prev.exp; // finish the departing level
  for (let l = prev.level + 1; l < now.level; l++) g += ACTIVE[l] ?? EXP_TABLE[l] ?? 0;
  g += now.exp;
  return Math.max(0, g);
}

export function calcExpNeeded(currentLevel: number, currentPct: number, targetLevel: number): number {
  if (targetLevel <= currentLevel) return 0;
  const remaining = (ACTIVE[currentLevel] ?? 0) * (1 - currentPct / 100);
  let total = remaining;
  for (let l = currentLevel + 1; l < targetLevel; l++) {
    total += ACTIVE[l] ?? 0;
  }
  return Math.ceil(total);
}
