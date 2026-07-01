"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { formatNumber, parseNumberInput } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip);

const ACCENT = "#f59e0b";

export interface CharacterMeta {
  assetKey: string;
  name: string;
  job: string | null;
  guild: string | null;
  imageUrl: string | null;
  rank: number | null;
  level: number | null;
  expPct: number | null;
  dailyGain: number | null;
  weeklyGain: number | null;
  monthlyGain: number | null;
}

interface Summary {
  level: number;
  exp: number;
  expPct: number;
  expToNext: number;
  levelRank: number | null;
  lastUpdated: string;
}
interface DailyGain { date: string; expGained: number }
interface AveragePeriod { avgPerDay: number; dailyPct: number; total: number; days: number }
type Averages = Record<"7d" | "14d" | "30d" | "90d", AveragePeriod>;
interface ProgressPoint { date: string; level: number; pct: number }
interface Milestone { level: number; daysRequired: number; date: string; totalExpNeeded: number }
interface Estimate {
  avgDailyExp: number;
  projection: { date: string; level: number; pct: number }[];
  milestones: Milestone[];
  error?: string;
}

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}
const gainStr = (n: number | null) => (n == null ? "—" : "+" + formatNumber(n));

async function api<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, opts);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const AXIS_TICK = { color: "#71717a", font: { size: 11 } as const, maxRotation: 0 };
const GRID = { color: "#27272a" };

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: { raw: unknown }) => formatNumber(Number(ctx.raw)) + " EXP" } },
  },
  scales: {
    x: { grid: { display: false }, ticks: AXIS_TICK },
    y: { grid: GRID, ticks: { ...AXIS_TICK, callback: (v: unknown) => formatNumber(Number(v)) } },
  },
} as const;

const levelTick = (v: unknown) => {
  const n = Number(v);
  const lvl = Math.floor(n);
  const pct = ((n - lvl) * 100).toFixed(1);
  return `${lvl} (${pct}%)`;
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown }) => {
          const n = Number(ctx.raw);
          const lvl = Math.floor(n);
          const pct = ((n - lvl) * 100).toFixed(1);
          return `Lv.${lvl} (${pct}%)`;
        },
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: AXIS_TICK },
    y: { grid: GRID, ticks: { ...AXIS_TICK, callback: levelTick } },
  },
} as const;

