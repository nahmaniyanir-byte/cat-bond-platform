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

import type {
  IssuanceByYearRecord,
  PerilDistributionRecord,
  SovereignVsPrivateDataset
} from "@/lib/market-data";
import { ChartExplainer } from "@/components/ui/chart-explainer";
import { EmptyStateCard } from "@/components/ui/empty-state-card";

interface MarketAnalyticsPanelProps {
  issuanceByYear: IssuanceByYearRecord[];
  perilDistribution: PerilDistributionRecord[];
  sovereignVsPrivate: SovereignVsPrivateDataset;
}

export function MarketAnalyticsPanel({
  issuanceByYear,
  perilDistribution,
  sovereignVsPrivate
}: MarketAnalyticsPanelProps) {
  const issuanceAll = issuanceByYear.filter((item) => !item.segment_key || item.segment_key === "all");
  const perilTop = perilDistribution.slice(0, 8);

  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <article className="glass-panel p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Issuance by Year</h2>
        {issuanceAll.length ? (
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuanceAll} margin={{ left: -22, right: 6, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(value) => `${Math.round(value / 1_000_000_000)}B`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(34,211,238,0.08)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(148,163,184,0.2)",
                    background: "rgba(2,6,23,0.95)"
                  }}
                  formatter={(value: number) => [`$${(value / 1_000_000_000).toFixed(2)}B`, "Issuance"]}
                />
                <Bar dataKey="total_volume_usd" fill="rgba(34,211,238,0.78)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyStateCard />
          </div>
        )}
        <ChartExplainer
          what="Annual cumulative issuance trend at deal level."
          why="Shows cycle dynamics and market depth evolution through time."
        />
      </article>

      <article className="glass-panel p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Peril Distribution</h2>
        {perilTop.length ? (
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perilTop} margin={{ left: -22, right: 6, top: 10, bottom: 40 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="peril"
                  angle={-30}
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
                  tickFormatter={(value) => `${Math.round(value / 1_000_000_000)}B`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(59,130,246,0.12)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(148,163,184,0.2)",
                    background: "rgba(2,6,23,0.95)"
                  }}
                  formatter={(value: number) => [`$${(value / 1_000_000_000).toFixed(2)}B`, "Issuance"]}
                />
                <Bar dataKey="total_volume_usd" fill="rgba(96,165,250,0.78)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyStateCard />
          </div>
        )}
        <ChartExplainer
          what="Cumulative issuance grouped by normalized peril category."
          why="Highlights hazard concentration in catastrophe bond risk transfer."
        />
      </article>

      <article className="glass-panel p-4 md:p-5">
        <h2 className="text-lg font-semibold text-white">Sovereign vs Non-Sovereign</h2>
        {sovereignVsPrivate.summary_by_sovereign_flag.length ? (
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sovereignVsPrivate.summary_by_sovereign_flag} margin={{ left: -22, right: 6, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="segment" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(value) => `${Math.round(value / 1_000_000_000)}B`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(52,211,153,0.1)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(148,163,184,0.2)",
                    background: "rgba(2,6,23,0.95)"
                  }}
                  formatter={(value: number) => [`$${(value / 1_000_000_000).toFixed(2)}B`, "Issuance"]}
                />
                <Bar dataKey="total_volume_usd" fill="rgba(52,211,153,0.8)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyStateCard />
          </div>
        )}
        <ChartExplainer
          what="Cumulative issuance split between sovereign and non-sovereign segments."
          why="Frames public-sector market participation against private market depth."
        />
      </article>
    </section>
  );
}
