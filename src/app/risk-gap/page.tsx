import type { Metadata } from "next";

import { RiskGapDashboard } from "@/components/explorer/risk-gap-dashboard";
import { getRiskGapSummaryData } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Risk Gap Module | Global Catastrophe Bond Intelligence Platform"
};

export default async function RiskGapPage() {
  const data = await getRiskGapSummaryData();
  return <RiskGapDashboard rows={data.rows} />;
}