function PeriodTabs({ days, options, onSelect }: { days: number; options: number[]; onSelect: (d: number) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-[var(--color-background)] p-1">
      {options.map((d) => (
        <button
          key={d}
          onClick={() => onSelect(d)}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            days === d ? "bg-[var(--color-accent)] text-black" : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

const cardCls = "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7";

export default function CharacterDetail({ character: m }: { character: CharacterMeta }) {
  const assetKey = m.assetKey;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [averages, setAverages] = useState<Averages | null>(null);
  const [daily, setDaily] = useState<DailyGain[]>([]);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [dailyDays, setDailyDays] = useState(30);
  const [progressDays, setProgressDays] = useState(30);
  // Default the target: aim for 275 once you're 250+, otherwise 250.
  const [targetLevel, setTargetLevel] = useState(() => ((m.level ?? 999) < 250 ? "250" : "275"));
  const [dailyExpInput, setDailyExpInput] = useState("");

  useEffect(() => {
    (async () => {
      const [sum, avg] = await Promise.all([
        api<Summary>(`/api/exp/stats/${encodeURIComponent(assetKey)}/summary`),
        api<Averages>(`/api/exp/stats/${encodeURIComponent(assetKey)}/averages`),
      ]);
      setSummary(sum);
      setAverages(avg);
    })();
  }, [assetKey]);

  useEffect(() => {
    api<DailyGain[]>(`/api/exp/stats/${encodeURIComponent(assetKey)}/gains?days=${dailyDays}`).then((d) => setDaily(d ?? []));
  }, [assetKey, dailyDays]);

  useEffect(() => {
    api<ProgressPoint[]>(`/api/exp/stats/${encodeURIComponent(assetKey)}/progress?days=${progressDays}`).then((p) => setProgress(p ?? []));
  }, [assetKey, progressDays]);

  useEffect(() => {
    if (!targetLevel) return;
    const params = new URLSearchParams({ targetLevel });
    const override = parseNumberInput(dailyExpInput);
    if (override) params.set("dailyExp", String(Math.round(override)));
    api<Estimate>(`/api/exp/stats/${encodeURIComponent(assetKey)}/estimate?${params}`).then(setEstimate);
  }, [assetKey, targetLevel, dailyExpInput]);

  const dailyData = {
    labels: daily.map((d) => fmtDate(d.date)),
    datasets: [{ data: daily.map((d) => d.expGained), backgroundColor: ACCENT, borderRadius: 4, borderSkipped: false as const }],
  };
  const progressData = {
    labels: progress.map((p) => fmtDate(p.date)),
    datasets: [{
      data: progress.map((p) => p.level + p.pct / 100),
      borderColor: ACCENT, backgroundColor: "rgba(245, 158, 11, 0.1)",
      fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
    }],
  };

  return (
    <div>
      <Link
        href="/tools/exp-tracker"
        className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
      >
        ← Back to leaderboard
      </Link>

      <div className="mt-6 flex gap-8 max-lg:flex-col">
        {/* ── Character card (left) ── */}
        <aside className="w-80 flex-shrink-0 max-lg:w-full">
          <div className={`${cardCls} pt-4 text-center lg:sticky lg:top-6`}>
            <h2 className="-mx-6 mb-4 border-b border-[var(--color-border)] px-6 pb-3 text-xl font-bold text-[var(--color-foreground)]">{m.name}</h2>
            {m.imageUrl ? (
              <div className="relative mx-auto mb-2 h-56 w-56 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={m.name} className="absolute left-1/2 top-1/2 h-[150%] w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
              </div>
            ) : (
              <div className="mx-auto h-56 w-56 rounded bg-[var(--color-elevated)]" />
            )}
            <div className="mb-1 flex items-baseline justify-center gap-2">
              <span className="text-sm tracking-[2px] text-[var(--color-muted)]">LEVEL</span>
              <span className="text-5xl font-bold text-[var(--color-accent)]">{summary?.level ?? m.level ?? "-"}</span>
            </div>
            <div className="text-sm text-[var(--color-accent)]">
              {m.job ?? "Unknown"}{m.rank != null ? ` · Rank #${m.rank}` : ""}
            </div>
            {m.guild && <div className="mt-0.5 text-xs text-[var(--color-muted)]">{m.guild}</div>}

            <div className="mt-3 mb-1.5">
              <span className="block text-xs text-[var(--color-muted)]">Level EXP</span>
              <span className="text-sm text-[var(--color-secondary)]">
                {summary ? `${formatNumber(summary.exp)} / ${formatNumber(summary.expToNext)}` : "—"}
              </span>
            </div>
            <div className="mb-1 h-2 overflow-hidden rounded bg-[var(--color-elevated)]">
              <div className="h-full rounded bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${Math.min(summary?.expPct ?? m.expPct ?? 0, 100)}%` }} />
            </div>
            <div className="text-sm text-[var(--color-muted)]">{(summary?.expPct ?? m.expPct ?? 0).toFixed(2)}%</div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-3">
              {([["Daily", m.dailyGain], ["Weekly", m.weeklyGain], ["Monthly", m.monthlyGain]] as const).map(([label, val]) => (
                <div key={label}>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
                  <div className="text-xs font-semibold text-[var(--color-accent)]">{gainStr(val)}</div>
                </div>
              ))}
            </div>
            <a
              href={`https://msu.io/navigator/character/${assetKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] py-2 text-sm font-medium text-[var(--color-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              View on MSU Navigator ↗
            </a>
            {summary?.lastUpdated && (
              <div className="mt-3 text-xs text-[var(--color-muted)]">
                Updated {new Date(summary.lastUpdated).toLocaleDateString()}
              </div>
            )}
          </div>
        </aside>

        {/* ── Sections (right) ── */}
        <main className="flex min-w-0 flex-1 flex-col gap-8">

          {/* Daily EXP Gains */}
          <section className={cardCls}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Daily EXP Gains</h2>
                <p className="text-sm text-[var(--color-muted)]">Daily experience progression</p>
              </div>
              <PeriodTabs days={dailyDays} options={[7, 14, 30, 90]} onSelect={setDailyDays} />
            </div>
            <div className="relative h-[360px]">
              {daily.length > 0 ? <Bar data={dailyData} options={barOptions} /> : (
                <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">No data yet</p>
              )}
            </div>
          </section>

          {/* Average cards */}
          {averages && (
            <section className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-sm:grid-cols-1">
              {(["7d", "14d", "30d", "90d"] as const).map((period) => {
                const a = averages[period];
                return (
                  <div key={period} className="rounded-xl border border-[var(--color-border)] border-t-[3px] border-t-[var(--color-accent)] bg-[var(--color-surface)] p-6">
                    <span className="mb-3 block text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{period.replace("d", " DAY")} AVERAGE</span>
                    <span className="block text-3xl font-bold text-[var(--color-foreground)]">{formatNumber(a.avgPerDay)}</span>
                    <span className="mb-4 block text-xs text-[var(--color-muted)]">per day</span>
                    <div className="flex justify-between border-t border-[var(--color-border)] py-1.5 text-sm">
                      <span className="text-[var(--color-muted)]">Daily %</span>
                      <span className="text-[var(--color-accent)]">{a.dailyPct}%</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--color-border)] py-1.5 text-sm">
                      <span className="text-[var(--color-muted)]">Total</span>
                      <span className="text-[var(--color-secondary)]">{formatNumber(a.total)}</span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* EXP Progress Estimate */}
          <section className={cardCls}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">EXP Progress Estimate</h2>
                <p className="text-sm text-[var(--color-muted)]">Days and dates to reach each level at your current pace</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm text-[var(--color-muted)]">Target Lv:</label>
                  <input
                    type="number" min={1} max={275}
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    placeholder="e.g. 275"
                    className="w-24 rounded-md border border-[var(--color-accent)] bg-[var(--color-elevated)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent-hover)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm text-[var(--color-muted)]">Daily EXP:</label>
                  <input
                    type="text"
                    value={dailyExpInput}
                    onChange={(e) => setDailyExpInput(e.target.value)}
                    placeholder={estimate?.avgDailyExp ? formatNumber(estimate.avgDailyExp) : "auto"}
                    className="w-28 rounded-md border border-[var(--color-accent)] bg-[var(--color-elevated)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent-hover)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Level", "Days Until", "Date", "Total EXP Needed"].map((h) => (
                    <th key={h} className="border-b border-[var(--color-border)] px-3 py-2.5 text-left text-xs tracking-wide text-[var(--color-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {targetLevel && estimate && !estimate.error && estimate.milestones.length > 0 ? (
                  estimate.milestones.map((mi) => (
                    <tr key={mi.level}>
                      <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm font-bold text-[var(--color-foreground)]">{mi.level}</td>
                      <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-accent)]">{mi.daysRequired} days</td>
                      <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-secondary)]">{mi.date}</td>
                      <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-accent)]">{formatNumber(mi.totalExpNeeded)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">{estimate?.error ?? "Set a target level to forecast"}</td></tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Level Progress */}
          <section className={cardCls}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Level Progress</h2>
                <p className="text-sm text-[var(--color-muted)]">Leveling journey over time</p>
              </div>
              <PeriodTabs days={progressDays} options={[7, 14, 30, 90]} onSelect={setProgressDays} />
            </div>
            <div className="relative h-[360px]">
              {progress.length > 0 ? <Line data={progressData} options={lineOptions} /> : (
                <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">No data yet</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
