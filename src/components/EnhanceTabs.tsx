"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TIERS, TIER_LABELS, type GearTier } from "@/lib/enhanceData";
import { type EnhanceItem } from "@/lib/enhanceData";
import { type ItemPriceData } from "@/lib/msuApi";
import EnhanceItemCard from "./EnhanceItemCard";

interface ItemResult {
  item: EnhanceItem;
  price: ItemPriceData | null;
  imageUrl: string;
}

type TierCache = Partial<Record<GearTier, ItemResult[]>>;

export default function EnhanceTabs() {
  const [activeTab, setActiveTab] = useState<GearTier>("arcane");
  const [cache, setCache] = useState<TierCache>({});
  const [loading, setLoading] = useState<GearTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTier = useCallback(async (tier: GearTier) => {
    setLoading(tier);
    setError(null);
    try {
      const res = await fetch(`/api/prices?tier=${tier}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCache((prev) => ({ ...prev, [tier]: data.items }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load prices");
    } finally {
      setLoading(null);
    }
  }, []);

  // Fetch active tab on mount + tab switch (if not cached)
  useEffect(() => {
    if (!cache[activeTab]) {
      fetchTier(activeTab);
    }
  }, [activeTab, cache, fetchTier]);

  // Poll active tab every 60 seconds
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchTier(activeTab);
    }, 60 * 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTab, fetchTier]);

  const items = cache[activeTab] ?? null;
  const isLoading = loading === activeTab;

  return (
    <div>
      {/* Tab bar — mirrors NavBar pill group style */}
      <div className="mb-6 flex items-center gap-1 rounded-lg border border-[var(--color-border)] w-fit px-1 py-1">
        {TIERS.map((tier) => (
          <button
            key={tier}
            onClick={() => setActiveTab(tier)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tier
                ? "bg-[var(--color-elevated)] text-[var(--color-foreground)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
            }`}
          >
            {TIER_LABELS[tier]}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {error}
        </div>
      )}

      {/* Item grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && !items
          ? // Skeleton placeholders
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              />
            ))
          : items?.map((r) => (
              <EnhanceItemCard
                key={r.item.id}
                item={r.item}
                price={r.price}
                imageUrl={r.imageUrl}
                loading={isLoading}
              />
            ))}
      </div>

      {/* Live indicator */}
      <div className="mt-6 flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
        Prices refresh every hour
      </div>
    </div>
  );
}
