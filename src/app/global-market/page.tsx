import type { Metadata } from "next";

import { GlobalMarketDashboard } from "@/components/explorer/global-market-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import {
  getExpectedLossDistributionData,
  getGlobalKpisData,
  getHeatmapYearPerilData,
  getHeatmapYearTriggerData,
  getIssuanceByYearData,
  getPerilDistributionData,
  getSovereignVsPrivateData,
  getSpreadDistributionData,
  getSpreadVsExpectedLossData,
  getTopBookrunnersData,
  getTopBrokersData,
  getTopCountriesData,
  getTopPlacementAgentsData,
  getTopSponsorsData,
  getTopSovereignCountriesData,
  getTriggerDistributionData,
  getTriggeredLossSummaryData
} from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Global Market Dashboard | Global Sovereign Catastrophe Bond Explorer"
};

export default async function GlobalMarketPage() {
  const [
    globalKpis,
    issuanceByYear,
    sovereignVsPrivate,
    perilDistribution,
    triggerDistribution,
    spreadVsExpectedLoss,
    expectedLossDistribution,
    spreadDistribution,
    topCountries,
    topSponsors,
    topSovereignCountries,
    topBrokers,
    topBookrunners,
    topPlacementAgents,
    heatmapYearPeril,
    heatmapYearTrigger,
    triggeredLossSummary
  ] = await Promise.all([
    getGlobalKpisData(),
    getIssuanceByYearData(),
    getSovereignVsPrivateData(),
    getPerilDistributionData(),
    getTriggerDistributionData(),
    getSpreadVsExpectedLossData(),
    getExpectedLossDistributionData(),
    getSpreadDistributionData(),
    getTopCountriesData(),
    getTopSponsorsData(),
    getTopSovereignCountriesData(),
    getTopBrokersData(),
    getTopBookrunnersData(),
    getTopPlacementAgentsData(),
    getHeatmapYearPerilData(),
    getHeatmapYearTriggerData(),
    getTriggeredLossSummaryData()
  ]);

  return (
    <>
      <PageHeader
        title="Global Market Dashboard"
        subtitle="Macro issuance trends, sponsor rankings, market structure analytics — catastrophe bond market overview"
      />
      <GlobalMarketDashboard
      kpis={{
        totalDeals: globalKpis.total_deals,
        totalVolumeUsd: globalKpis.cumulative_issuance_usd,
        sovereignDeals: globalKpis.sovereign_deal_count,
        nonSovereignDeals: globalKpis.non_sovereign_deal_count,
        countriesCovered: globalKpis.countries_covered,
        latestMarketYear: globalKpis.latest_market_year,
        outstandingMarketSizeNote: globalKpis.outstanding_market_size_note
      }}
      issuanceByYear={issuanceByYear}
      sovereignVsPrivate={sovereignVsPrivate}
      perilDistribution={perilDistribution}
      triggerDistribution={triggerDistribution}
      spreadVsExpectedLoss={spreadVsExpectedLoss}
      expectedLossDistribution={expectedLossDistribution}
      spreadDistribution={spreadDistribution}
      topCountries={topCountries}
      topSponsors={topSponsors}
      topSovereignCountries={topSovereignCountries}
      topBrokers={topBrokers}
      topBookrunners={topBookrunners}
      topPlacementAgents={topPlacementAgents}
      heatmapYearPeril={heatmapYearPeril}
      heatmapYearTrigger={heatmapYearTrigger}
      triggeredLossSummary={triggeredLossSummary}
    />
    </>
  );
}
