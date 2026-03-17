import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Policy Overview | Global Catastrophe Bond Intelligence Platform"
};

const SOVEREIGN_BENCHMARKS = [
  {
    country: "Mexico",
    bond: "FONDEN / MultiCat",
    year: 2006,
    size_usd: 485,
    trigger: "Parametric (CENAPRED seismic index)",
    peril: "Earthquake + Hurricane",
    notes: "First sovereign multi-peril cat bond. Renewed multiple times."
  },
  {
    country: "Turkey",
    bond: "TCIP / ILS Program",
    year: 2013,
    size_usd: 400,
    trigger: "Parametric (AFAD intensity grid)",
    peril: "Earthquake",
    notes: "Post-1999 Marmara quake institutional reform. World Bank supported."
  },
  {
    country: "Philippines",
    bond: "IBRD / DRFI Program",
    year: 2019,
    size_usd: 225,
    trigger: "Parametric (wind speed + earthquake PGA)",
    peril: "Typhoon + Earthquake",
    notes: "IBRD intermediated. Extended in 2021 and 2023."
  },
  {
    country: "Japan",
    bond: "JEA / Multiple",
    year: 1999,
    size_usd: 1200,
    trigger: "Parametric (JMA seismic scale)",
    peril: "Earthquake",
    notes: "Largest sovereign seismic issuance market globally."
  },
  {
    country: "Chile",
    bond: "Ministry of Finance",
    year: 2022,
    size_usd: 630,
    trigger: "Parametric (USGS ShakeMap)",
    peril: "Earthquake",
    notes: "Benchmark pricing: EL ~1.8%, spread ~4.2%, risk multiple 2.3x."
  }
];

const ISRAEL_CASE = {
  modeled_aal_usd: 2100,
  gdp_usd_bn: 522,
  aal_pct_gdp: 0.40,
  proposed_size: "300–500",
  trigger: "Parametric (GSI PGA grid)",
  peril: "Seismic (Dead Sea Transform fault)",
  estimated_el_pct: "1.2–2.0",
  estimated_spread_pct: "3.0–5.5",
  estimated_risk_multiple: "2.2–3.1",
  tenor_years: 3,
  comparable: "Chile 2022, Turkey 2013"
};

export default function PolicyOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Overview"
        subtitle="Sovereign catastrophe risk financing — benchmarks, case comparisons, and Israel structuring context"
        showSource={false}
      />

      {/* Israel summary card */}
      <section className="glass-panel p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Israel Sovereign Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Parametric Earthquake Bond — Indicative Terms</h2>
        <p className="mt-2 text-sm text-slate-300">
          Based on global sovereign benchmarks and Dead Sea Transform fault seismic hazard modelling.
          All figures are illustrative and intended for policy planning purposes.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Modeled AAL", value: `$${(ISRAEL_CASE.modeled_aal_usd / 1000).toFixed(1)}B/yr`, sub: `${ISRAEL_CASE.aal_pct_gdp}% of GDP` },
            { label: "Proposed Size", value: `$${ISRAEL_CASE.proposed_size}M`, sub: "Notional issuance" },
            { label: "Est. Expected Loss", value: `${ISRAEL_CASE.estimated_el_pct}%`, sub: "Annual probability" },
            { label: "Est. Spread", value: `${ISRAEL_CASE.estimated_spread_pct}%`, sub: `Risk multiple ${ISRAEL_CASE.estimated_risk_multiple}x` }
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <p><span className="text-slate-400">Trigger:</span> {ISRAEL_CASE.trigger}</p>
          <p><span className="text-slate-400">Peril:</span> {ISRAEL_CASE.peril}</p>
          <p><span className="text-slate-400">Tenor:</span> {ISRAEL_CASE.tenor_years} years</p>
          <p><span className="text-slate-400">Comparable Transactions:</span> {ISRAEL_CASE.comparable}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/israel-lab" className="btn-hero-primary">Open Israel Lab</Link>
          <Link href="/calculator" className="btn-hero-secondary">Run Pricing Simulation</Link>
        </div>
      </section>

      {/* Sovereign benchmark table */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-semibold text-white">Sovereign Benchmark Transactions</h2>
        <p className="mt-1 text-sm text-slate-300">Selected comparable sovereign catastrophe bond issuances</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.1em] text-slate-400">
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">Year</th>
                <th className="pb-3 pr-4">Size (USD M)</th>
                <th className="pb-3 pr-4">Trigger</th>
                <th className="pb-3 pr-4">Peril</th>
                <th className="pb-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {SOVEREIGN_BENCHMARKS.map((row) => (
                <tr key={row.country} className="text-slate-300 hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-medium text-white">{row.country}</td>
                  <td className="py-3 pr-4">{row.year}</td>
                  <td className="py-3 pr-4 text-cyan-300">${row.size_usd}M</td>
                  <td className="py-3 pr-4">{row.trigger}</td>
                  <td className="py-3 pr-4">{row.peril}</td>
                  <td className="py-3 text-xs text-slate-400">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rationale cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">Parametric vs. Indemnity</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Sovereign issuers overwhelmingly prefer parametric triggers (PGA, wind speed, storm surge index)
            over indemnity structures. Parametric instruments pay out within 30–90 days of event confirmation,
            eliminating loss adjustment delays critical for post-disaster liquidity.
          </p>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">World Bank / IBRD Role</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Most sovereign first-time issuers enter the cat bond market via IBRD or a multilateral
            intermediary. This reduces transaction costs, provides technical assistance, and gives
            investors a familiar credit wrapper around the sovereign risk.
          </p>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">Risk Multiple Context</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Current market risk multiples for seismic sovereign risk range from 2.0x to 3.5x EL.
            Israel&apos;s profile (moderate EL ~1.5%, high institutional credibility) would likely
            price in the 2.2–2.8x range — competitive with Chile and Turkey comparables.
          </p>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">Fiscal Resilience Signal</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            S&amp;P and Moody&apos;s explicitly factor disaster risk management frameworks into sovereign
            credit assessments. A parametric cat bond signals proactive fiscal resilience — potentially
            supporting credit outlook at a time of elevated geopolitical risk premium.
          </p>
        </div>
      </section>
    </div>
  );
}
