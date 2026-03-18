"use client";

import Image from "next/image";
import { type EnhanceItem, CUBE_NAMES } from "@/lib/enhanceData";
import { type ItemPriceData, weiToNeso } from "@/lib/msuApi";
import { formatNumber } from "@/lib/format";

interface Props {
  item: EnhanceItem;
  price: ItemPriceData | null;
  imageUrl: string;
  loading?: boolean;
}

function nesoOrNull(weiStr?: string): number | null {
  if (!weiStr || weiStr === "0") return null;
  const n = weiToNeso(weiStr);
  return n > 0 ? n : null;
}

export default function EnhanceItemCard({ item, price, imageUrl, loading }: Props) {

  const sfEntries = price
    ? Object.entries(price.starforce)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([star, dp]) => ({ star, neso: nesoOrNull(dp?.currentPrice?.price), step: dp?.currentPrice?.step }))
        .filter((r) => r.neso !== null && Number(r.star) >= 10 && r.step !== "STEP_TYPE_DISCOVERY")
    : [];

  const cubeEntries = price
    ? Object.entries(price.potential)
        .map(([id, dp]) => ({ id, name: CUBE_NAMES[id] ?? `Cube ${id}`, neso: nesoOrNull(dp?.currentPrice?.price), step: dp?.currentPrice?.step }))
        .filter((r) => r.neso !== null && r.step !== "STEP_TYPE_DISCOVERY")
    : [];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex w-full items-center gap-3 px-4 py-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--color-elevated)]">
          <Image src={imageUrl} alt={item.name} width={40} height={40} className="object-contain" unoptimized />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--color-foreground)]">{item.name}</div>
          <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">{item.slot}</div>
        </div>

        {price === null && !loading && (
          <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">Unavailable</span>
        )}

      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-3">
          {price === null ? (
            <p className="text-xs text-amber-400">Price data unavailable for this item.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* StarForce */}
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">StarForce</div>
                {sfEntries.length === 0 ? (
                  <p className="text-[11px] text-[var(--color-muted)]">No data</p>
                ) : (
                  <div className="space-y-0.5">
                    {sfEntries.map(({ star, neso }) => (
                      <div key={star} className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--color-muted)]">★{star}</span>
                        <span className="font-mono text-[var(--color-foreground)]">{formatNumber(neso!)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cubes */}
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Cubes</div>
                {cubeEntries.length === 0 ? (
                  <p className="text-[11px] text-[var(--color-muted)]">No data</p>
                ) : (
                  <div className="space-y-0.5">
                    {cubeEntries.map(({ id, name, neso }) => (
                      <div key={id} className="flex items-center gap-2 text-[11px]">
                        <Image
                          src={`https://api-static.msu.io/itemimages/icon/${id}.png`}
                          alt={name}
                          width={20}
                          height={20}
                          className="shrink-0 object-contain"
                          unoptimized
                        />
                        <span className="shrink-0 font-mono text-[var(--color-foreground)]">{formatNumber(neso!)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
