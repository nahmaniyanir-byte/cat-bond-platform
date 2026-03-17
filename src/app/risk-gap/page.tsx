import type { Metadata } from "next";

import { RiskGapDashboard } from "@/components/explorer/risk-gap-dashboard";
import { getCountryPageIndex } from "@/lib/country-pages";

export const metadata: Metadata = {
  title: "Risk Gap Module | Global Catastrophe Bond Intelligence Platform"
};

export default async function RiskGapPage() {
  const countries = await getCountryPageIndex();
  const currentYear = new Date().getUTCFullYear();

  const rows = countries
    .map((country) => {
      const recencyPenalty =
        country.latest_issue_year == null ? 5 : Math.max(0, Math.min(5, (currentYear - country.latest_issue_year) / 2));
      const depthFactor = country.deal_count > 0 ? 4 / Math.sqrt(country.deal_count) : 5;
      const sovereignPenalty = country.sovereign_flag ? 0 : 1.25;
      const gapScore = Math.max(0, Math.min(10, recencyPenalty + depthFactor + sovereignPenalty));
      const gap_label: "Low Gap" | "Moderate Gap" | "High Gap" =
        gapScore >= 6.8 ? "High Gap" : gapScore >= 4.4 ? "Moderate Gap" : "Low Gap";

      return {
        country_name: country.country_name,
        slug: country.slug,
        region: country.region,
        deal_count: country.deal_count,
        total_volume_usd: country.total_volume_usd,
        latest_issue_year: country.latest_issue_year,
        sovereign_flag: country.sovereign_flag,
        gap_label,
        gap_score: gapScore,
        rationale:
          gap_label === "High Gap"
            ? "Limited issuance depth and/or low recency."
            : gap_label === "Moderate Gap"
              ? "Partial coverage footprint with room for market deepening."
              : "Established footprint and relatively recent market access."
      };
    })
    .sort((a, b) => b.gap_score - a.gap_score || b.total_volume_usd - a.total_volume_usd);

  return <RiskGapDashboard rows={rows} />;
}
