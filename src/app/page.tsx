import BattleCalculator from "@/components/BattleCalculator";

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Boss Calculator</h1>
        <p className="mt-1 text-sm text-[var(--color-secondary)]">
          Select a boss, enter your damage, see if you can clear.
        </p>
      </div>
      <BattleCalculator />
    </div>
  );
}
