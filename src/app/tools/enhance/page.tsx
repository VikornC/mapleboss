import EnhanceTabs from "@/components/EnhanceTabs";

export const metadata = {
  title: "Enhancement Dashboard — MapleBoss",
  description:
    "Live StarForce and Potential prices for Arcane Umbra, Pitched Boss, CRA, and AbsoLab gear in MapleStory N.",
};

export default function EnhancePage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative mb-10 text-center">
        <div className="hero-glow" />
        <div className="mb-3 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--color-accent)] uppercase">
          Live Prices
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Enhancement Dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-muted)]">
          Live enhancement prices for Arcane, Dawn, AbsoLab, CRA, and Pitched Boss gear — all in one place.
        </p>
      </div>

      <EnhanceTabs />
    </div>
  );
}
