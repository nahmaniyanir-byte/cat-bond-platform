import type { Metadata } from "next";

import { getCountryPageIndex } from "@/lib/country-pages";
import { getIssuanceByYearData } from "@/lib/market-data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Issuance Timeline | Global Sovereign Catastrophe Bond Explorer"
};

export default async function TimelinePage() {
  const [issuanceByYear, countryIndex] = await Promise.all([getIssuanceByYearData(), getCountryPageIndex()]);
  const timeline = issuanceByYear
    .filter((entry) => entry.year > 0 && (!entry.segment_key || entry.segment_key === "all"))
    .sort((a, b) => a.year - b.year);
  const sovereignMilestones = countryIndex
    .filter((entry) => entry.sovereign_flag && entry.latest_issue_year)
    .sort((a, b) => (a.latest_issue_year ?? 0) - (b.latest_issue_year ?? 0));

  return (
    <div className="space-y-6">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Issuance Timeline</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sovereign Catastrophe Bond Timeline</h1>
        <p className="mt-2 text-sm text-slate-300">
          Visual chronology of sovereign catastrophe bond transactions and policy-relevant milestones.
        </p>
      </section>

      <section className="glass-panel overflow-x-auto p-5">
        <div className="min-w-[980px]">
          <div className="relative h-1 rounded bg-slate-700/40">
            <div className="absolute inset-0 rounded bg-gradient-to-r from-cyan-400/60 via-blue-400/40 to-cyan-300/60" />
          </div>
          <div className="mt-6 grid grid-cols-5 gap-4">
            {timeline.map((entry) => (
              <article key={entry.year} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{entry.year}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{entry.deal_count.toLocaleString("en-US")} Deals</h2>
                <p className="mt-1 text-xs text-slate-400">Global issuance represented in master CSV</p>
                <p className="mt-2 text-sm text-slate-300">Aggregate annual catastrophe bond activity</p>
                <p className="mt-2 text-sm font-medium text-slate-100">{formatCurrency(entry.total_volume_usd)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Sovereign Milestones by Country</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sovereignMilestones.map((entry) => (
            <article key={entry.slug} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{entry.latest_issue_year}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{entry.country_name}</h3>
              <p className="mt-1 text-sm text-slate-300">{entry.main_peril}</p>
              <p className="mt-2 text-sm text-slate-100">{formatCurrency(entry.total_volume_usd)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
