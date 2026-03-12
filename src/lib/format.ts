function fmt(n: number, divisor: number, suffix: string): string {
  const val = n / divisor;
  return (Number.isInteger(val) ? val.toString() : val.toFixed(1)) + suffix;
}

export function formatNumber(n: number): string {
  if (n >= 1e15) return fmt(n, 1e15, "Q");
  if (n >= 1e12) return fmt(n, 1e12, "T");
  if (n >= 1e9)  return fmt(n, 1e9,  "B");
  if (n >= 1e6)  return fmt(n, 1e6,  "M");
  if (n >= 1e3)  return fmt(n, 1e3,  "K");
  return n.toLocaleString();
}

export function parseNumberInput(input: string): number | null {
  const cleaned = input.trim().toLowerCase().replace(/,/g, "");
  if (cleaned === "") return null;
  const match = cleaned.match(/^(\d+\.?\d*)\s*([kmbtq]?)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const suffixes: Record<string, number> = {
    "": 1,
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12,
    q: 1e15,
  };
  return num * (suffixes[match[2]] ?? 1);
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
