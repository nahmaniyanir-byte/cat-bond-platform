import type { Metadata } from "next";

import { MarketAnalyticsPanel } from "@/components/explorer/market-analytics-panel";
import { TransactionDatabase } from "@/components/explorer/transaction-database";
import {
  getIssuanceByYearData,
  getMasterDeals,
  getPerilDistributionData,
  getSovereignVsPrivateData
} from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Global Transaction Database | Global Sovereign Catastrophe Bond Explorer"
};

export default async function DatabasePage() {
  const [deals, issuanceByYear, perilDistribution, sovereignVsPrivate] = await Promise.all([
    getMasterDeals(),
    getIssuanceByYearData(),
    getPerilDistributionData(),
    getSovereignVsPrivateData()
  ]);

  return (
    <div className="space-y-5">
      <MarketAnalyticsPanel
        issuanceByYear={issuanceByYear}
        perilDistribution={perilDistribution}
        sovereignVsPrivate={sovereignVsPrivate}
      />
      <TransactionDatabase deals={deals} />
    </div>
  );
}
