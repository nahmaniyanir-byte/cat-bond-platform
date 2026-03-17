import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getDealBySlug, getDealPageIndex } from "@/lib/deal-pages";
import { getMasterDeals } from "@/lib/market-data";
import { formatCurrency } from "@/lib/utils";

type DealPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await resolveDeal(slug);
  if (!deal) return { title: "Deal Not Found | Global Catastrophe Bond Intelligence Platform" };

  return {
    title: `${deal.deal_name ?? "Deal"} | Deal Intelligence`,
    description:
      "Transaction-level catastrophe bond intelligence including structure, trigger, peril, pricing, risk, and source documentation."
  };
}

export async function generateStaticParams() {
  const index = await getDealPageIndex();
  return index.map((item) => ({ slug: item.slug }));
}

export default async function DealPage({ params }: DealPageProps) {
  const { slug } = await params;
  const deal = await resolveDeal(slug);
  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <Link href="/deals" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
        <ArrowLeft className="h-4 w-4" />
        Back to Deal Explorer
      </Link>

      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Deal Hero</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{deal.deal_name ?? "Unnamed Deal"}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {deal.series_name ?? "Series not stated"} | {deal.sponsor_name ?? "Sponsor not stated"} |{" "}
          {deal.deal_year ?? "Year not stated"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">{deal.sovereign_flag ? "Sovereign" : "Non-Sovereign"}</span>
          <span className="chip">{deal.trigger_type_normalized}</span>
          {deal.peril_tags.map((peril) => (
            <span key={`${deal.id}-${peril}`} className="chip">
              {peril}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Deal Size" value={formatCurrency(deal.total_deal_size_usd)} />
        <MetricCard label="Country" value={deal.country_name ?? "N/A"} />
        <MetricCard label="Issue Year" value={String(deal.deal_year ?? "N/A")} />
        <MetricCard
          label="Expected Loss"
          value={deal.average_expected_loss_percent != null ? `${deal.average_expected_loss_percent.toFixed(3)}%` : "N/A"}
        />
        <MetricCard
          label="Spread"
          value={deal.average_final_spread_bps != null ? `${Math.round(deal.average_final_spread_bps)} bps` : "N/A"}
        />
        <MetricCard
          label="Risk Multiple"
          value={deal.average_risk_multiple != null ? `${deal.average_risk_multiple.toFixed(2)}x` : "N/A"}
        />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Structure Overview</h2>
        <dl className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
          <InfoRow label="Deal ID" value={deal.deal_id ?? deal.id} />
          <InfoRow label="Series Name" value={deal.series_name ?? "Not stated"} />
          <InfoRow label="Sponsor" value={deal.sponsor_name ?? "Not stated"} />
          <InfoRow label="Issuer" value={deal.issuer_name ?? "Not stated"} />
          <InfoRow label="Cedent" value={deal.cedent_name ?? "Not stated"} />
          <InfoRow label="Market Segment" value={deal.market_segment} />
          <InfoRow label="Peril Type" value={deal.peril_type ?? deal.covered_perils ?? "Not stated"} />
          <InfoRow label="Trigger Type" value={deal.trigger_type_normalized} />
          <InfoRow label="Issue Date" value={deal.issue_date ?? "Not stated"} />
          <InfoRow label="Maturity Date" value={deal.maturity_date ?? "Not stated"} />
        </dl>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Pricing Metrics</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <InfoRow label="Expected Loss (%)" value={formatNullablePercent(deal.average_expected_loss_percent)} />
            <InfoRow label="Final Spread (bps)" value={formatNullableBps(deal.average_final_spread_bps)} />
            <InfoRow label="Risk Multiple" value={formatNullableMultiple(deal.average_risk_multiple)} />
            <InfoRow label="Original Amount (USD)" value={formatNullableCurrency(deal.original_amount_usd)} />
            <InfoRow label="Program Size (ILS m)" value={deal.program_size_ils_m != null ? deal.program_size_ils_m.toLocaleString("en-US") : "N/A"} />
          </dl>
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Risk Metrics</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <InfoRow label="Peril Tags" value={deal.peril_tags.join(", ") || "N/A"} />
            <InfoRow label="Covered Region" value={deal.covered_region ?? "Not stated"} />
            <InfoRow label="Triggered Deal Flag" value={deal.triggered_deal_flag ? "Yes" : "No"} />
            <InfoRow label="Principal Loss (USD)" value={formatNullableCurrency(deal.total_principal_loss_usd)} />
            <InfoRow label="Region" value={deal.region_normalized} />
            <InfoRow label="Sovereign Classification" value={deal.sovereign_flag ? "Sovereign" : "Non-Sovereign"} />
          </dl>
        </article>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Related Country</h2>
        <p className="mt-2 text-sm text-slate-300">
          Country: {deal.country_name ?? "Not stated"} | Region: {deal.region_normalized}
        </p>
        {deal.country_slug ? (
          <Link href={`/countries/${deal.country_slug}`} className="btn-primary mt-4 inline-flex">
            Open Country Intelligence Page
          </Link>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No country page slug is available for this deal.</p>
        )}
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Source Metadata / Documents</h2>
        <div className="mt-4 space-y-3">
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Primary Source URL</p>
            {deal.primary_source_url ? (
              <a href={deal.primary_source_url} target="_blank" rel="noreferrer" className="btn-secondary mt-2 inline-flex">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Open Source
              </a>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No source URL is available in the current dataset row.</p>
            )}
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Data Traceability</p>
            <p className="mt-2 text-sm text-slate-300">
              This page is generated directly from the cleaned master dataset (`cat_bond_master_database.json`) with
              no hardcoded transaction values.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

async function resolveDeal(slug: string) {
  const allDeals = await getMasterDeals();
  const byId = allDeals.find((deal) => deal.deal_id === slug || deal.id === slug);
  if (byId) return byId;
  return getDealBySlug(slug);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-semibold text-cyan-100">{value}</p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}

function formatNullablePercent(value: number | null | undefined) {
  return value == null ? "N/A" : `${value.toFixed(3)}%`;
}

function formatNullableBps(value: number | null | undefined) {
  return value == null ? "N/A" : `${Math.round(value)} bps`;
}

function formatNullableMultiple(value: number | null | undefined) {
  return value == null ? "N/A" : `${value.toFixed(2)}x`;
}

function formatNullableCurrency(value: number | null | undefined) {
  return value == null ? "N/A" : formatCurrency(value);
}
