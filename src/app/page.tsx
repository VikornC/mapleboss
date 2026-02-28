import BattleCalculator from "@/components/BattleCalculator";

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Battle Calculator</h1>
        <p className="mt-1 text-sm text-[var(--color-secondary)]">
          Estimate clear times and DPS requirements for MapleStory N bosses.
        </p>
      </div>
      <BattleCalculator />
    </div>
  );
}
