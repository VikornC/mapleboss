import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";

// Home leads with the EXP Tracker: a live preview of the top of the leaderboard.
// Data changes once daily, so cache the page hourly (ISR) instead of hitting the DB per request.
export const revalidate = 3600;

const charHref = (name: string) => `/tools/exp-tracker/${encodeURIComponent(name)}`;

interface TopRow {
  assetKey: string;
  name: string;
  job: string | null;
  imageUrl: string | null;
  rank: number | null;
  level: number | null;
  dailyGain: number | null;
}

async function getTop(): Promise<{ rows: TopRow[]; total: number }> {
  try {
    const [rows, total] = await Promise.all([
      prisma.expCharacter.findMany({
        where: { rank: { not: null } },
        orderBy: { rank: "asc" },
        take: 5,
        select: { assetKey: true, name: true, job: true, imageUrl: true, rank: true, level: true, dailyGain: true },
      }),
      prisma.expCharacter.count({ where: { rank: { not: null } } }),
    ]);
    return {
      rows: rows.map((c) => ({ ...c, dailyGain: c.dailyGain != null ? Number(c.dailyGain) : null })),
      total,
    };
  } catch {
    return { rows: [], total: 0 };
  }
}

const PROPS = [
  { icon: "🏆", label: "Live rankings" },
  { icon: "📈", label: "Daily / weekly / monthly gains" },
  { icon: "🎯", label: "Level forecasts" },
];

const MORE_TOOLS = [
  { icon: "⚔️", name: "Battle Calculator", description: "Can your party clear a boss?", href: "/tools/battle-calc" },
  { icon: "🍜", name: "Hungry Muto", description: "All 13 crafting recipes.", href: "/tools/muto" },
];

export default async function Home() {
  const { rows, total } = await getTop();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-3 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
          MapleStory N
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">EXP Tracker</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--color-muted)]">
          Daily EXP rankings for every MapleStory N character. Track your gains, chase your next
          level, and see where you stand.
        </p>
        <div className="mt-6">
          <Link
            href="/tools/exp-tracker"
            className="inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            View Leaderboard →
          </Link>
        </div>
      </div>

      {/* Live top-rankings preview */}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] border-t-2 border-t-[var(--color-accent)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Top Rankings</h2>
            <span className="text-xs text-[var(--color-muted)]">
              {total.toLocaleString()} tracked · updated daily
            </span>
          </div>
          <div>
            {rows.map((c) => (
              <Link
                key={c.assetKey}
                href={charHref(c.name)}
                className="flex items-center gap-3 border-t border-[var(--color-border)] px-5 py-2.5 transition-colors hover:bg-[var(--color-elevated)]"
              >
                <span className="w-5 text-sm font-bold text-[var(--color-accent)]">{c.rank}</span>
                {c.imageUrl ? (
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageUrl} alt={c.name} className="absolute left-1/2 top-1/2 h-[160%] w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
                  </div>
                ) : (
                  <div className="h-11 w-11 flex-shrink-0 rounded bg-[var(--color-elevated)]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{c.name}</div>
                  <div className="truncate text-xs text-[var(--color-muted)]">{c.job ?? "—"}</div>
                </div>
                <span className="text-sm text-[var(--color-secondary)]">Lv{c.level ?? "—"}</span>
                <span className="w-20 text-right text-sm font-medium text-[var(--color-accent)]">
                  {c.dailyGain != null ? "+" + formatNumber(c.dailyGain) : "—"}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/tools/exp-tracker"
            className="block border-t border-[var(--color-border)] px-5 py-3 text-center text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-elevated)]"
          >
            View full leaderboard →
          </Link>
        </div>
      )}

      {/* Value props */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-muted)]">
        {PROPS.map((p, i) => (
          <span key={p.label} className="flex items-center gap-2">
            {i > 0 && <span className="mr-3 text-[var(--color-border)]">·</span>}
            <span>{p.icon}</span>
            {p.label}
          </span>
        ))}
      </div>

      {/* More tools */}
      <div className="mb-3 mt-12 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
        More tools
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MORE_TOOLS.map((tool) => (
          <Link
            key={tool.name}
            href={tool.href}
            className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-elevated)]"
          >
            <div className="text-2xl">{tool.icon}</div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{tool.name}</h3>
              <p className="truncate text-xs text-[var(--color-muted)]">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
