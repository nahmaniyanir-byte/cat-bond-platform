"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { DistributionDataset, SpreadVsExpectedLossRecord } from "@/lib/market-data";
import { ChartExplainer } from "@/components/ui/chart-explainer";

interface PricingIntelligenceDashboardProps {
  spreadVsExpectedLoss: SpreadVsExpectedLossRecord[];
  expectedLossDistribution: DistributionDataset;
  spreadDistribution: DistributionDataset;
  pricingByPeril: Array<{ peril: string; avg_spread_bps: number; avg_expected_loss_percent: number; count: number }>;
  pricingByTrigger: Array<{ trigger: string; avg_spread_bps: number; avg_expected_loss_percent: number; count: number }>;
  segmentPricing: Array<{ segment: string; avg_spread_bps: number; avg_expected_loss_percent: number; count: number }>;
}

export function PricingIntelligenceDashboard({
  spreadVsExpectedLoss,
  expectedLossDistribution,
  spreadDistribution,
  pricingByPeril,
  pricingByTrigger,
  segmentPricing
}: PricingIntelligenceDashboardProps) {
  const sovereign = spreadVsExpectedLoss.filter((row) => row.sovereign_flag);
  const nonSovereign = spreadVsExpectedLoss.filter((row) => !row.sovereign_flag);
  const expectedHistogram = expectedLossDistribution.buckets.map((bucket) => ({
    bin: `${(bucket.bin_start * 100).toFixed(1)}–${(bucket.bin_end * 100).toFixed(1)}%`,
    count: bucket.count
  }));
  const spreadHistogram = spreadDistribution.buckets.map((bucket) => ({
    bin: `${Math.round(bucket.bin_start)}-${Math.round(bucket.bin_end)}`,
    count: bucket.count
  }));

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Market Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Pricing Intelligence</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Pricing diagnostics for catastrophe bond transactions across expected loss, spread, peril class, trigger
          architecture, and sovereign-vs-non-sovereign segmentation.
        </p>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Spread vs Expected Loss</h2>
        <p className="mt-2 text-sm text-slate-300">
          This chart compares pricing (spread) with modeled risk (expected loss).
        </p>
        <div className="mt-4 h-[430px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 10, right: 14, top: 10, bottom: 16 }}>
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
                name="Spread"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) => `${Math.round(Number(value))}`}
              />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }} />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter name="Sovereign" data={sovereign} fill="rgba(96,165,250,0.9)" />
              <Scatter name="Non-Sovereign" data={nonSovereign} fill="rgba(52,211,153,0.85)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <ChartExplainer
          what="Deal-level spread versus expected loss across sovereign and non-sovereign segments."
          why="Supports pricing diagnostics, risk multiple interpretation, and segment comparison."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DistributionCard title="Expected Loss Distribution" data={expectedHistogram} />
        <DistributionCard title="Spread Distribution (bps)" data={spreadHistogram} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <PricingBarCard title="Pricing by Peril" data={pricingByPeril} xKey="peril" />
        <PricingBarCard title="Pricing by Trigger Type" data={pricingByTrigger} xKey="trigger" />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Sovereign vs Non-Sovereign Pricing</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
                <th className="px-2 py-2">Segment</th>
                <th className="px-2 py-2">Deals</th>
                <th className="px-2 py-2">Avg Expected Loss</th>
                <th className="px-2 py-2">Avg Spread (bps)</th>
              </tr>
            </thead>
            <tbody>
              {segmentPricing.map((row) => (
                <tr key={row.segment} className="border-b border-white/5 text-slate-100/90">
                  <td className="px-2 py-2">{row.segment}</td>
                  <td className="px-2 py-2 text-slate-300">{row.count.toLocaleString("en-US")}</td>
                  <td className="px-2 py-2 text-slate-300">{row.avg_expected_loss_percent.toFixed(3)}%</td>
                  <td className="px-2 py-2 text-slate-300">{Math.round(row.avg_spread_bps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ChartExplainer
          what="Average expected loss and spread comparison by sovereign market segment."
          why="Shows structural pricing differences between sovereign and non-sovereign catastrophe bond activity."
        />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Market Insights</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Spread patterns generally rise with higher expected loss, consistent with risk-transfer pricing logic.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Trigger and peril composition can influence pricing clusters and dispersion across the market.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Segment-level pricing differences help frame sovereign structuring and fiscal affordability discussions.
          </article>
        </div>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Policy Implications</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Sovereign issuers can use spread-to-expected-loss diagnostics to assess budgetary tradeoffs of ex-ante risk
            transfer.
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
            Pricing analytics are historical indicators and should be combined with current market sounding before
            policy decisions.
          </article>
        </div>
      </section>
    </div>
  );
}

function DistributionCard({ title, data }: { title: string; data: Array<{ bin: string; count: number }> }) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 40 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis
              dataKey="bin"
              angle={-22}
              textAnchor="end"
              height={64}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Deals"]} />
            <Bar dataKey="count" fill="rgba(56,189,248,0.82)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function PricingBarCard({
  title,
  data,
  xKey
}: {
  title: string;
  data: Array<{ peril?: string; trigger?: string; avg_spread_bps: number; count: number }>;
  xKey: "peril" | "trigger";
}) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 12)} margin={{ left: -20, right: 10, top: 10, bottom: 40 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis
              dataKey={xKey}
              angle={-20}
              textAnchor="end"
              height={60}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [Math.round(value), "Avg Spread (bps)"]} />
            <Bar dataKey="avg_spread_bps" fill="rgba(99,102,241,0.85)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: SpreadVsExpectedLossRecord }> }) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: "#e2e8f0", fontWeight: 600 }}>{row.deal_name ?? "Deal"}</p>
      <p style={{ color: "#cbd5e1" }}>{row.country_name ?? "Country not stated"}</p>
      <p style={{ color: "#94a3b8" }}>Year: {row.deal_year ?? "N/A"}</p>
      <p style={{ color: "#94a3b8" }}>Expected Loss: {row.expected_loss_percent.toFixed(3)}%</p>
      <p style={{ color: "#94a3b8" }}>Spread: {Math.round(row.final_spread_bps)} bps</p>
      <p style={{ color: "#94a3b8" }}>{row.sovereign_flag ? "Sovereign" : "Non-Sovereign"}</p>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.2)",
  background: "rgba(2,6,23,0.95)",
  color: "#e2e8f0",
  fontSize: "12px",
  padding: "10px 12px"
};
