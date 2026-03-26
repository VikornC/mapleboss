import ExpCalculator from "@/components/ExpCalculator";

export const metadata = {
  title: "Level Calculator — MapleBoss",
  description: "Find out exactly how much EXP you need to reach your target level in MapleStory N.",
};

export default function ExpPage() {
  return (
    <div>
      {/* Hero */}
      <div className="relative mb-10 text-center">
        <div className="hero-glow" />
        <div className="mb-3 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--color-accent)] uppercase">
          MapleStory N
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Level Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-muted)]">
          Enter your current level and EXP progress to see how much EXP you need to reach your target.
        </p>
      </div>

      <ExpCalculator />
    </div>
  );
}
