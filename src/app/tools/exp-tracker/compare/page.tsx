"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { formatNumber } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

const A_COLOR = "#f59e0b"; // amber
const B_COLOR = "#8b5cf6"; // violet

interface SelectedChar {
  assetKey: string;
  name: string;
  class: string | null;
  server: string | null;
  level: number | null;
  rank: number | null;
  imageUrl: string | null;
}
interface AvgPeriod { avgPerDay: number; dailyPct: number; total: number; days: number }
type Averages = Record<"7d" | "14d" | "30d" | "90d", AvgPeriod>;
interface DailyGain { date: string; expGained: number }
interface CharStats { averages: Averages | null; gains: DailyGain[] }

const charHref = (name: string) => `/tools/exp-tracker/${encodeURIComponent(name)}`;
const fmtDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
};

async function api<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
async function resolveName(name: string): Promise<SelectedChar | null> {
  const arr = await api<SelectedChar[]>(`/api/exp/search?name=${encodeURIComponent(name)}`);
  if (!arr || !arr.length) return null;
  return arr.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? arr[0];
}

const AXIS_TICK = { color: "#71717a", font: { size: 11 } as const, maxRotation: 0 };
const GRID = { color: "#27272a" };
const numTick = (v: unknown) => formatNumber(Number(v));

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#a1a1aa", usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 22, font: { size: 13 } } },
    tooltip: { callbacks: { label: (ctx: { dataset: { label?: string }; raw: unknown }) => `${ctx.dataset.label}: ${formatNumber(Number(ctx.raw))} EXP` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: AXIS_TICK },
    y: { grid: GRID, ticks: { ...AXIS_TICK, callback: numTick } },
  },
} as const;

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#a1a1aa", usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 22, font: { size: 13 } } },
    tooltip: { callbacks: { label: (ctx: { dataset: { label?: string }; raw: unknown }) => `${ctx.dataset.label}: ${formatNumber(Number(ctx.raw))}` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: AXIS_TICK },
    y: { grid: GRID, ticks: { ...AXIS_TICK, callback: numTick } },
  },
} as const;

const cardCls = "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6";
const chipCls = "rounded-full px-2 py-0.5 text-[11px] font-medium";

