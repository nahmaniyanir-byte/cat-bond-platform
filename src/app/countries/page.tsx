import type { Metadata } from "next";
import Link from "next/link";

import { getCountryPageIndex } from "@/lib/country-pages";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Country Intelligence | Global Catastrophe Bond Intelligence Platform"
};

export default async function CountriesPage() {
  const countries = await getCountryPageIndex();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Country Intelligence Cases"
        subtitle="Country-level issuance history, deal tables, and sovereign risk financing profiles"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {countries.map((country) => (
          <article key={country.slug} className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{country.region}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{country.country_name}</h2>
            <p className="mt-2 text-sm text-slate-300">{country.main_peril}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Deals: {country.deal_count.toLocaleString("en-US")}</p>
              <p>Issuance: {formatCurrency(country.total_volume_usd)}</p>
              <p>Latest Year: {country.latest_issue_year ?? "N/A"}</p>
              <p>Segment: {country.market_segment_summary}</p>
            </div>
            <Link href={`/countries/${country.slug}`} className="btn-hero-primary mt-4 inline-flex">
              View Case
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
