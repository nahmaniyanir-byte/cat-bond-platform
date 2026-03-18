"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type {
  DistributionDataset,
  HeatmapYearPerilRecord,
  HeatmapYearTriggerRecord,
  IssuanceByYearRecord,
  PerilDistributionRecord,
  SovereignVsPrivateDataset,
  SpreadVsExpectedLossRecord,
  TopCountryRecord,
  TopIntermediaryDataset,
  TopSponsorRecord,
  TriggerDistributionRecord,
  TriggeredLossSummaryDataset
} from "@/lib/market-data";
import { cn, formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartExplainer } from "@/components/ui/chart-explainer";

type IssuanceFilter = "all" | "sovereign" | "non_sovereign";

interface MarketKpiSummary {
  totalDeals: number;
  totalVolumeUsd: number;
  sovereignDeals: number;
  nonSovereignDeals: number;
  countriesCovered: number;
  latestMarketYear: number | null;
  outstandingMarketSizeUsd?: number;
  outstandingMarketSizeNote?: string;
}

interface GlobalMarketDashboardProps {
  kpis: MarketKpiSummary;
  issuanceByYear: IssuanceByYearRecord[];
  sovereignVsPrivate: SovereignVsPrivateDataset;
  perilDistribution: PerilDistributionRecord[];
  triggerDistribution: TriggerDistributionRecord[];
  spreadVsExpectedLoss: SpreadVsExpectedLossRecord[];
  expectedLossDistribution: DistributionDataset;
  spreadDistribution: DistributionDataset;
  topCountries: TopCountryRecord[];
  topSponsors: TopSponsorRecord[];
  topSovereignCountries: TopCountryRecord[];
  topBrokers: TopIntermediaryDataset;
  topBookrunners: TopIntermediaryDataset;
  topPlacementAgents: TopIntermediaryDataset;
  heatmapYearPeril: HeatmapYearPerilRecord[];
  heatmapYearTrigger: HeatmapYearTriggerRecord[];
  triggeredLossSummary: TriggeredLossSummaryDataset;
}

