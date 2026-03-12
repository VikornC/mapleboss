"use client";

interface Props {
  value: number;
  onChange: (uptime: number) => void;
}

const STEPS = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

export default function UptimeSlider({ value, onChange }: Props) {
  // Map value (40-100) to percentage (0-100) for the filled track
  const fillPercent = ((value - 40) / 60) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--color-secondary)]">
          Player Uptime
        </label>
        <span className="rounded-md bg-[var(--color-elevated)] px-2 py-0.5 font-mono text-sm font-semibold text-[var(--color-foreground)]">
          {value}%
        </span>
      </div>

      {/* Custom slider */}
      <div className="relative pt-1 pb-1">
        <input
          type="range"
          min={40}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="uptime-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${fillPercent}%, var(--color-elevated) ${fillPercent}%, var(--color-elevated) 100%)`,
          }}
        />

        {/* Tick marks */}
        <div className="mt-1 flex justify-between px-[2px]">
          {STEPS.map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`h-1 w-0.5 rounded-full ${
                  step <= value
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
              {step % 20 === 0 ? (
                <span className="mt-0.5 text-[9px] text-[var(--color-muted)]">
                  {step}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-muted)]">
        Accounts for deaths, dodging, and boss mechanics downtime
      </p>
    </div>
  );
}
