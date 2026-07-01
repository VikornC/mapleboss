"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatNumber } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

const ACCENT = "#f59e0b";

interface ClassInfo { name: string; archetype: string; count: number }
interface Activity { series: { date: string; count: number }[]; avg: number; peak: { date: string; count: number } | null }

const RANGES = [
  { label: "7d", days: "7" },
  { label: "30d", days: "30" },
  { label: "90d", days: "90" },
  { label: "All", days: "all" },
];
const LEVELS = [
  { label: "All levels", val: "0" },
  { label: "Lv 240+", val: "240" },
  { label: "Lv 250+", val: "250" },
  { label: "Lv 255+", val: "255" },
  { label: "Lv 260+", val: "260" },
];

const cardCls = "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6";

// Custom-styled select with a roomy chevron (native arrow felt cramped).
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[150px] cursor-pointer appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] py-2 pl-3.5 pr-10 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:outline-none"
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const fmtDate = (iso: string) => { const [, m, d] = iso.split("-"); return `${m}/${d}`; };
const fmtLongDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export default function ActivityPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [job, setJob] = useState("all");
  const [minLevel, setMinLevel] = useState("0");
  const [days, setDays] = useState("30");
  const [data, setData] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exp/classes").then((r) => (r.ok ? r.json() : [])).then(setClasses).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ job, minLevel, days });
    fetch(`/api/exp/activity?${p}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [job, minLevel, days]);

  const series = data?.series ?? [];
  const chartData = {
    labels: series.map((s) => fmtDate(s.date)),
    datasets: [{
      data: series.map((s) => s.count),
      borderColor: ACCENT,
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      fill: true, tension: 0.35, borderWidth: 2,
      pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: ACCENT,
      pointHoverBorderColor: "#09090b", pointHoverBorderWidth: 2, pointHitRadius: 16,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const, intersect: false,
        callbacks: {
          title: (items: { dataIndex: number }[]) => (items.length ? fmtLongDate(series[items[0].dataIndex].date) : ""),
          label: (ctx: { raw: unknown }) => `${Number(ctx.raw).toLocaleString()} characters`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#71717a", font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: { grid: { color: "#27272a" }, ticks: { color: "#71717a", font: { size: 11 }, callback: (v: unknown) => formatNumber(Number(v)) } },
    },
  } as const;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
          EXP Tracker
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Activity</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-muted)]">
          Daily count of tracked characters that gained EXP. The active top player base, by job and level.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Job</label>
          <Select value={job} onChange={setJob}>
            <option value="all">All Jobs</option>
            {[...classes].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Minimum Level</label>
          <Select value={minLevel} onChange={setMinLevel}>
            {LEVELS.map((l) => <option key={l.val} value={l.val}>{l.label}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Time Range</label>
          <div className="flex gap-1 rounded-lg bg-[var(--color-background)] p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${days === r.days ? "bg-[var(--color-accent)] text-black" : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cardCls}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Daily Average</div>
          <div className="mt-1 text-4xl font-bold text-[var(--color-foreground)]">{(data?.avg ?? 0).toLocaleString()}</div>
          <div className="text-xs text-[var(--color-muted)]">characters / day</div>
        </div>
        <div className={cardCls}>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">Peak Day</div>
          <div className="mt-1 text-4xl font-bold text-[var(--color-accent)]">{(data?.peak?.count ?? 0).toLocaleString()}</div>
          <div className="text-xs text-[var(--color-muted)]">{data?.peak ? fmtLongDate(data.peak.date) : "—"}</div>
        </div>
      </div>

      {/* Chart */}
      <section className={`${cardCls} mt-6`}>
        <div className="relative h-[380px]">
          {loading ? (
            <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">Loading…</p>
          ) : series.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">No activity data for these filters.</p>
          )}
        </div>
      </section>
    </div>
  );
}