// ── Character search picker (fills an empty slot) ──
function CharPicker({ label, onSelect }: { label: string; onSelect: (c: SelectedChar) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SelectedChar[]>([]);

  useEffect(() => {
    if (q.trim().length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      const r = await api<SelectedChar[]>(`/api/exp/search?name=${encodeURIComponent(q)}`);
      setResults(r ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className={cardCls}>
      <div className="mb-3 text-sm font-semibold text-[var(--color-muted)]">{label}</div>
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search character…"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        {results.length > 0 && (
          <div
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
            style={{ transformOrigin: "top", animation: "dropdown 0.15s ease" }}
          >
            {results.map((r) => (
              <button
                key={r.assetKey}
                onClick={() => { onSelect(r); setQ(""); setResults([]); }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-elevated)]"
              >
                {r.imageUrl ? (
                  <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.imageUrl} alt={r.name} className="absolute left-1/2 top-1/2 h-[160%] w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
                  </div>
                ) : (
                  <div className="h-9 w-9 flex-shrink-0 rounded bg-[var(--color-elevated)]" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--color-foreground)]">{r.name}</div>
                  <div className="truncate text-xs text-[var(--color-muted)]">
                    {r.class ?? "—"}{r.level != null ? ` · Lv${r.level}` : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Selected character card ──
function CharCard({ c, color, onClear }: { c: SelectedChar; color: string; onClear: () => void }) {
  return (
    <div className={cardCls}>
      <button
        onClick={onClear}
        className="float-right text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
        aria-label="Remove"
      >
        ✕
      </button>
      <div className="flex items-center gap-3">
        {c.imageUrl ? (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.imageUrl} alt={c.name} className="absolute left-1/2 top-1/2 h-[160%] w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
          </div>
        ) : (
          <div className="h-16 w-16 flex-shrink-0 rounded bg-[var(--color-elevated)]" />
        )}
        <div className="min-w-0">
          <div className="truncate text-lg font-bold" style={{ color }}>{c.name}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {c.class && <span className={chipCls} style={{ background: color + "22", color }}>{c.class}</span>}
            {c.server && <span className={`${chipCls} bg-[var(--color-elevated)] text-[var(--color-secondary)]`}>{c.server}</span>}
            {c.level != null && <span className={`${chipCls} bg-[var(--color-elevated)] text-[var(--color-secondary)]`}>Lv. {c.level}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat comparison card (two values + delta) ──
function StatCard({
  title, aName, bName, aVal, bVal, fmt, unitLabel, lowerBetter = false,
}: {
  title: string; aName: string; bName: string;
  aVal: number | null; bVal: number | null;
  fmt: (n: number) => string; unitLabel: string; lowerBetter?: boolean;
}) {
  let delta: string | null = null;
  if (aVal != null && bVal != null) {
    if (aVal === bVal) delta = "Tied";
    else {
      const aLeads = lowerBetter ? aVal < bVal : aVal > bVal;
      delta = `${aLeads ? aName : bName} +${fmt(Math.abs(aVal - bVal))}${unitLabel}`;
    }
  }
  return (
    <div className={`${cardCls} text-center`}>
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">{title}</div>
      <div className="flex items-baseline justify-around gap-2">
        <div>
          <div className="text-2xl font-bold" style={{ color: A_COLOR }}>{aVal != null ? fmt(aVal) : "—"}</div>
          <div className="text-xs text-[var(--color-muted)]">{aName}</div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: B_COLOR }}>{bVal != null ? fmt(bVal) : "—"}</div>
          <div className="text-xs text-[var(--color-muted)]">{bName}</div>
        </div>
      </div>
      {delta && <div className="mt-3 border-t border-[var(--color-border)] pt-2 text-xs font-medium text-[var(--color-accent)]">{delta}</div>}
    </div>
  );
}

function Compare() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useRef(false);

  const [a, setA] = useState<SelectedChar | null>(null);
  const [b, setB] = useState<SelectedChar | null>(null);
  const [statsA, setStatsA] = useState<CharStats | null>(null);
  const [statsB, setStatsB] = useState<CharStats | null>(null);

  // Prefill from ?a=&b= once.
  useEffect(() => {
    (async () => {
      const an = searchParams.get("a");
      const bn = searchParams.get("b");
      const [ca, cb] = await Promise.all([an ? resolveName(an) : null, bn ? resolveName(bn) : null]);
      if (ca) setA(ca);
      if (cb) setB(cb);
      hydrated.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync (shareable links).
  useEffect(() => {
    if (!hydrated.current) return;
    const p = new URLSearchParams();
    if (a) p.set("a", a.name);
    if (b) p.set("b", b.name);
    const qs = p.toString();
    router.replace(qs ? `?${qs}` : "/tools/exp-tracker/compare", { scroll: false });
  }, [a, b, router]);

  // Load stats per slot.
  useEffect(() => {
    if (!a) { setStatsA(null); return; }
    let live = true;
    (async () => {
      const [averages, gains] = await Promise.all([
        api<Averages>(`/api/exp/stats/${encodeURIComponent(a.assetKey)}/averages`),
        api<DailyGain[]>(`/api/exp/stats/${encodeURIComponent(a.assetKey)}/gains?days=90`),
      ]);
      if (live) setStatsA({ averages, gains: gains ?? [] });
    })();
    return () => { live = false; };
  }, [a]);
  useEffect(() => {
    if (!b) { setStatsB(null); return; }
    let live = true;
    (async () => {
      const [averages, gains] = await Promise.all([
        api<Averages>(`/api/exp/stats/${encodeURIComponent(b.assetKey)}/averages`),
        api<DailyGain[]>(`/api/exp/stats/${encodeURIComponent(b.assetKey)}/gains?days=90`),
      ]);
      if (live) setStatsB({ averages, gains: gains ?? [] });
    })();
    return () => { live = false; };
  }, [b]);

  const both = a && b;

  // ── Chart data ──
  const dates = both
    ? [...new Set([...(statsA?.gains ?? []), ...(statsB?.gains ?? [])].map((g) => g.date))].sort()
    : [];
  const mapA = new Map((statsA?.gains ?? []).map((g) => [g.date, g.expGained]));
  const mapB = new Map((statsB?.gains ?? []).map((g) => [g.date, g.expGained]));

  const lineData = {
    labels: dates.map(fmtDate),
    datasets: [
      { label: a?.name ?? "A", data: dates.map((d) => mapA.get(d) ?? 0), borderColor: A_COLOR, backgroundColor: A_COLOR, tension: 0.3, pointRadius: 0, borderWidth: 2 },
      { label: b?.name ?? "B", data: dates.map((d) => mapB.get(d) ?? 0), borderColor: B_COLOR, backgroundColor: B_COLOR, tension: 0.3, pointRadius: 0, borderWidth: 2 },
    ],
  };

  const avgA = statsA?.averages;
  const avgB = statsB?.averages;
  const statLabels = ["Daily Avg (7d)", "Daily Avg (30d)", "Total (7d)", "Total (30d)"];
  const statSeries = (av: Averages | null | undefined) =>
    av ? [av["7d"].avgPerDay, av["30d"].avgPerDay, av["7d"].total, av["30d"].total] : [0, 0, 0, 0];
  const barData = {
    labels: statLabels,
    datasets: [
      { label: a?.name ?? "A", data: statSeries(avgA), backgroundColor: A_COLOR, borderRadius: 4 },
      { label: b?.name ?? "B", data: statSeries(avgB), backgroundColor: B_COLOR, borderRadius: 4 },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
          EXP Tracker
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Compare Characters</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          Pick two characters to compare levels, ranks and EXP gains side by side.
        </p>
      </div>

      {/* Slots */}
      <div className="grid gap-4 sm:grid-cols-2">
        {a ? <CharCard c={a} color={A_COLOR} onClear={() => setA(null)} /> : <CharPicker label="Character 1" onSelect={setA} />}
        {b ? <CharCard c={b} color={B_COLOR} onClear={() => setB(null)} /> : <CharPicker label="Character 2" onSelect={setB} />}
      </div>

      {!both ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--color-border)] p-16 text-center text-sm text-[var(--color-muted)]">
          {a || b ? "Pick a second character to compare." : "Search and pick two characters above."}
        </div>
      ) : (
        <>
          {/* Stat comparison */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard title="Level" aName={a.name} bName={b.name} aVal={a.level} bVal={b.level} fmt={(n) => String(n)} unitLabel=" lv" />
            <StatCard title="Global Rank" aName={a.name} bName={b.name} aVal={a.rank} bVal={b.rank} fmt={(n) => "#" + n.toLocaleString()} unitLabel="" lowerBetter />
            <StatCard title="Daily EXP (7d)" aName={a.name} bName={b.name} aVal={avgA?.["7d"].avgPerDay ?? null} bVal={avgB?.["7d"].avgPerDay ?? null} fmt={formatNumber} unitLabel="" />
          </div>

          {/* Daily EXP gains comparison */}
          <section className={`${cardCls} mt-6`}>
            <h2 className="mb-5 text-lg font-semibold text-[var(--color-foreground)]">Daily EXP Gains Comparison</h2>
            <div className="relative h-[360px]">
              {dates.length > 0 ? <Line data={lineData} options={lineOptions} /> : (
                <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">Not enough data yet</p>
              )}
            </div>
          </section>

          {/* EXP statistics bars */}
          <section className={`${cardCls} mt-6`}>
            <h2 className="mb-5 text-lg font-semibold text-[var(--color-foreground)]">EXP Statistics</h2>
            <div className="relative h-[340px]">
              {avgA || avgB ? <Bar data={barData} options={barOptions} /> : (
                <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">Not enough data yet</p>
              )}
            </div>
          </section>

          {/* Profile links */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[a, b].map((c, i) => (
              <Link
                key={c.assetKey}
                href={charHref(c.name)}
                className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-elevated)]"
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: i === 0 ? A_COLOR : B_COLOR }}>View Full Profile</div>
                  <div className="text-xs text-[var(--color-muted)]">{c.name}</div>
                </div>
                <span className="text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[var(--color-muted)]">Loading…</div>}>
      <Compare />
    </Suspense>
  );
}
