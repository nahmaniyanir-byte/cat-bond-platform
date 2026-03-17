import type { Metadata } from "next";

import { PricingIntelligenceDashboard } from "@/components/explorer/pricing-intelligence-dashboard";
import {
  getExpectedLossDistributionData,
  getMasterDeals,
  getSpreadDistributionData,
  getSpreadVsExpectedLossData
} from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Pricing Intelligence | Global Catastrophe Bond Intelligence Platform"
};

export default async function PricingIntelligencePage() {
  const [deals, spreadVsExpectedLoss, expectedLossDistribution, spreadDistribution] = await Promise.all([
    getMasterDeals(),
    getSpreadVsExpectedLossData(),
    getExpectedLossDistributionData(),
    getSpreadDistributionData()
  ]);

  const pricingByPeril = aggregatePricing(
    deals
      .filter((deal) => typeof deal.average_final_spread_bps === "number")
      .map((deal) => ({
        key: deal.peril_type ?? deal.peril_tags[0] ?? "Not stated",
        spread: deal.average_final_spread_bps ?? 0,
        expectedLoss: deal.average_expected_loss_percent ?? 0
      }))
  ).map((row) => ({ peril: row.key, ...row }));

  const pricingByTrigger = aggregatePricing(
    deals
      .filter((deal) => typeof deal.average_final_spread_bps === "number")
      .map((deal) => ({
        key: deal.trigger_type_normalized ?? "Not stated",
        spread: deal.average_final_spread_bps ?? 0,
        expectedLoss: deal.average_expected_loss_percent ?? 0
      }))
  ).map((row) => ({ trigger: row.key, ...row }));

  const segmentPricing = aggregatePricing(
    deals
      .filter((deal) => typeof deal.average_final_spread_bps === "number")
      .map((deal) => ({
        key: deal.sovereign_flag ? "Sovereign" : "Non-Sovereign",
        spread: deal.average_final_spread_bps ?? 0,
        expectedLoss: deal.average_expected_loss_percent ?? 0
      }))
  ).map((row) => ({
    segment: row.key,
    avg_spread_bps: row.avg_spread_bps,
    avg_expected_loss_percent: row.avg_expected_loss_percent,
    count: row.count
  }));

  return (
    <PricingIntelligenceDashboard
      spreadVsExpectedLoss={spreadVsExpectedLoss}
      expectedLossDistribution={expectedLossDistribution}
      spreadDistribution={spreadDistribution}
      pricingByPeril={pricingByPeril}
      pricingByTrigger={pricingByTrigger}
      segmentPricing={segmentPricing}
    />
  );
}

function aggregatePricing(
  rows: Array<{
    key: string;
    spread: number;
    expectedLoss: number;
  }>
) {
  const map = new Map<
    string,
    { key: string; count: number; spreadSum: number; expectedLossSum: number; avg_spread_bps: number; avg_expected_loss_percent: number }
  >();

  for (const row of rows) {
    const bucket = map.get(row.key) ?? {
      key: row.key,
      count: 0,
      spreadSum: 0,
      expectedLossSum: 0,
      avg_spread_bps: 0,
      avg_expected_loss_percent: 0
    };
    bucket.count += 1;
    bucket.spreadSum += row.spread;
    bucket.expectedLossSum += row.expectedLoss;
    map.set(row.key, bucket);
  }

  return [...map.values()]
    .map((bucket) => ({
      key: bucket.key,
      count: bucket.count,
      avg_spread_bps: bucket.spreadSum / bucket.count,
      avg_expected_loss_percent: bucket.expectedLossSum / bucket.count
    }))
    .sort((a, b) => b.count - a.count);
}
