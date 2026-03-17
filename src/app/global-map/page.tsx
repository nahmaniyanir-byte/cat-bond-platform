import type { Metadata } from "next";

import { GlobalIntelligenceMap } from "@/components/explorer/global-intelligence-map";
import { getCountryGlobePoints } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Global Map | Global Catastrophe Bond Intelligence Platform"
};

export default async function GlobalMapPage() {
  const points = await getCountryGlobePoints();
  return <GlobalIntelligenceMap points={points} />;
}
