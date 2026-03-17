import type { Metadata } from "next";

import { SovereignDashboard } from "@/components/explorer/sovereign-dashboard";
import { getSovereignDashboardData } from "@/lib/market-data";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Sovereign Dashboard | Global Catastrophe Bond Intelligence Platform"
};

export default async function SovereignDashboardPage() {
  const data = await getSovereignDashboardData();
  return (
    <>
      <PageHeader
        title="Sovereign Dashboard"
        subtitle="Government-backed and sovereign-linked catastrophe bond issuance — structure, peril, and sponsor analytics"
      />
      <SovereignDashboard
      kpis={data.kpis}
      issuanceByYear={data.issuanceByYear}
      perilMix={data.perilMix}
      triggerMix={data.triggerMix}
      topSponsors={data.topSponsors}
      topCountries={data.topCountries}
    />
    </>
  );
}
