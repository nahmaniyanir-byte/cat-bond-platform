"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartExplainer } from "@/components/ui/chart-explainer";

interface BreakdownRow {
  name: string;
  deal_count: number;
  total_volume_usd: number;
}

interface SovereignDashboardProps {
  kpis: {
    dealCount: number;
    totalVolumeUsd: number;
    countries: number;
    avgExpectedLoss: number | null;
    avgSpreadBps: number | null;
    latestYear: number | null;
  };
  issuanceByYear: Array<{ year: number; deal_count: number; total_volume_usd: number }>;
  perilMix: BreakdownRow[];
  triggerMix: BreakdownRow[];
  topSponsors: BreakdownRow[];
  topCountries: BreakdownRow[];
}

export function SovereignDashboard({
  kpis,
  issuanceByYear,
  perilMix,
  triggerMix,
  topSponsors,
  topCountries
}: SovereignDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Sovereign & Policy</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Sovereign Disaster Risk Dashboard</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Sovereign-only catastrophe bond intelligence on issuance growth, pricing signals, trigger architecture, peril
          concentration, and leading sovereign sponsors.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          label="Sovereign Deals"
          value={kpis.dealCount.toLocaleString("en-US")}
          definition="Deals classified as sovereign in the master dataset."
          interpretation="Primary sovereign catastrophe bond transaction count."
          dataType="derived"
        />
        <KpiCard
          label="Sovereign Issuance"
          value={formatCurrency(kpis.totalVolumeUsd)}
          definition="Sum of deal_size_usd for sovereign deals only."
          interpretation="Historical sovereign cumulative issuance."
          dataType="historical"
        />
        <KpiCard
          label="Countries"
          value={kpis.countries.toLocaleString("en-US")}
          definition="Distinct sovereign sponsor countries represented."
          interpretation="Geographic spread of sovereign market activity."
          dataType="derived"
        />
        <KpiCard
          label="Avg Expected Loss"
          value={kpis.avgExpectedLoss == null ? "N/A" : `${kpis.avgExpectedLoss.toFixed(3)}%`}
          definition="Average expected loss for sovereign deals where value is available."
          interpretation="Indicative modeled risk level of sovereign transactions."
          dataType="derived"
        />
        <KpiCard
          label="Avg Spread (bps)"
          value={kpis.avgSpreadBps == null ? "N/A" : String(Math.round(kpis.avgSpreadBps))}
          definition="Average spread for sovereign deals with spread data."
          interpretation="Indicative sovereign catastrophe bond pricing level."
          dataType="derived"
        />
        <KpiCard
          label="Latest Sovereign Year"
          value={String(kpis.latestYear ?? "N/A")}
          definition="Maximum issue_year among sovereign deals."
          interpretation="Recency of sovereign issuance in dataset coverage."
          dataType="historical"
        />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Sovereign Issuance by Year</h2>
        <div className="mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={issuanceByYear} margin={{ left: -18, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => formatShort(value)}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
              <Bar dataKey="total_volume_usd" fill="rgba(56,189,248,0.82)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartExplainer
          what="Yearly sovereign issuance trend based on deal-level sovereign transactions."
          why="Supports policy timing analysis and sovereign market development tracking."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Sovereign Peril Mix" data={perilMix} color="rgba(52,211,153,0.85)" />
        <ChartCard title="Sovereign Trigger Mix" data={triggerMix} color="rgba(96,165,250,0.85)" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <RankingTable title="Top Sovereign Sponsors" rows={topSponsors} />
        <RankingTable title="Top Sovereign Countries" rows={topCountries} />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Policy Implications</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Sovereign issuance concentration can inform prioritization of technical assistance and structuring support.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Trigger and peril mix trends help frame basis-risk governance and payout predictability discussions.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Recency of issuance is a practical proxy for sovereign market readiness and implementation continuity.
          </article>
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, data, color }: { title: string; data: BreakdownRow[]; color: string }) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 10)} margin={{ left: -20, right: 10, top: 10, bottom: 40 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis
              dataKey="name"
              angle={-20}
              textAnchor="end"
              height={60}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value) => formatShort(value)}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
            <Bar dataKey="total_volume_usd" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function RankingTable({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Deals</th>
              <th className="px-2 py-2">Cumulative Issuance</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row, index) => (
              <tr key={`${title}-${row.name}`} className="border-b border-white/5 text-slate-100/90">
                <td className="px-2 py-2 text-slate-400">{index + 1}</td>
                <td className="px-2 py-2">{row.name}</td>
                <td className="px-2 py-2 text-slate-300">{row.deal_count.toLocaleString("en-US")}</td>
                <td className="px-2 py-2 text-slate-200">{formatCurrency(row.total_volume_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function formatShort(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  return value.toLocaleString("en-US");
}

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.2)",
  background: "rgba(2,6,23,0.95)",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "10px 12px"
};
