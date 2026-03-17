import type { Metadata } from "next";
import Link from "next/link";

import { getCountryPageIndex } from "@/lib/country-pages";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Country Intelligence | Global Catastrophe Bond Intelligence Platform"
};

export default async function CountriesPage() {
  const countries = await getCountryPageIndex();

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Sovereign & Policy</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Country Intelligence Cases</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Dynamic country pages generated from the SQL-ready catastrophe bond datasets.
        </p>
      </section>

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
