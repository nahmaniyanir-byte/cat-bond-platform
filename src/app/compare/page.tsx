import type { Metadata } from "next";

import { CountryComparison } from "@/components/explorer/country-comparison";
import { getCountryPageIndex } from "@/lib/country-pages";

export const metadata: Metadata = {
  title: "Compare Countries | Global Sovereign Catastrophe Bond Explorer"
};

export default async function ComparePage() {
  const countries = (await getCountryPageIndex()).map((entry) => ({
    name: entry.country_name,
    slug: entry.slug,
    region: entry.region,
    modelType: entry.model_types[0] ?? entry.market_segment_summary,
    peril: [entry.main_peril],
    trigger: entry.trigger_types[0] ?? "Not stated",
    year: entry.latest_issue_year ?? 0,
    amountUSD: entry.total_volume_usd,
    latitude: 0,
    longitude: 0
  }));

  return <CountryComparison countries={countries} />;
}
