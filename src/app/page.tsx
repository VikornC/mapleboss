import Link from "next/link";

const TOOLS = [
  {
    icon: "⚔️",
    name: "Battle Calculator",
    description: "Check if your party can clear a boss based on your damage output.",
    href: "/tools/battle-calc",
    status: "active" as const,
    badge: null,
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="relative mb-12 text-center">
        <div className="hero-glow" />
        <div className="mb-3 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--color-accent)] uppercase">
          MapleStory N
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          MapleStory N Tools
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-muted)]">
          A suite of tools for bossing, progression and upgrades.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const isClickable = tool.status === "active" || tool.status === "coming-soon";
          const card = (
            <div
              className={`group relative flex h-full flex-col rounded-xl border p-6 transition-all ${
                tool.status === "active"
                  ? "cursor-pointer border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-elevated)]"
                  : tool.status === "coming-soon"
                  ? "cursor-pointer border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
                  : "cursor-default border-[var(--color-border)]/50 bg-[var(--color-surface)]/50 opacity-50"
              }`}
            >
              {tool.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-[var(--color-elevated)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {tool.badge}
                </span>
              )}

              <div className="mb-3 text-2xl">{tool.icon}</div>

              <h2 className="mb-1.5 text-sm font-semibold text-[var(--color-foreground)]">
                {tool.name}
              </h2>
              <p className="flex-1 text-xs leading-relaxed text-[var(--color-muted)]">
                {tool.description}
              </p>

              {tool.status === "active" && (
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  Open tool
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6h7M6.5 3l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );

          if (isClickable) {
            return (
              <Link key={tool.name} href={tool.href} className="flex">
                {card}
              </Link>
            );
          }
          return <div key={tool.name} className="flex">{card}</div>;
        })}
      </div>
    </div>
  );
}
