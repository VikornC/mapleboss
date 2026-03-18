export type GearTier = "arcane" | "pitched" | "cra" | "absolab" | "dawn";

export interface EnhanceItem {
  id: number;
  name: string;
  slot: string;
  tier: GearTier;
}

// Item IDs sourced from MSU Navigator (msu.io/navigator)
// Images: https://api-static.msu.io/itemimages/icon/{itemId}.png
export const ENHANCE_ITEMS: EnhanceItem[] = [
  // Arcane Umbra
  { id: 1102941, name: "Arcane Umbra Cape",   slot: "Cape",    tier: "arcane" },
  { id: 1082696, name: "Arcane Umbra Gloves", slot: "Gloves",  tier: "arcane" },
  { id: 1073159, name: "Arcane Umbra Shoes",  slot: "Shoes",   tier: "arcane" },
  { id: 1362140, name: "Arcane Umbra Weapon", slot: "Weapon",  tier: "arcane" },

  // Pitched Boss
  { id: 1132308, name: "Dreamy Belt",    slot: "Belt",  tier: "pitched" },
  { id: 1022278, name: "Magic Eyepatch", slot: "Eye",   tier: "pitched" },
  { id: 1012632, name: "Berserked",      slot: "Face",  tier: "pitched" },

  // CRA — Chaos Root Abyss
  { id: 1003800, name: "CRA Hat",      slot: "Hat",    tier: "cra" },
  { id: 1042257, name: "CRA Top",      slot: "Top",    tier: "cra" },
  { id: 1062168, name: "CRA Bottom",   slot: "Bottom", tier: "cra" },
  { id: 1332225, name: "Fafnir Weapon", slot: "Weapon", tier: "cra" },
  { id: 1003722, name: "Chaos Vellum's Helm", slot: "Hat", tier: "cra" },

  // AbsoLab
  { id: 1073033, name: "AbsoLab Shoes",    slot: "Shoes",    tier: "absolab" },
  { id: 1082638, name: "AbsoLab Gloves",   slot: "Gloves",   tier: "absolab" },
  { id: 1102797, name: "AbsoLab Cape",     slot: "Cape",     tier: "absolab" },
  { id: 1152178, name: "AbsoLab Shoulder", slot: "Shoulder", tier: "absolab" },
  { id: 1422184, name: "AbsoLab Weapon",   slot: "Weapon",   tier: "absolab" },
  { id: 1004424, name: "AbsoLab Hood",     slot: "Hat",      tier: "absolab" },
  { id: 1052888, name: "AbsoLab Suit",     slot: "Overall",  tier: "absolab" },

  // Dawn Set
  { id: 1113313, name: "Guardian Angel Ring", slot: "Ring",         tier: "dawn" },
  { id: 1012757, name: "Twilight Mark",       slot: "Face",         tier: "dawn" },
];

export const TIERS: GearTier[] = ["arcane", "pitched", "cra", "absolab", "dawn"];

export const TIER_LABELS: Record<GearTier, string> = {
  arcane:  "Arcane Umbra",
  pitched: "Pitched Boss",
  cra:     "CRA",
  absolab: "AbsoLab",
  dawn:    "Dawn Set",
};

export function getItemsByTier(tier: GearTier): EnhanceItem[] {
  return ENHANCE_ITEMS.filter((i) => i.tier === tier);
}

// Cube item IDs → readable names
export const CUBE_NAMES: Record<string, string> = {
  "2711000": "Occult Cube",
  "2730000": "Bonus Occult Cube",
  "5062009": "Red Cube",
  "5062010": "Black Cube",
  "5062500": "Bonus Potential Cube",
};
