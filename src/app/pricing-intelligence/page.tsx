import type { Metadata } from "next";

import { PricingIntelligenceDashboard } from "@/components/explorer/pricing-intelligence-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import {
  getExpectedLossDistributionData,
  getPricingIntelligenceData,
  getSpreadDistributionData,
  getSpreadVsExpectedLossData
} from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Pricing Intelligence | Global Catastrophe Bond Intelligence Platform"
};

export default async function PricingIntelligencePage() {
  const [spreadVsExpectedLoss, expectedLossDistribution, spreadDistribution, pricing] = await Promise.all([
    getSpreadVsExpectedLossData(),
    getExpectedLossDistributionData(),
    getSpreadDistributionData(),
    getPricingIntelligenceData()
  ]);

  return (
    <>
      <PageHeader
        title="Pricing Intelligence"
        subtitle="Spread vs. expected loss diagnostics, risk multiple analysis, and pricing benchmarks across peril and trigger segments"
      />
      <PricingIntelligenceDashboard
      spreadVsExpectedLoss={spreadVsExpectedLoss}
      expectedLossDistribution={expectedLossDistribution}
      spreadDistribution={spreadDistribution}
      pricingByPeril={pricing.pricing_by_peril}
      pricingByTrigger={pricing.pricing_by_trigger}
      segmentPricing={pricing.segment_pricing}
    />
    </>
  );
}
