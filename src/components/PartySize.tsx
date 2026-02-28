"use client";

interface Props {
  value: number;
  onChange: (size: number) => void;
}

const SIZES = [1, 2, 3, 4, 5, 6];

export default function PartySize({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-secondary)]">
        Party Size
      </label>
      <div className="flex rounded-lg bg-[var(--color-elevated)] p-1">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              value === size
                ? "bg-[var(--color-accent)] font-medium text-zinc-950"
                : "text-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {size === 1 ? "Solo" : size}
          </button>
        ))}
      </div>
    </div>
  );
}
