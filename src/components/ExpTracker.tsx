"use client";

import { useEffect, useState } from "react";
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
const PAGE_SIZE = 50;

// ---- Types ----
interface LeaderRow {
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
  gainRank: number | null;
}
interface LeaderboardResponse { total: number; page: number; pageSize: number; characters: LeaderRow[] }

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

// ---- Helpers ----
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

// ---- Chart options ----
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

// ---- Main component ----
export default function ExpTracker() {
  // Leaderboard state
  const [lb, setLb] = useState<LeaderboardResponse | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"rank" | "dailyGain">("rank");
  const [page, setPage] = useState(1);

  // Detail state
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<LeaderRow | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [averages, setAverages] = useState<Averages | null>(null);
  const [daily, setDaily] = useState<DailyGain[]>([]);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [dailyDays, setDailyDays] = useState(30);
  const [progressDays, setProgressDays] = useState(30);
  const [estimateDays, setEstimateDays] = useState(30);
  const [targetLevel, setTargetLevel] = useState("");
  const [dailyExpInput, setDailyExpInput] = useState("");

  // ---- Leaderboard fetch (debounced search) ----
  useEffect(() => {
    const run = () =>
      api<LeaderboardResponse>(
        `/api/exp/leaderboard?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}&pageSize=${PAGE_SIZE}`
      ).then(setLb);
    const t = setTimeout(run, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, sort, page]);

  // ---- Detail: summary + averages ----
  useEffect(() => {
    if (!selected) return;
    (async () => {
      const [sum, avg] = await Promise.all([
        api<Summary>(`/api/exp/stats/${encodeURIComponent(selected)}/summary`),
        api<Averages>(`/api/exp/stats/${encodeURIComponent(selected)}/averages`),
      ]);
      setSummary(sum);
      setAverages(avg);
    })();
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    api<DailyGain[]>(`/api/exp/stats/${encodeURIComponent(selected)}/gains?days=${dailyDays}`).then((d) => setDaily(d ?? []));
  }, [selected, dailyDays]);

  useEffect(() => {
    if (!selected) return;
    api<ProgressPoint[]>(`/api/exp/stats/${encodeURIComponent(selected)}/progress?days=${progressDays}`).then((p) => setProgress(p ?? []));
  }, [selected, progressDays]);

  useEffect(() => {
    if (!selected || !targetLevel) return;
    const params = new URLSearchParams({ targetLevel });
    const override = parseNumberInput(dailyExpInput);
    if (override) params.set("dailyExp", String(Math.round(override)));
    api<Estimate>(`/api/exp/stats/${encodeURIComponent(selected)}/estimate?${params}`).then(setEstimate);
  }, [selected, targetLevel, dailyExpInput]);

  function openCharacter(row: LeaderRow) {
    setSelectedMeta(row);
    setSelected(row.assetKey);
    setTargetLevel(""); setDailyExpInput("");
    setSummary(null); setAverages(null); setDaily([]); setProgress([]); setEstimate(null);
    window.scrollTo({ top: 0 });
  }
  function backToLeaderboard() {
    setSelected(null);
    setSelectedMeta(null);
  }

  // ---- Detail chart datasets ----
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
  const projection = estimate?.projection?.slice(0, estimateDays + 1) ?? [];
  const estimateData = {
    labels: projection.map((p) => fmtDate(p.date)),
    datasets: [{
      data: projection.map((p) => p.level + p.pct / 100),
      borderColor: ACCENT, backgroundColor: "rgba(245, 158, 11, 0.05)",
      fill: true, tension: 0.1, pointRadius: 0, borderWidth: 2,
    }],
  };

  const totalPages = lb ? Math.max(1, Math.ceil(lb.total / PAGE_SIZE)) : 1;

  // ================= DETAIL VIEW =================
  if (selected && selectedMeta) {
    const m = selectedMeta;
    return (
      <div>
        <div>
          <button
            onClick={backToLeaderboard}
            className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            ← Back to leaderboard
          </button>

          <div className="mt-6 flex gap-8 max-lg:flex-col">
            {/* ── Character card (left) ── */}
            <aside className="w-80 flex-shrink-0 max-lg:w-full">
              <div className={`${cardCls} pt-4 text-center lg:sticky lg:top-6`}>
                <h2 className="-mx-6 mb-4 border-b border-[var(--color-border)] px-6 pb-3 text-xl font-bold text-[var(--color-foreground)]">{m.name}</h2>
                {m.imageUrl ? (
                  <div className="mx-auto mb-2 h-56 w-56 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="h-full w-full scale-[1.5] object-contain"
                    />
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
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">EXP Progress Estimate</h2>
                <p className="text-sm text-[var(--color-muted)]">Forecast your leveling progress</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <PeriodTabs days={estimateDays} options={[14, 30, 90, 180]} onSelect={setEstimateDays} />
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
            <div className="relative h-[360px]">
              {targetLevel && estimate && !estimate.error && projection.length > 0 ? (
                <Line data={estimateData} options={lineOptions} />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                  {(targetLevel && estimate?.error) || "Set a target level below to forecast"}
                </p>
              )}
            </div>

            {/* Level Milestones */}
            <div className="mt-6 border-t border-[var(--color-border)] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">Level Milestones</h3>
                <div className="flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm text-[var(--color-muted)]">Desired Level:</label>
                  <input
                    type="number" min={1} max={275}
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    placeholder="e.g. 275"
                    className="w-28 rounded-md border border-[var(--color-accent)] bg-[var(--color-elevated)] px-3 py-1.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-accent-hover)] focus:outline-none"
                  />
                </div>
              </div>
              <table className="mt-3 w-full border-collapse">
                <thead>
                  <tr>
                    {["Level", "Days Required", "Days Until", "Date", "Total EXP Needed"].map((h) => (
                      <th key={h} className="border-b border-[var(--color-border)] px-3 py-2.5 text-left text-xs tracking-wide text-[var(--color-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {targetLevel && estimate && !estimate.error && estimate.milestones.length > 0 ? (
                    estimate.milestones.map((mi) => (
                      <tr key={mi.level}>
                        <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm font-bold text-[var(--color-foreground)]">{mi.level}</td>
                        <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-secondary)]">{mi.daysRequired} days</td>
                        <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-accent)]">{mi.daysRequired} days</td>
                        <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-secondary)]">{mi.date}</td>
                        <td className="border-b border-[var(--color-border)]/50 px-3 py-3 text-sm text-[var(--color-accent)]">{formatNumber(mi.totalExpNeeded)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-3 py-3 text-sm text-[var(--color-muted)]">{estimate?.error ?? "Set a target level above"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
      </div>
    );
  }

  // ================= LEADERBOARD VIEW =================
  return (
    <div>
      {/* Hero */}
      <div className="relative mb-8 text-center">
        <div className="hero-glow" />
        <div className="mb-2 inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
          MapleStory N
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">EXP Leaderboard</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          {lb ? `${lb.total.toLocaleString()} tracked characters, refreshed daily.` : "MapleStory N ranking tracker."}
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </div>

      {/* Toolbar: search + sort */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search character…"
          className="w-64 max-w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3.5 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <div className="flex gap-1 rounded-lg bg-[var(--color-surface)] p-1">
          {([["rank", "Rank"], ["dailyGain", "Top Gain"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setSort(val); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === val ? "bg-[var(--color-accent)] text-black" : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={`${cardCls} overflow-x-auto p-0`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Character</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3 text-right">Lv</th>
                <th className="px-4 py-3 text-right">EXP%</th>
                <th className="px-4 py-3 text-right">Daily</th>
                <th className="px-4 py-3 text-right">Weekly</th>
                <th className="px-4 py-3 text-right">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {lb?.characters.length ? (
                lb.characters.map((c) => (
                  <tr
                    key={c.assetKey}
                    onClick={() => openCharacter(c)}
                    className="cursor-pointer border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-elevated)]"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-[var(--color-accent)]">{c.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {c.imageUrl ? (
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.imageUrl} alt={c.name} className="h-full w-full scale-[1.6] object-contain" />
                          </div>
                        ) : (
                          <div className="h-16 w-16 flex-shrink-0 rounded bg-[var(--color-elevated)]" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{c.name}</div>
                          {c.guild && <div className="truncate text-xs text-[var(--color-muted)]">{c.guild}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-secondary)]">{c.job ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--color-foreground)]">{c.level ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--color-muted)]">{c.expPct != null ? c.expPct.toFixed(1) + "%" : "—"}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--color-accent)]">{gainStr(c.dailyGain)}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--color-secondary)]">{gainStr(c.weeklyGain)}</td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--color-secondary)]">{gainStr(c.monthlyGain)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-[var(--color-muted)]">
                    {lb ? "No characters found." : "Loading…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lb && lb.total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-[var(--color-muted)]">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
