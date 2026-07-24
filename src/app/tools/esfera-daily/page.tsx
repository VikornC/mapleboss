export const metadata = {
  title: "Esfera Daily — mapleboss",
  description: "Cannon firing order for the Esfera daily minigame — Type A and Type B, step by step.",
};

interface Step {
  pos: string; // power-gauge notch, e.g. "4-2.5"
  shots: number;
}

// Each layout uses all 10 shots. Pull the power gauge to each notch in order
// and fire the listed number of shots.
const TYPE_A: Step[] = [
  { pos: "3-1", shots: 1 },
  { pos: "4-2.5", shots: 1 },
  { pos: "4-2", shots: 1 },
  { pos: "4-3.5", shots: 1 },
  { pos: "5-2", shots: 2 },
  { pos: "6-1", shots: 3 },
  { pos: "6-3", shots: 1 },
];
const TYPE_B: Step[] = [
  { pos: "2-3", shots: 1 },
  { pos: "4-1", shots: 1 },
  { pos: "4-3", shots: 2 },
  { pos: "4-3.5", shots: 1 },
  { pos: "5-2", shots: 2 },
  { pos: "5-3.5", shots: 2 },
  { pos: "6-1", shots: 1 },
];

function Pattern({ label, steps, image }: { label: string; steps: Step[]; image: string }) {
  const total = steps.reduce((s, x) => s + x.shots, 0);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
        <h2 className="text-lg font-bold tracking-tight">
          Type <span className="text-[var(--color-accent)]">{label}</span>
        </h2>
        <span className="rounded-full bg-[var(--color-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-secondary)]">
          {total} shots
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={`Esfera daily Type ${label} target layout and power gauge`}
        className="w-full border-b border-[var(--color-border)] object-contain"
      />
      <ol className="divide-y divide-[var(--color-border)]">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] text-xs font-bold text-[var(--color-muted)]">
              {i + 1}
            </span>
            <span className="flex-1 font-mono text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
              {step.pos}
            </span>
            <span
              className={`rounded-md px-2.5 py-1 text-sm font-semibold ${
                step.shots > 1
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "text-[var(--color-secondary)]"
              }`}
            >
              {step.shots} {step.shots > 1 ? "shots" : "shot"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function EsferaDailyPage() {
  return (
    <div>
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--color-accent)] uppercase">
          MapleStory N
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Esfera Daily</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-muted)]">
          Cannon firing order for the daily minigame. Match your layout to Type A or Type B,
          then pull the power gauge to each notch in order and fire the listed number of shots.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Pattern label="A" steps={TYPE_A} image="/images/esfera/type-a.png" />
        <Pattern label="B" steps={TYPE_B} image="/images/esfera/type-b.png" />
      </div>

      <p className="mx-auto mt-6 max-w-lg text-center text-xs text-[var(--color-muted)]">
        Positions are the power-gauge notches (e.g. <span className="font-mono">4-2.5</span>).
        Each layout uses all 10 shots.
      </p>
    </div>
  );
}
