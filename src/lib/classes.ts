// Canonical class names + archetype grouping for the leaderboard class filter.
// The DB stores raw class strings from two sources (lulumi bootstrap + our
// crawler's jobCode mapping), so the same class can appear under several spellings
// (e.g. "Bowmaster" / "Bow Master", "Arch Mage(Ice / Lightning)" / "Il Arch Mage").
// We canonicalize at query time so the UI stays clean without touching the crawl.

export const ARCHETYPES = ["Warrior", "Mage", "Archer", "Thief", "Pirate"] as const;
export type Archetype = (typeof ARCHETYPES)[number] | "Other";

interface ClassDef { name: string; archetype: Archetype; keys: string[] }

// keys = normalized raw variants (lowercased, non-alphanumerics stripped).
const CLASS_DEFS: ClassDef[] = [
  // Warrior
  { name: "Hero", archetype: "Warrior", keys: ["hero"] },
  { name: "Paladin", archetype: "Warrior", keys: ["paladin"] },
  { name: "Dark Knight", archetype: "Warrior", keys: ["darkknight"] },
  { name: "Aran", archetype: "Warrior", keys: ["aran"] },
  { name: "Dawn Warrior", archetype: "Warrior", keys: ["dawnwarrior", "soulmaster"] },
  { name: "Mihile", archetype: "Warrior", keys: ["mihile", "michael"] },
  { name: "Adele", archetype: "Warrior", keys: ["adele"] },
  // Mage
  { name: "Bishop", archetype: "Mage", keys: ["bishop"] },
  { name: "Arch Mage (I/L)", archetype: "Mage", keys: ["archmageicelightning", "ilarchmage", "ilmage"] },
  { name: "Arch Mage (F/P)", archetype: "Mage", keys: ["archmagefirepoison", "fparchmage", "fpmage"] },
  { name: "Luminous", archetype: "Mage", keys: ["luminous"] },
  { name: "Evan", archetype: "Mage", keys: ["evan"] },
  { name: "Blaze Wizard", archetype: "Mage", keys: ["blazewizard", "flamewizard"] },
  // Archer
  { name: "Bowmaster", archetype: "Archer", keys: ["bowmaster"] },
  { name: "Marksman", archetype: "Archer", keys: ["marksman", "crossbowmaster"] },
  { name: "Mercedes", archetype: "Archer", keys: ["mercedes"] },
  { name: "Wind Archer", archetype: "Archer", keys: ["windarcher", "windbreaker"] },
  { name: "Pathfinder", archetype: "Archer", keys: ["pathfinder"] },
  // Thief
  { name: "Night Lord", archetype: "Thief", keys: ["nightlord"] },
  { name: "Shadower", archetype: "Thief", keys: ["shadower"] },
  { name: "Shade", archetype: "Thief", keys: ["shade", "eunwol"] },
  { name: "Blade Master", archetype: "Thief", keys: ["blademaster", "dualblade"] },
  { name: "Night Walker", archetype: "Thief", keys: ["nightwalker"] },
  { name: "Phantom", archetype: "Thief", keys: ["phantom"] },
  // Pirate
  { name: "Corsair", archetype: "Pirate", keys: ["corsair"] },
  { name: "Buccaneer", archetype: "Pirate", keys: ["buccaneer"] },
  { name: "Cannon Master", archetype: "Pirate", keys: ["cannonmaster", "cannoneer"] },
  { name: "Thunder Breaker", archetype: "Pirate", keys: ["thunderbreaker", "striker"] },
  { name: "Ark", archetype: "Pirate", keys: ["ark"] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const KEY_TO_CANON = new Map<string, string>();
const CANON_TO_ARCH = new Map<string, Archetype>();
for (const d of CLASS_DEFS) {
  CANON_TO_ARCH.set(d.name, d.archetype);
  for (const k of d.keys) KEY_TO_CANON.set(k, d.name);
}

/** Map any raw class string to its canonical display name. Unknown → the raw string. */
export function canonicalClass(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return KEY_TO_CANON.get(norm(raw)) ?? raw;
}

export function archetypeOf(canonicalName: string): Archetype {
  return CANON_TO_ARCH.get(canonicalName) ?? "Other";
}
