"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { HomeGlobeExplorer } from "@/components/home/home-globe-explorer";
import type {
  SeismicCountryCard,
  SeismicCoverageSummary,
  SeismicGlobePoint,
  SeismicYearIssuance
} from "@/lib/market-data";
import { formatCurrency } from "@/lib/utils";

type Filter = "all" | "issued" | "not_issued" | "sovereign_issued";

interface SeismicCountriesDashboardProps {
  cards: SeismicCountryCard[];
  coverage: SeismicCoverageSummary;
  globePoints: SeismicGlobePoint[];
  issuanceByYear: SeismicYearIssuance[];
  triggerDistribution: Array<{ key: string; deal_count: number; total_volume_usd: number; total_volume_musd: number }>;
  perilDistribution: Array<{ key: string; deal_count: number; total_volume_usd: number; total_volume_musd: number }>;
}

export function SeismicCountriesDashboard({
  cards,
  coverage,
  globePoints,
  issuanceByYear,
  triggerDistribution,
  perilDistribution
}: SeismicCountriesDashboardProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredCards = useMemo(() => {
    if (filter === "issued") return cards.filter((c) => c.has_any_cat_bond);
    if (filter === "not_issued") return cards.filter((c) => !c.has_any_cat_bond);
    if (filter === "sovereign_issued") return cards.filter((c) => c.has_sovereign_or_public_cat_bond);
    return cards;
  }, [cards, filter]);

  const filteredGlobePoints = useMemo(() => {
    if (filter === "issued") return globePoints.filter((p) => p.has_any_cat_bond);
    if (filter === "not_issued") return globePoints.filter((p) => !p.has_any_cat_bond);
    if (filter === "sovereign_issued") return globePoints.filter((p) => p.has_sovereign_or_public_cat_bond);
    return globePoints;
  }, [filter, globePoints]);

  const statusChartData = [
    { name: "Issued", value: coverage.issued_countries },
    { name: "Not Issued", value: coverage.non_issued_countries },
    { name: "Sovereign Issuers", value: coverage.sovereign_issuing_countries }
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Sovereign & Policy</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">High Seismic Risk Countries</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Seismic-risk sovereign intelligence layer showing catastrophe bond issuance presence, gaps, and market-relevant
          structure signals.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="High-Risk Countries" value={coverage.total_high_risk_countries.toLocaleString("en-US")} />
        <MetricCard label="Issued Countries" value={coverage.issued_countries.toLocaleString("en-US")} />
        <MetricCard label="Non-Issuing Countries" value={coverage.non_issued_countries.toLocaleString("en-US")} />
        <MetricCard
          label="Sovereign Issuers"
          value={coverage.sovereign_issuing_countries.toLocaleString("en-US")}
        />
      </section>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap gap-2">
          <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterButton label="Issued" active={filter === "issued"} onClick={() => setFilter("issued")} />
          <FilterButton label="Not Issued" active={filter === "not_issued"} onClick={() => setFilter("not_issued")} />
          <FilterButton
            label="Sovereign Issued"
            active={filter === "sovereign_issued"}
            onClick={() => setFilter("sovereign_issued")}
          />
        </div>

        <div className="mt-4 h-[68vh] min-h-[540px]">
          <HomeGlobeExplorer points={filteredGlobePoints as any} activeView="all" className="h-full w-full rounded-xl" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Issuance Status</h2>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ left: -16, right: 8, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="rgba(34,211,238,0.8)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Seismic Issuance by Year</h2>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuanceByYear} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(v) => `${(Number(v) / 1_000_000_000).toFixed(1)}B`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatCurrency(value), "Issuance Volume"]}
                />
                <Bar dataKey="issuance_volume_usd" fill="rgba(59,130,246,0.8)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DistributionTable title="Trigger Distribution" rows={triggerDistribution} />
        <DistributionTable title="Peril Distribution" rows={perilDistribution} />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Country Cards</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card) => (
            <article key={card.id} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">{card.issuance_status}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{card.country_name}</h3>
              <div className="mt-3 space-y-1 text-sm text-slate-300">
                <p>Issuance Count: {card.issuance_count.toLocaleString("en-US")}</p>
                <p>Total Volume: {formatCurrency(card.total_volume_usd)}</p>
                <p>Main Perils: {card.main_perils.join(", ") || "Not stated"}</p>
                <p>Main Triggers: {card.main_trigger_types.join(", ") || "Not stated"}</p>
              </div>
              <p className="mt-3 text-sm text-slate-300">{card.insight}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={card.destination_url} className="btn-secondary">
                  Open Country Page
                </Link>
                <span className="chip">{card.data_status ?? "derived_from_source"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-cyan-100">{value}</p>
    </article>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "btn-hero-secondary border-cyan-300/80 bg-cyan-500/20 text-cyan-100"
          : "btn-hero-secondary"
      }
    >
      {label}
    </button>
  );
}

function DistributionTable({
  title,
  rows
}: {
  title: string;
  rows: Array<{ key: string; deal_count: number; total_volume_usd: number; total_volume_musd: number }>;
}) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Deals</th>
              <th className="px-2 py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.key}`} className="border-b border-white/5 text-slate-100/90">
                <td className="px-2 py-2">{row.key}</td>
                <td className="px-2 py-2 text-slate-300">{row.deal_count.toLocaleString("en-US")}</td>
                <td className="px-2 py-2 text-slate-300">{formatCurrency(row.total_volume_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.2)",
  background: "rgba(2,6,23,0.95)",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "10px 12px"
};
