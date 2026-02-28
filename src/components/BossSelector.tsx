"use client";

import { BOSS_DATA, type BossEntry, type Difficulty } from "@/lib/bossData";
import { formatNumber } from "@/lib/format";
import { useState, useRef, useEffect } from "react";

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/15 text-emerald-500",
  Normal: "bg-sky-500/15 text-sky-500",
  Hard: "bg-amber-500/15 text-amber-500",
  Chaos: "bg-red-500/15 text-red-500",
  Extreme: "bg-purple-500/15 text-purple-500",
};

interface Props {
  selectedId: string | null;
  onSelect: (boss: BossEntry) => void;
}

export default function BossSelector({ selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const selected = BOSS_DATA.find((b) => b.id === selectedId);
  const filtered = BOSS_DATA.filter((b) =>
    `${b.name} ${b.difficulty}`.toLowerCase().includes(search.toLowerCase())
  );

  // Group by boss name
  const groups: { name: string; image: string; entries: BossEntry[] }[] = [];
  let currentGroup: (typeof groups)[number] | null = null;
  for (const entry of filtered) {
    if (!currentGroup || currentGroup.name !== entry.name) {
      currentGroup = { name: entry.name, image: entry.image, entries: [] };
      groups.push(currentGroup);
    }
    currentGroup.entries.push(entry);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-secondary)]">
        Boss
      </label>
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5 text-left text-sm transition-colors hover:border-[var(--color-border-hover)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
        >
          {selected ? (
            <>
              <img
                src={selected.image}
                alt=""
                className="h-8 w-8 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">
                    {selected.name}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${DIFFICULTY_BADGE[selected.difficulty]}`}
                  >
                    {selected.difficulty}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
                  {formatNumber(selected.hp)} HP
                </div>
              </div>
            </>
          ) : (
            <span className="text-[var(--color-muted)]">
              Select a boss...
            </span>
          )}
          <svg
            className={`ml-auto h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-full origin-top animate-[dropdown_150ms_ease-out] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            {/* Search */}
            <div className="border-b border-[var(--color-border)] p-2">
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search bosses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-[var(--color-elevated)] py-1.5 pl-8 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto py-1">
              {groups.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">
                  No bosses found
                </div>
              )}
              {groups.map((group, i) => (
                <div key={group.name}>
                  {/* Group separator */}
                  {i > 0 && (
                    <div className="mx-3 my-1 border-t border-[var(--color-border)]" />
                  )}

                  {/* Group header */}
                  <div className="flex items-center gap-2.5 px-3 pb-1 pt-2">
                    <img
                      src={group.image}
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                    <span className="text-xs font-semibold text-[var(--color-foreground)]">
                      {group.name}
                    </span>
                  </div>

                  {/* Entries */}
                  {group.entries.map((entry) => {
                    const isSelected = entry.id === selectedId;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          onSelect(entry);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 pl-11 text-sm transition-colors hover:bg-[var(--color-elevated)] ${
                          isSelected ? "bg-[var(--color-elevated)]" : ""
                        }`}
                      >
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${DIFFICULTY_BADGE[entry.difficulty]}`}
                        >
                          {entry.difficulty}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-secondary)]">
                          {formatNumber(entry.hp)}
                        </span>
                        {isSelected && (
                          <svg
                            className="ml-auto h-4 w-4 text-[var(--color-accent)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
