import { cache } from "react";

import type { MasterDealRecord } from "@/lib/market-data";
import { getMasterDeals } from "@/lib/market-data";
import { slugify } from "@/lib/utils";

export interface DealPageRecord {
  slug: string;
  deal: MasterDealRecord;
}

function buildDealSlug(deal: MasterDealRecord, used: Set<string>): string {
  const baseParts = [deal.deal_name, deal.series_name, deal.deal_id, deal.deal_year?.toString()].filter(Boolean);
  const base = slugify(baseParts.join("-")) || slugify(deal.id) || `deal-${used.size + 1}`;
  let candidate = base;
  let i = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  used.add(candidate);
  return candidate;
}

export const getDealPageIndex = cache(async (): Promise<DealPageRecord[]> => {
  const deals = await getMasterDeals();
  const sorted = [...deals].sort(
    (a, b) =>
      (b.deal_year ?? 0) - (a.deal_year ?? 0) ||
      b.total_deal_size_usd - a.total_deal_size_usd ||
      String(a.deal_name ?? "").localeCompare(String(b.deal_name ?? ""))
  );

  const used = new Set<string>();
  return sorted.map((deal) => ({
    slug: buildDealSlug(deal, used),
    deal
  }));
});

export const getDealBySlug = cache(async (slug: string): Promise<MasterDealRecord | null> => {
  const index = await getDealPageIndex();
  return index.find((entry) => entry.slug === slug)?.deal ?? null;
});

export const getDealSlugById = cache(async (dealId: string | null | undefined): Promise<string | null> => {
  if (!dealId) return null;
  const index = await getDealPageIndex();
  const found = index.find((entry) => entry.deal.deal_id === dealId || entry.deal.id === dealId);
  return found?.slug ?? null;
});
