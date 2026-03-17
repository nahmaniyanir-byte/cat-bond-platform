import type { Metadata } from "next";

import { GlobalMapPanel } from "@/components/explorer/global-map-panel";
import { getCountryGlobePoints } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Global Map | Global Catastrophe Bond Intelligence Platform"
};

export default async function GlobalMapPage() {
  const points = await getCountryGlobePoints();
  return <GlobalMapPanel points={points} />;
}
