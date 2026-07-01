"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

interface ClassInfo { name: string; archetype: string; count: number }

const ARCH_ORDER = ["Warrior", "Mage", "Archer", "Thief", "Pirate", "Other"];
const ARCH_COLOR: Record<string, string> = {
  Warrior: "#ef4444",
  Mage: "#3b82f6",
  Archer: "#22c55e",
  Thief: "#a855f7",
  Pirate: "#f59e0b",
  Other: "#71717a",
};
const archColor = (a: string) => ARCH_COLOR[a] ?? ARCH_COLOR.Other;

const cardCls = "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6";
const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

export default function ClassStatsPage() {
  const [classes, setClasses] = useState<ClassInfo[] | null>(null);

  useEffect(() => {
    fetch("/api/exp/classes")
      .then((r) => (r.ok ? r.json() : []))
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  const total = classes?.reduce((s, c) => s + c.count, 0) ?? 0;
  const sorted = [...(classes ?? [])].sort((a, b) => b.count - a.count);
  const archTotals = ARCH_ORDER
    .map((arch) => ({ arch, count: (classes ?? []).filter((c) => c.archetype === arch).reduce((s, c) => s + c.count, 0) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const doughnutData = {
    labels: archTotals.map((a) => a.arch),
    datasets: [{ data: archTotals.map((a) => a.count), backgroundColor: archTotals.map((a) => archColor(a.arch)), borderColor: "#18181b", borderWidth: 2 }],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: { label: string; raw: unknown }) => `${ctx.label}: ${Number(ctx.raw).toLocaleString()} (${pct(Number(ctx.raw), total).toFixed(1)}%)` } },
    },
  } as const;

  const barData = {
    labels: sorted.map((c) => c.name),
    datasets: [{ data: sorted.map((c) => c.count), backgroundColor: sorted.map((c) => archColor(c.archetype)), borderRadius: 4 }],
  };
  const barOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: { raw: unknown }) => `${Number(ctx.raw).toLocaleString()} (${pct(Number(ctx.raw), total).toFixed(1)}%)` } },
    },
    scales: {
      x: { grid: { color: "#27272a" }, ticks: { color: "#71717a", font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { color: "#a1a1aa", font: { size: 11 } } },
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
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Class Population</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          {classes ? `Class distribution across ${total.toLocaleString()} ranked characters.` : "MapleStory N class distribution."}
        </p>
      </div>

      {!classes ? (
        <div className="py-20 text-center text-sm text-[var(--color-muted)]">Loading…</div>
      ) : (
        <>
          {/* Archetype distribution */}
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className={`${cardCls} flex flex-col items-center`}>
              <h2 className="mb-4 self-start text-sm font-semibold text-[var(--color-foreground)]">By Archetype</h2>
              <div className="relative h-52 w-52">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
            <div className={cardCls}>
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-foreground)]">Archetype Breakdown</h2>
              <div className="flex flex-col gap-3">
                {archTotals.map((a) => (
                  <div key={a.arch}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: archColor(a.arch) }} />
                        <span className="text-[var(--color-foreground)]">{a.arch}</span>
                      </span>
                      <span className="text-[var(--color-muted)]">
                        {a.count.toLocaleString()} · {pct(a.count, total).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-[var(--color-elevated)]">
                      <div className="h-full rounded" style={{ width: `${pct(a.count, total)}%`, background: archColor(a.arch) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-class bar chart */}
          <section className={`${cardCls} mt-6`}>
            <h2 className="mb-5 text-sm font-semibold text-[var(--color-foreground)]">All Classes by Population</h2>
            <div className="relative" style={{ height: `${Math.max(320, sorted.length * 26)}px` }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </section>

          {/* Table */}
          <section className={`${cardCls} mt-6 overflow-x-auto`}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--color-muted)]">
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Archetype</th>
                  <th className="px-3 py-2.5 text-right">Count</th>
                  <th className="px-3 py-2.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.name} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2.5 text-sm font-bold text-[var(--color-muted)]">{i + 1}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-[var(--color-foreground)]">{c.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: archColor(c.archetype) + "22", color: archColor(c.archetype) }}>
                        {c.archetype}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-[var(--color-secondary)]">{c.count.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-sm text-[var(--color-muted)]">{pct(c.count, total).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