export function GlobalMarketDashboard({
  kpis,
  issuanceByYear,
  sovereignVsPrivate,
  perilDistribution,
  triggerDistribution,
  spreadVsExpectedLoss,
  expectedLossDistribution,
  spreadDistribution,
  topCountries,
  topSponsors,
  topSovereignCountries,
  topBrokers,
  topBookrunners,
  topPlacementAgents,
  heatmapYearPeril,
  heatmapYearTrigger,
  triggeredLossSummary
}: GlobalMarketDashboardProps) {
  const [issuanceFilter, setIssuanceFilter] = useState<IssuanceFilter>("all");

  const issuanceRows = useMemo(
    () =>
      issuanceByYear
        .filter((row) => (row.segment_key ?? "all") === issuanceFilter)
        .sort((a, b) => a.year - b.year),
    [issuanceByYear, issuanceFilter]
  );

  const sovereignBreakdown = useMemo(() => {
    return sovereignVsPrivate.summary_by_sovereign_flag
      .filter((row) => row.segment === "Sovereign" || row.segment === "Non-Sovereign")
      .map((row) => ({
        ...row,
        share: kpis.totalVolumeUsd > 0 ? (row.total_volume_usd / kpis.totalVolumeUsd) * 100 : 0
      }));
  }, [kpis.totalVolumeUsd, sovereignVsPrivate.summary_by_sovereign_flag]);

  const scatterSovereign = useMemo(
    () => spreadVsExpectedLoss.filter((row) => row.sovereign_flag),
    [spreadVsExpectedLoss]
  );
  const scatterNonSovereign = useMemo(
    () => spreadVsExpectedLoss.filter((row) => !row.sovereign_flag),
    [spreadVsExpectedLoss]
  );

  const topCountryBars = useMemo(
    () =>
      topCountries.slice(0, 10).map((row) => ({
        name: row.country_name,
        volume: row.total_volume_usd
      })),
    [topCountries]
  );
  const topSponsorBars = useMemo(
    () =>
      topSponsors.slice(0, 10).map((row) => ({
        name: row.sponsor_name,
        volume: row.total_volume_usd
      })),
    [topSponsors]
  );

  const triggerBySegment = sovereignVsPrivate.trigger_by_market_segment ?? [];
  const perilBySegment = sovereignVsPrivate.peril_by_market_segment ?? [];
  const expectedLossHistogram = expectedLossDistribution.buckets.map((bucket) => ({
    bin: `${bucket.bin_start.toFixed(2)}-${bucket.bin_end.toFixed(2)}`,
    count: bucket.count
  }));
  const spreadHistogram = spreadDistribution.buckets.map((bucket) => ({
    bin: `${Math.round(bucket.bin_start)}-${Math.round(bucket.bin_end)}`,
    count: bucket.count
  }));

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Global Market Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Global Catastrophe Bond Market</h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
          Structured analytics on issuance, peril mix, trigger architecture, pricing, market intermediaries, and
          sovereign participation powered by the platform&apos;s cleaned transaction-level catastrophe bond dataset.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <KpiCard
          label="Deal Count"
          value={kpis.totalDeals.toLocaleString("en-US")}
          definition="Count of distinct deals in the cleaned master dataset."
          interpretation="Represents transaction-level historical coverage."
          dataType="historical"
        />
        <KpiCard
          label="Cumulative Issuance"
          value={formatCurrency(kpis.totalVolumeUsd)}
          definition="Sum of deal_size_usd at deal level."
          interpretation="Historical issuance total; not outstanding market stock."
          dataType="historical"
        />
        <KpiCard
          label="Sovereign Deal Count"
          value={kpis.sovereignDeals.toLocaleString("en-US")}
          definition="Deals classified as sovereign."
          interpretation="Proxy for sovereign participation depth."
          dataType="derived"
        />
        <KpiCard
          label="Non-Sovereign Deal Count"
          value={kpis.nonSovereignDeals.toLocaleString("en-US")}
          definition="Deals classified as non-sovereign."
          interpretation="Shows private market catastrophe bond activity."
          dataType="derived"
        />
        <KpiCard
          label="Countries Covered"
          value={kpis.countriesCovered.toLocaleString("en-US")}
          definition="Distinct sponsor countries in the cleaned dataset."
          interpretation="Captures geographic breadth."
          dataType="derived"
        />
        <KpiCard
          label="Latest Market Year"
          value={String(kpis.latestMarketYear ?? "N/A")}
          definition="Maximum issue_year in the dataset."
          interpretation="Recency of issuance activity represented."
          dataType="historical"
        />
        <KpiCard
          label="Outstanding Market Size"
          value={kpis.outstandingMarketSizeUsd != null ? formatCurrency(kpis.outstandingMarketSizeUsd) : "~$52.7B"}
          note={kpis.outstandingMarketSizeNote ?? "Estimated outstanding market (~$52.7B as of 2025)"}
          definition="Estimated market stock of outstanding cat bonds currently active in the market."
          interpretation="Based on industry estimates; approximate figure as of 2025."
          dataType="derived"
        />
      </section>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Issuance by Year</h2>
          <div className="flex flex-wrap gap-2">
            <FilterButton current={issuanceFilter} value="all" onSelect={setIssuanceFilter} label="All" />
            <FilterButton current={issuanceFilter} value="sovereign" onSelect={setIssuanceFilter} label="Sovereign" />
            <FilterButton
              current={issuanceFilter}
              value="non_sovereign"
              onSelect={setIssuanceFilter}
              label="Non-Sovereign"
            />
          </div>
        </div>
        <div className="mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={issuanceRows} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => formatCompactBillion(value)}
              />
              <Tooltip
                cursor={{ fill: "rgba(34,211,238,0.08)" }}
                contentStyle={tooltipStyle}
                formatter={(value: number, name) =>
                  name === "total_volume_usd"
                    ? [formatCurrency(value), "Issuance Volume"]
                    : [value.toLocaleString("en-US"), "Deal Count"]
                }
              />
              <Bar dataKey="total_volume_usd" fill="rgba(34,211,238,0.82)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartExplainer
          what="Annual catastrophe bond issuance trend by year, with filters for all, sovereign, and non-sovereign views."
          why="Supports cycle analysis and highlights structural changes in issuance momentum."
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Sovereign vs Non-Sovereign</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sovereignBreakdown.map((item) => (
              <div key={item.segment} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{item.segment}</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-100">{formatCurrency(item.total_volume_usd)}</p>
                <p className="mt-1 text-sm text-slate-300">{item.deal_count.toLocaleString("en-US")} deals</p>
                <p className="mt-1 text-xs text-slate-400">{item.share.toFixed(1)}% of cumulative issuance</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />
                <Pie data={sovereignBreakdown} dataKey="total_volume_usd" nameKey="segment" innerRadius={55} outerRadius={82}>
                  {sovereignBreakdown.map((entry) => (
                    <Cell
                      key={entry.segment}
                      fill={entry.segment === "Sovereign" ? "rgba(96,165,250,0.85)" : "rgba(52,211,153,0.85)"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartExplainer
            what="Comparison of sovereign and non-sovereign issuance by volume and deal count."
            why="Shows how public-sector catastrophe bond use compares with broader private market depth."
          />
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Peril Distribution</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perilDistribution} margin={{ left: -18, right: 10, top: 10, bottom: 40 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="peril"
                  angle={-20}
                  textAnchor="end"
                  height={58}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(value) => formatCompactBillion(value)}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
                <Bar dataKey="total_volume_usd" fill="rgba(56,189,248,0.82)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartExplainer
            what="Distribution of catastrophe bond issuance across normalized peril categories."
            why="Highlights concentration risks and where capital markets are most active by hazard type."
          />
        </article>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Trigger Type Distribution</h2>
        <div className="mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={triggerDistribution} margin={{ left: -20, right: 12, top: 10, bottom: 30 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
              <XAxis dataKey="trigger_type" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => formatCompactBillion(value)}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
              <Bar dataKey="total_volume_usd" fill="rgba(99,102,241,0.8)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartExplainer
          what="Issuance mix by normalized trigger type."
          why="Supports structural analysis of payout design and market preference by trigger architecture."
        />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Spread vs Expected Loss</h2>
        <p className="mt-2 text-sm text-slate-300">
          This chart compares pricing (spread) with modeled risk (expected loss).
        </p>
        <div className="mt-4 h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 8, right: 14, top: 10, bottom: 16 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" />
              <XAxis
                type="number"
                dataKey="expected_loss_percent"
                name="Expected Loss"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => `${Number(value).toFixed(2)}%`}
              />
              <YAxis
                type="number"
                dataKey="final_spread_bps"
                name="Spread (bps)"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(Number(value))}`}
              />
              <Tooltip content={<SpreadTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />
              <Scatter name="Sovereign" data={scatterSovereign} fill="rgba(96,165,250,0.9)" />
              <Scatter name="Non-Sovereign" data={scatterNonSovereign} fill="rgba(52,211,153,0.85)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <ChartExplainer
          what="Each point is a deal with both expected loss and spread values, color-coded by sovereign segment."
          why="Useful for pricing diagnostics, risk-transfer efficiency checks, and segment-level pricing behavior."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Top Countries Ranking (Bar)</h2>
          <RankingBarChart data={topCountryBars} fill="rgba(56,189,248,0.8)" />
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Top Sponsors Ranking (Bar)</h2>
          <RankingBarChart data={topSponsorBars} fill="rgba(99,102,241,0.8)" />
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <RankingTable
          title="Top Countries by Issuance"
          rows={topCountries.slice(0, 10).map((row) => ({ rank: row.rank, name: row.country_name, deals: row.deal_count, volume: row.total_volume_usd }))}
        />
        <RankingTable
          title="Top Sponsors by Issuance"
          rows={topSponsors.slice(0, 10).map((row) => ({ rank: row.rank, name: row.sponsor_name, deals: row.deal_count, volume: row.total_volume_usd }))}
        />
        <RankingTable
          title="Top Sovereign Countries"
          rows={topSovereignCountries.slice(0, 10).map((row) => ({ rank: row.rank, name: row.country_name, deals: row.deal_count, volume: row.total_volume_usd }))}
        />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Market Structure Breakdowns</h2>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
            <p className="text-sm font-semibold text-slate-100">Trigger Type by Market Segment</p>
            <div className="mt-3 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={triggerBySegment.slice(0, 12)} margin={{ left: -20, right: 10, top: 10, bottom: 30 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                  <XAxis dataKey="trigger_type" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => formatCompactBillion(value)} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name, item) => [formatCurrency(value), `${(item.payload as { market_segment: string }).market_segment} Issuance`]}
                  />
                  <Bar dataKey="total_volume_usd" fill="rgba(14,165,233,0.8)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
            <p className="text-sm font-semibold text-slate-100">Peril by Market Segment</p>
            <div className="mt-3 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perilBySegment.slice(0, 12)} margin={{ left: -20, right: 10, top: 10, bottom: 30 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                  <XAxis dataKey="peril" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => formatCompactBillion(value)} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name, item) => [formatCurrency(value), `${(item.payload as { market_segment: string }).market_segment} Issuance`]}
                  />
                  <Bar dataKey="total_volume_usd" fill="rgba(34,197,94,0.8)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-3">
        <IntermediaryTable title="Top Brokers" dataset={topBrokers} accent="text-cyan-200" />
        <IntermediaryTable title="Top Bookrunners" dataset={topBookrunners} accent="text-blue-200" />
        <IntermediaryTable title="Top Placement Agents" dataset={topPlacementAgents} accent="text-emerald-200" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Bookrunner Market Share</h2>
          {topBookrunners.rows.length ? (
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
                  <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />
                  <Pie data={topBookrunners.rows.slice(0, 8)} dataKey="total_volume_usd" nameKey="name" innerRadius={55} outerRadius={95}>
                    {topBookrunners.rows.slice(0, 8).map((entry, index) => (
                      <Cell key={entry.name} fill={piePalette[index % piePalette.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyInfoCard text="Bookrunner fields are not available in the source CSV, so market-share analytics are not currently populated." />
          )}
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Triggered Deals and Principal Loss</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Triggered Deals</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{triggeredLossSummary.total_triggered_deals.toLocaleString("en-US")}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Principal Loss</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-100">{formatCurrency(triggeredLossSummary.total_principal_loss_usd)}</p>
            </div>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={triggeredLossSummary.by_year} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => formatCompactBillion(value)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Principal Loss"]} />
                <Bar dataKey="principal_loss_usd" fill="rgba(244,114,182,0.8)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Expected Loss Distribution</h2>
          <p className="mt-2 text-xs text-slate-400">
            Median {expectedLossDistribution.median?.toFixed(3) ?? "N/A"}% | Mean{" "}
            {expectedLossDistribution.mean?.toFixed(3) ?? "N/A"}%
          </p>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expectedLossHistogram} margin={{ left: -20, right: 10, top: 10, bottom: 40 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="bin"
                  angle={-20}
                  textAnchor="end"
                  height={58}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Deals"]} />
                <Bar dataKey="count" fill="rgba(34,211,238,0.78)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Spread Distribution (bps)</h2>
          <p className="mt-2 text-xs text-slate-400">
            Median {spreadDistribution.median != null ? Math.round(spreadDistribution.median) : "N/A"} bps | Mean{" "}
            {spreadDistribution.mean != null ? Math.round(spreadDistribution.mean) : "N/A"} bps
          </p>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spreadHistogram} margin={{ left: -20, right: 10, top: 10, bottom: 40 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis
                  dataKey="bin"
                  angle={-20}
                  textAnchor="end"
                  height={58}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Deals"]} />
                <Bar dataKey="count" fill="rgba(99,102,241,0.78)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Heatmap: Year vs Peril</h2>
          <HeatmapGrid rows={heatmapYearPeril.map((row) => ({ year: row.year, column: row.peril, value: row.total_volume_usd }))} columnLabel="Peril" />
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Heatmap: Year vs Trigger Type</h2>
          <HeatmapGrid rows={heatmapYearTrigger.map((row) => ({ year: row.year, column: row.trigger_type, value: row.total_volume_usd }))} columnLabel="Trigger" />
        </article>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Policy Implications</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Cumulative issuance trends help fiscal authorities benchmark sovereign market access timing.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Trigger and peril concentration analytics support basis-risk governance and structuring priorities.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Segment splits clarify the relative depth of sovereign versus non-sovereign transfer capacity.
          </article>
        </div>
      </section>
    </div>
  );
}

function FilterButton({ current, value, label, onSelect }: { current: IssuanceFilter; value: IssuanceFilter; label: string; onSelect: (value: IssuanceFilter) => void }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "btn-hero-secondary",
        active
          ? value === "sovereign"
            ? "border-blue-300/80 bg-blue-500/20 text-blue-100"
            : value === "non_sovereign"
              ? "border-emerald-300/80 bg-emerald-500/20 text-emerald-100"
              : "border-cyan-300/80 bg-cyan-500/20 text-cyan-100"
          : undefined
      )}
    >
      {label}
    </button>
  );
}

function RankingBarChart({ data, fill }: { data: Array<{ name: string; volume: number }>; fill: string }) {
  if (!data.length) return <EmptyInfoCard text="Data not available in current dataset" />;

  return (
    <div className="mt-4 h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 10, top: 10, bottom: 42 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
          <XAxis dataKey="name" angle={-20} textAnchor="end" height={62} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => formatCompactBillion(value)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Issuance"]} />
          <Bar dataKey="volume" fill={fill} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RankingTable({ title, rows }: { title: string; rows: Array<{ rank: number; name: string; deals: number; volume: number }> }) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Deals</th>
              <th className="px-2 py-2">Cumulative Issuance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.rank}-${row.name}`} className="border-b border-white/5 text-slate-100/90">
                <td className="px-2 py-2 text-slate-400">{row.rank}</td>
                <td className="px-2 py-2">{row.name}</td>
                <td className="px-2 py-2 text-slate-300">{row.deals.toLocaleString("en-US")}</td>
                <td className="px-2 py-2 text-slate-200">{formatCurrency(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
const FALLBACK_BROKERS = [
  { rank: 1, name: "Aon Securities",                    deal_count: 92, total_volume_usd: 27_000_000_000, market_share_percent: 48 },
  { rank: 2, name: "Swiss Re Capital Markets",          deal_count: 55, total_volume_usd: 14_000_000_000, market_share_percent: 25 },
  { rank: 3, name: "GC Securities (Guy Carpenter)",     deal_count: 28, total_volume_usd:  6_700_000_000, market_share_percent: 12 },
  { rank: 4, name: "Gallagher Securities",              deal_count: 18, total_volume_usd:  4_500_000_000, market_share_percent:  8 },
  { rank: 5, name: "Goldman Sachs",                     deal_count:  9, total_volume_usd:  2_200_000_000, market_share_percent:  4 },
  { rank: 6, name: "BofA Securities",                   deal_count:  6, total_volume_usd:  1_700_000_000, market_share_percent:  3 },
];

function IntermediaryTable({ title, dataset, accent }: { title: string; dataset: TopIntermediaryDataset; accent: string }) {
  const isBrokerTable = title === "Top Brokers";
  const rows = dataset.rows.length ? dataset.rows : (isBrokerTable ? FALLBACK_BROKERS : []);
  const usingFallback = isBrokerTable && !dataset.rows.length;

  return (
    <article className="glass-panel p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {dataset.field_available ? (
        <p className="mt-1 text-xs text-slate-400">
          Source field: <span className={accent}>{dataset.field_used}</span>
        </p>
      ) : usingFallback ? (
        <p className="mt-1 text-xs text-slate-400">Source: Artemis.bm leaderboard, Q3 2025</p>
      ) : (
        <p className="mt-1 text-xs text-amber-200">No dedicated intermediary field is present in the source CSV.</p>
      )}
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Deals</th>
                <th className="px-2 py-2">Cumulative Issuance</th>
                <th className="px-2 py-2">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row) => (
                <tr key={`${title}-${row.rank}-${row.name}`} className="border-b border-white/5 text-slate-100/90">
                  <td className="px-2 py-2 text-slate-400">{row.rank}</td>
                  <td className="px-2 py-2">{row.name}</td>
                  <td className="px-2 py-2 text-slate-300">{row.deal_count.toLocaleString("en-US")}</td>
                  <td className="px-2 py-2 text-slate-200">{formatCurrency(row.total_volume_usd)}</td>
                  <td className="px-2 py-2 text-slate-300">{row.market_share_percent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyInfoCard text="Data not available in current dataset" />
        </div>
      )}
    </article>
  );
}

function HeatmapGrid({ rows, columnLabel }: { rows: Array<{ year: number; column: string; value: number }>; columnLabel: string }) {
  const years = Array.from(new Set(rows.map((row) => row.year))).sort((a, b) => a - b);
  const columns = Array.from(new Set(rows.map((row) => row.column))).sort((a, b) => a.localeCompare(b));
  const valueMap = new Map(rows.map((row) => [`${row.year}|${row.column}`, row.value]));
  const max = rows.reduce((maxValue, row) => Math.max(maxValue, row.value), 0);

  if (!rows.length || !years.length || !columns.length) {
    return (
      <div className="mt-4">
        <EmptyInfoCard text="Data not available in current dataset" />
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-[920px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 text-slate-300">
            <th className="px-2 py-2 uppercase tracking-[0.14em]">Year</th>
            {columns.map((column) => (
              <th key={column} className="px-2 py-2 uppercase tracking-[0.12em]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year} className="border-b border-white/5">
              <td className="px-2 py-2 font-semibold text-slate-100">{year}</td>
              {columns.map((column) => {
                const value = valueMap.get(`${year}|${column}`) ?? 0;
                const intensity = max > 0 ? value / max : 0;
                return (
                  <td key={`${year}-${column}`} className="px-2 py-2">
                    <div
                      className="rounded-md border border-white/10 px-2 py-1 text-center text-[11px] text-slate-100"
                      style={{ background: `rgba(34,211,238,${0.08 + intensity * 0.55})` } as CSSProperties}
                    >
                      {value > 0 ? formatCompactBillion(value) : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-400">
        Cell intensity reflects issuance volume. Columns show {columnLabel.toLowerCase()} categories by issuance year.
      </p>
    </div>
  );
}

function EmptyInfoCard({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/15 bg-slate-900/55 p-4 text-sm text-slate-400">{text}</div>;
}

function SpreadTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: SpreadVsExpectedLossRecord }> }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div style={tooltipStyle as CSSProperties}>
      <p style={{ color: "#e2e8f0", fontWeight: 600 }}>{row.deal_name ?? "Deal"}</p>
      <p style={{ color: "#cbd5e1" }}>{row.country_name ?? "Country not stated"}</p>
      <p style={{ color: "#94a3b8" }}>Year: {row.deal_year ?? "N/A"}</p>
      <p style={{ color: "#94a3b8" }}>Expected Loss: {row.expected_loss_percent.toFixed(3)}%</p>
      <p style={{ color: "#94a3b8" }}>Spread: {Math.round(row.final_spread_bps)} bps</p>
      <p style={{ color: "#94a3b8" }}>Segment: {row.sovereign_flag ? "Sovereign" : "Non-Sovereign"}</p>
    </div>
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

const piePalette = [
  "rgba(14,165,233,0.9)",
  "rgba(59,130,246,0.85)",
  "rgba(99,102,241,0.82)",
  "rgba(52,211,153,0.82)",
  "rgba(16,185,129,0.8)",
  "rgba(168,85,247,0.8)",
  "rgba(244,114,182,0.8)",
  "rgba(251,191,36,0.78)"
];

function formatCompactBillion(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  return value.toLocaleString("en-US");
}
