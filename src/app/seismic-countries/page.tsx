import type { Metadata } from "next";

import { SeismicCountriesDashboard } from "@/components/explorer/seismic-countries-dashboard";
import {
  getSeismicCountryCardsData,
  getSeismicCoverageData,
  getSeismicGlobePointsData,
  getSeismicIssuanceByYearData,
  getSeismicPerilDistributionData,
  getSeismicTriggerDistributionData
} from "@/lib/market-data";

export const metadata: Metadata = {
  title: "High Seismic Risk Countries | Global Catastrophe Bond Intelligence Platform"
};

export default async function SeismicCountriesPage() {
  const [cardsData, coverage, globePoints, issuanceByYear, triggerDistribution, perilDistribution] =
    await Promise.all([
      getSeismicCountryCardsData(),
      getSeismicCoverageData(),
      getSeismicGlobePointsData(),
      getSeismicIssuanceByYearData(),
      getSeismicTriggerDistributionData(),
      getSeismicPerilDistributionData()
    ]);

  return (
    <SeismicCountriesDashboard
      cards={cardsData.cards}
      coverage={coverage}
      globePoints={globePoints}
      issuanceByYear={issuanceByYear}
      triggerDistribution={triggerDistribution}
      perilDistribution={perilDistribution}
    />
  );
}
