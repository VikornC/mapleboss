import Link from "next/link";

export default function CharacterNotFound() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
        MapleStory N
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Character not found</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
        We don&apos;t have a tracked character by that name — they may have changed their
        name, or they&apos;re outside the top ranks we track.
      </p>
      <Link
        href="/tools/exp-tracker"
        className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-[var(--color-accent-hover)]"
      >
        ← Back to leaderboard
      </Link>
    </div>
  );
}
