import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import CharacterDetail, { type CharacterMeta } from "@/components/CharacterDetail";

// Always render fresh from the DB (data updates daily; keeps not-found accurate).
export const dynamic = "force-dynamic";

// Resolve a character by name (case-insensitive; highest rank wins on collisions).
// Cached per-request so the page + generateMetadata share one query.
const getCharacter = cache(async (nameParam: string): Promise<CharacterMeta | null> => {
  const name = decodeURIComponent(nameParam);
  const c = await prisma.expCharacter.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    orderBy: { rank: "asc" },
  });
  if (!c) return null;
  return {
    assetKey: c.assetKey,
    name: c.name,
    job: c.job,
    guild: c.guild,
    worldId: c.worldId,
    imageUrl: c.imageUrl,
    rank: c.rank,
    level: c.level,
    expPct: c.expPct,
    dailyGain: c.dailyGain != null ? Number(c.dailyGain) : null,
    weeklyGain: c.weeklyGain != null ? Number(c.weeklyGain) : null,
    monthlyGain: c.monthlyGain != null ? Number(c.monthlyGain) : null,
  };
});

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const c = await getCharacter(name);
  if (!c) return { title: "Character not found | MapleBoss" };

  const bits = [c.name, c.level ? `Lv${c.level}` : null, c.job].filter(Boolean).join(" ");
  const title = `${bits} · MapleBoss EXP Tracker`;
  const desc =
    `${c.name}${c.rank ? ` (rank #${c.rank})` : ""} — Level ${c.level ?? "?"} ${c.job ?? ""}`.trim() +
    " on MapleStory N. Daily/weekly EXP gains, level progress and estimates.";
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: c.imageUrl ? [c.imageUrl] : undefined },
  };
}

export default async function CharacterPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const c = await getCharacter(name);
  if (!c) notFound();
  return <CharacterDetail character={c} />;
}
