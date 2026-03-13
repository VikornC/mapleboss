export type Difficulty = "Easy" | "Normal" | "Hard" | "Chaos" | "Extreme";

export interface BurstCheck {
  hp: number; // HP to burn in the burst window
  timeSeconds: number; // time limit for the burst
  label: string; // e.g. "Phase 3 DPS Race"
}

export interface AFTier {
  af: number;
  fdMultiplier: number; // 1.0, 1.1, 1.3, 1.5
}

export interface BossEntry {
  id: string;
  name: string;
  difficulty: Difficulty;
  level: number;
  hp: number;
  timeLimitSeconds: number;
  defaultUptime: number;
  image: string;
  defense?: number;
  arcaneForce?: number;
  afTiers?: AFTier[];
  burstCheck?: BurstCheck;
  note?: string;
}

// Total HP values for MapleStory N (estimated).
// Range: Guardian Angel Slime Normal → Lucid Hard
export const BOSS_DATA: BossEntry[] = [
  // Guardian Angel Slime
  { id: "gaslime-normal", name: "Guardian Angel Slime", difficulty: "Normal", level: 210, hp: 5e12, timeLimitSeconds: 1800, defaultUptime: 70, defense: 300, image: "/images/bosses/guardian-angel-slime.png" },

  // Lotus
  { id: "lotus-hard", name: "Lotus", difficulty: "Hard", level: 210, hp: 33.285e12, timeLimitSeconds: 1800, defaultUptime: 65, defense: 300, image: "/images/bosses/lotus.png" },

  // Damien
  { id: "damien-hard", name: "Damien", difficulty: "Hard", level: 210, hp: 36e12, timeLimitSeconds: 1800, defaultUptime: 65, defense: 300, image: "/images/bosses/damien.png" },

  // Lucid
  {
    id: "lucid-easy", name: "Lucid", difficulty: "Easy", level: 230, hp: 12e12, timeLimitSeconds: 1800, defaultUptime: 75, defense: 300, image: "/images/bosses/lucid.png",
    arcaneForce: 360,
    afTiers: [{ af: 360, fdMultiplier: 1.0 }, { af: 400, fdMultiplier: 1.1 }, { af: 470, fdMultiplier: 1.3 }, { af: 540, fdMultiplier: 1.5 }],
  },
  {
    id: "lucid-normal", name: "Lucid", difficulty: "Normal", level: 230, hp: 98e12, timeLimitSeconds: 1800, defaultUptime: 70, defense: 300, image: "/images/bosses/lucid.png",
    arcaneForce: 360,
    afTiers: [{ af: 360, fdMultiplier: 1.0 }, { af: 400, fdMultiplier: 1.1 }, { af: 470, fdMultiplier: 1.3 }, { af: 540, fdMultiplier: 1.5 }],
    note: "Estimated HP — actual MSN value unconfirmed",
  },
  {
    id: "lucid-hard", name: "Lucid", difficulty: "Hard", level: 230, hp: 201e12, timeLimitSeconds: 1800, defaultUptime: 60, defense: 300, image: "/images/bosses/lucid.png",
    arcaneForce: 360,
    afTiers: [{ af: 360, fdMultiplier: 1.0 }, { af: 400, fdMultiplier: 1.1 }, { af: 470, fdMultiplier: 1.3 }, { af: 540, fdMultiplier: 1.5 }],
    note: "Estimated HP — actual MSN value unconfirmed",
    burstCheck: {
      hp: 21e12,
      timeSeconds: 40,
      label: "P3 DPS Race",
    },
  },
];

// Get unique boss names for grouped dropdown
export function getBossNames(): string[] {
  const names = new Set(BOSS_DATA.map((b) => b.name));
  return Array.from(names);
}

// Get variants for a specific boss name
export function getBossVariants(bossName: string): BossEntry[] {
  return BOSS_DATA.filter((b) => b.name === bossName);
}
