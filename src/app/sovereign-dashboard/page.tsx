import type { Metadata } from "next";

import { SovereignDashboard } from "@/components/explorer/sovereign-dashboard";
import { getMasterDeals } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Sovereign Dashboard | Global Catastrophe Bond Intelligence Platform"
};

export default async function SovereignDashboardPage() {
  const sovereignDeals = (await getMasterDeals()).filter((deal) => deal.sovereign_flag);

  const issuanceByYearMap = new Map<number, { year: number; deal_count: number; total_volume_usd: number }>();
  const perilMap = new Map<string, { name: string; deal_count: number; total_volume_usd: number }>();
  const triggerMap = new Map<string, { name: string; deal_count: number; total_volume_usd: number }>();
  const sponsorMap = new Map<string, { name: string; deal_count: number; total_volume_usd: number }>();
  const countryMap = new Map<string, { name: string; deal_count: number; total_volume_usd: number }>();

  let totalExpectedLoss = 0;
  let expectedLossCount = 0;
  let totalSpread = 0;
  let spreadCount = 0;
  let latestYear: number | null = null;
  let totalVolume = 0;

  for (const deal of sovereignDeals) {
    const year = deal.deal_year;
    const peril = deal.peril_type ?? deal.peril_tags[0] ?? "Not stated";
    const trigger = deal.trigger_type_normalized ?? "Not stated";
    const sponsor = deal.sponsor_name ?? "Unknown Sponsor";
    const country = deal.country_name ?? "Unknown Country";
    const volume = deal.total_deal_size_usd;
    totalVolume += volume;

    if (year != null) {
      latestYear = latestYear == null ? year : Math.max(latestYear, year);
      const row = issuanceByYearMap.get(year) ?? { year, deal_count: 0, total_volume_usd: 0 };
      row.deal_count += 1;
      row.total_volume_usd += volume;
      issuanceByYearMap.set(year, row);
    }

    accumulate(perilMap, peril, volume);
    accumulate(triggerMap, trigger, volume);
    accumulate(sponsorMap, sponsor, volume);
    accumulate(countryMap, country, volume);

    if (typeof deal.average_expected_loss_percent === "number") {
      totalExpectedLoss += deal.average_expected_loss_percent;
      expectedLossCount += 1;
    }
    if (typeof deal.average_final_spread_bps === "number") {
      totalSpread += deal.average_final_spread_bps;
      spreadCount += 1;
    }
  }

  return (
    <SovereignDashboard
      kpis={{
        dealCount: sovereignDeals.length,
        totalVolumeUsd: totalVolume,
        countries: countryMap.size,
        avgExpectedLoss: expectedLossCount ? totalExpectedLoss / expectedLossCount : null,
        avgSpreadBps: spreadCount ? totalSpread / spreadCount : null,
        latestYear
      }}
      issuanceByYear={[...issuanceByYearMap.values()].sort((a, b) => a.year - b.year)}
      perilMix={sortRows(perilMap)}
      triggerMix={sortRows(triggerMap)}
      topSponsors={sortRows(sponsorMap)}
      topCountries={sortRows(countryMap)}
    />
  );
}

function accumulate(
  map: Map<string, { name: string; deal_count: number; total_volume_usd: number }>,
  key: string,
  volume: number
) {
  const row = map.get(key) ?? { name: key, deal_count: 0, total_volume_usd: 0 };
  row.deal_count += 1;
  row.total_volume_usd += volume;
  map.set(key, row);
}

function sortRows(map: Map<string, { name: string; deal_count: number; total_volume_usd: number }>) {
  return [...map.values()].sort((a, b) => b.total_volume_usd - a.total_volume_usd || b.deal_count - a.deal_count);
}
