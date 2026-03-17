import type { Metadata } from "next";

import { CountriesBrowser } from "@/components/explorer/countries-browser";
import { getCountryPageIndex } from "@/lib/country-pages";

export const metadata: Metadata = {
  title: "Countries | Global Sovereign Catastrophe Bond Explorer"
};

export default async function CountriesPage() {
  const countries = (await getCountryPageIndex()).map((entry) => ({
    name: entry.country_name,
    slug: entry.slug,
    region: entry.region,
    modelType: entry.model_types[0] ?? entry.market_segment_summary,
    summary: entry.summary,
    peril: [entry.main_peril],
    trigger: entry.trigger_types[0] ?? "Not stated",
    year: entry.latest_issue_year ?? 0,
    amountUSD: entry.total_volume_usd,
    dealCount: entry.deal_count,
    sovereignFlag: entry.sovereign_flag
  }));

  return <CountriesBrowser countries={countries} />;
}
