import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDealBySlug } from "@/lib/market-data";
import { formatCurrency } from "@/lib/utils";

interface DealPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Deal Intelligence | Global Catastrophe Bond Intelligence Platform"
};

export default async function DealIntelligencePage({ params }: DealPageProps) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);
  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <Link href="/deals" className="btn-secondary inline-flex">
        Back to Deal Explorer
      </Link>

      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Deal Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{deal.deal_name ?? "Deal"}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {deal.country_name ?? "Country not stated"} | {deal.sovereign_flag ? "Sovereign" : "Non-Sovereign"} |{" "}
          {deal.deal_year ?? "Year not stated"}
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Deal Size" value={formatCurrency(deal.total_deal_size_usd)} />
        <MetricCard
          label="Expected Loss"
          value={
            deal.average_expected_loss_percent != null
              ? `${deal.average_expected_loss_percent.toFixed(3)}%`
              : "Not available"
          }
        />
        <MetricCard
          label="Spread"
          value={
            deal.average_final_spread_bps != null
              ? `${Math.round(deal.average_final_spread_bps)} bps`
              : "Not available"
          }
        />
        <MetricCard
          label="Risk Multiple"
          value={deal.average_risk_multiple != null ? `${deal.average_risk_multiple.toFixed(2)}x` : "Not available"}
        />
        <MetricCard label="Trigger" value={deal.trigger_type_normalized ?? "Not stated"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Structure Overview</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Deal ID" value={deal.deal_id ?? deal.id} />
            <Row label="Series" value={deal.series_name ?? "Not stated"} />
            <Row label="Sponsor" value={deal.sponsor_name ?? "Not stated"} />
            <Row label="Issuer" value={deal.issuer_name ?? "Not stated"} />
            <Row label="Country" value={deal.country_name ?? "Not stated"} />
            <Row label="Peril" value={deal.peril_tags.join(", ") || "Not stated"} />
            <Row label="Trigger Type" value={deal.trigger_type_normalized ?? "Not stated"} />
            <Row label="Issue Date" value={deal.issue_date ?? "Not stated"} />
            <Row label="Maturity Date" value={deal.maturity_date ?? "Not stated"} />
            <Row label="Active / Matured" value={deal.active_or_matured ?? "Not stated"} />
          </dl>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Risk & Pricing Detail</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row
              label="Expected Loss (%)"
              value={
                deal.average_expected_loss_percent != null
                  ? `${deal.average_expected_loss_percent.toFixed(3)}%`
                  : "Not available"
              }
            />
            <Row
              label="Final Spread (bps)"
              value={deal.average_final_spread_bps != null ? `${Math.round(deal.average_final_spread_bps)}` : "Not available"}
            />
            <Row
              label="Risk Multiple"
              value={deal.average_risk_multiple != null ? `${deal.average_risk_multiple.toFixed(2)}x` : "Not available"}
            />
            <Row label="Triggered Deal" value={deal.triggered_deal_flag ? "Yes" : "No"} />
            <Row
              label="Principal Loss"
              value={deal.total_principal_loss_usd ? formatCurrency(deal.total_principal_loss_usd) : "Not available"}
            />
            <Row label="Primary Source URL" value={deal.primary_source_url ?? "Not stated"} />
          </dl>
          {deal.primary_source_url ? (
            <a
              href={deal.primary_source_url}
              target="_blank"
              rel="noreferrer"
              className="btn-hero-secondary mt-4 inline-flex"
            >
              Open Source Document
            </a>
          ) : null}
        </article>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-semibold text-cyan-100">{value}</p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  );
}
