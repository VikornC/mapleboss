import Link from "next/link";

// TEMP preview route (Option B — static polished) for side-by-side comparison with `/`.
// Delete once the user picks a home design.

const PROPS = [
  { icon: "🏆", title: "Live Leaderboard", desc: "6,800+ ranked characters, refreshed daily." },
  { icon: "📈", title: "Gain Tracking", desc: "Daily, weekly & monthly EXP for every player." },
  { icon: "🎯", title: "Level Forecasts", desc: "Days to your target level at your own pace." },
];

const MORE_TOOLS = [
  { icon: "⚔️", name: "Battle Calculator", description: "Can your party clear a boss?", href: "/tools/battle-calc" },
  { icon: "🍜", name: "Hungry Muto", description: "All 13 crafting recipes.", href: "/tools/muto" },
];

export default function HomeAlt() {
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
      </div>

      {/* Featured EXP Tracker banner */}
      <Link href="/tools/exp-tracker" className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/30 border-t-2 border-t-[var(--color-accent)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-elevated)] p-8 transition-all hover:border-[var(--color-accent)]/60">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">Leaderboard & Character Tracking</h2>
              <ul className="mt-3 space-y-1.5">
                {PROPS.map((p) => (
                  <li key={p.title} className="flex items-center gap-2 text-sm text-[var(--color-secondary)]">
                    <span>{p.icon}</span>
                    <span className="font-medium text-[var(--color-foreground)]">{p.title}</span>
                    <span className="text-[var(--color-muted)]">— {p.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <span className="inline-block whitespace-nowrap rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-black transition-colors group-hover:bg-[var(--color-accent-hover)]">
              View Leaderboard →
            </span>
          </div>
        </div>
      </Link>

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
