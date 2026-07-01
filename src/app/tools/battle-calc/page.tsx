import BattleCalculator from "@/components/BattleCalculator";

export const metadata = {
  title: "Battle Calculator — mapleboss",
  description:
    "Can your party clear? Input burst damage and check DPM requirements against any MSN boss.",
};

export default function BattleCalcPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--color-accent)] uppercase">
          MapleStory N
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Battle Calculator
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          Select a boss, enter your burst damage, and instantly see if your
          party can clear.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </div>

      <BattleCalculator />
    </div>
  );
}
