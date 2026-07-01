"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 50;

interface LeaderRow {
  assetKey: string;
  name: string;
  job: string | null;
  guild: string | null;
  imageUrl: string | null;
  rank: number | null;
  classRank: number | null;
  level: number | null;
  expPct: number | null;
  dailyGain: number | null;
  weeklyGain: number | null;
  monthlyGain: number | null;
}
interface LeaderboardResponse { total: number; page: number; pageSize: number; updatedAt: string | null; characters: LeaderRow[] }
interface ClassInfo { name: string; archetype: string; count: number }
interface Suggestion { assetKey: string; name: string; class: string | null; imageUrl: string | null; level: number | null; rank: number | null }

const ARCHETYPE_ORDER = ["Warrior", "Mage", "Archer", "Thief", "Pirate", "Other"];
const gainStr = (n: number | null) => (n == null ? "—" : "+" + formatNumber(n));
const charHref = (name: string) => `/tools/exp-tracker/${encodeURIComponent(name)}`;

async function api<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const cardCls = "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7";
const chipBase = "rounded-full px-3 py-1 text-sm font-medium transition-colors";

export default function ExpTracker() {
  const router = useRouter();
  const [lb, setLb] = useState<LeaderboardResponse | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"rank" | "dailyGain">("rank");
  const [job, setJob] = useState("all");
  const [archetype, setArchetype] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [page, setPage] = useState(1);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<ClassInfo[]>("/api/exp/classes").then((c) => c && setClasses(c));
  }, []);

  // Leaderboard (debounced on search)
  useEffect(() => {
    const run = () =>
      api<LeaderboardResponse>(
        `/api/exp/leaderboard?search=${encodeURIComponent(search)}&sort=${sort}&job=${encodeURIComponent(job)}&page=${page}&pageSize=${PAGE_SIZE}`
      ).then(setLb);
    const t = setTimeout(run, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [search, sort, job, page]);

  // Autocomplete suggestions (debounced)
  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      api<Suggestion[]>(`/api/exp/search?name=${encodeURIComponent(search)}`).then((s) => setSuggestions(s ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggest(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const archetypes = ARCHETYPE_ORDER.filter((a) => classes.some((c) => c.archetype === a));
  const chips = archetype ? classes.filter((c) => c.archetype === archetype) : [];
  const totalPages = lb ? Math.max(1, Math.ceil(lb.total / PAGE_SIZE)) : 1;

  function selectArchetype(a: string | null) {
    setArchetype(a);
    setJob("all");
    setPage(1);
  }
  function selectChip(name: string) {
    setJob((cur) => (cur === name ? "all" : name));
    setPage(1);
  }

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
          {lb ? `${lb.total.toLocaleString()} tracked characters` : "MapleStory N ranking tracker."}
        </p>
        {lb?.updatedAt && (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Data updated{" "}
            {new Date(lb.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            {" "}· refreshes daily
          </p>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
      </div>

      {/* Toolbar: search (autocomplete) + sort */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72 max-w-full" ref={searchRef}>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); setShowSuggest(true); }}
            onFocus={() => setShowSuggest(true)}
            placeholder="Search character…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3.5 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          />
          {showSuggest && search.trim() && suggestions.length > 0 && (
            <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
              {suggestions.slice(0, 8).map((s) => (
                <button
                  key={s.assetKey}
                  onClick={() => { setShowSuggest(false); router.push(charHref(s.name)); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--color-elevated)]"
                >
                  {s.imageUrl ? (
                    <div className="h-9 w-9 flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imageUrl} alt={s.name} className="h-full w-full scale-[1.6] object-contain" />
                    </div>
                  ) : (
                    <div className="h-9 w-9 flex-shrink-0 rounded bg-[var(--color-elevated)]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--color-foreground)]">{s.name}</div>
                    <div className="truncate text-xs text-[var(--color-muted)]">
                      {s.class ?? ""}{s.level ? ` · Lv.${s.level}` : ""}{s.rank ? ` · #${s.rank}` : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

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

      {/* Class filter: archetype tabs + class chips */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => selectArchetype(null)}
            className={`${chipBase} ${archetype === null ? "bg-[var(--color-accent)] text-black" : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-secondary)]"}`}
          >
            All classes
          </button>
          {archetypes.map((a) => (
            <button
              key={a}
              onClick={() => selectArchetype(a)}
              className={`${chipBase} ${archetype === a ? "bg-[var(--color-accent)] text-black" : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-secondary)]"}`}
            >
              {a}
            </button>
          ))}
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.name}
                onClick={() => selectChip(c.name)}
                className={`${chipBase} text-xs ${job === c.name ? "bg-[var(--color-accent)] text-black" : "bg-[var(--color-elevated)] text-[var(--color-secondary)] hover:text-[var(--color-foreground)]"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
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
                    onClick={() => router.push(charHref(c.name))}
                    className="cursor-pointer border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-elevated)]"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-[var(--color-accent)]">{c.classRank ?? c.rank}</td>
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
                          <Link
                            href={charHref(c.name)}
                            onClick={(e) => e.stopPropagation()}
                            className="truncate text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)]"
                          >
                            {c.name}
                          </Link>
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
