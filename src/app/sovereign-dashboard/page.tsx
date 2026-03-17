import type { Metadata } from "next";

import { SovereignDashboard } from "@/components/explorer/sovereign-dashboard";
import { getSovereignDashboardData } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Sovereign Dashboard | Global Catastrophe Bond Intelligence Platform"
};

export default async function SovereignDashboardPage() {
  const data = await getSovereignDashboardData();
  return (
    <SovereignDashboard
      kpis={data.kpis}
      issuanceByYear={data.issuanceByYear}
      perilMix={data.perilMix}
      triggerMix={data.triggerMix}
      topSponsors={data.topSponsors}
      topCountries={data.topCountries}
    />
  );
}
