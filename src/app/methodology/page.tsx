import type { Metadata } from "next";
import path from "node:path";
import fs from "node:fs/promises";

import { KpiCard } from "@/components/ui/kpi-card";
import { getGlobalKpisData } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Methodology & Data Governance | Global Catastrophe Bond Intelligence Platform"
};

interface AuditSummary {
  generated_at?: string;
  source_root?: string;
  source_files?: Record<string, string>;
  row_counts?: {
    raw_rows?: number;
    duplicate_rows_removed?: number;
    cleaned_rows?: number;
  };
  deduplication?: {
    primary_key?: string;
    duplicates_by_deal_id?: number;
    duplicates_by_fallback_key?: number;
    missing_deal_id_rows?: number;
  };
  amount_methodology?: {
    required_column?: string;
    rule?: string;
    cumulative_issuance_musd?: number;
    cumulative_issuance_usd?: number;
  };
}

export default async function MethodologyPage() {
  const [globalKpis, audit] = await Promise.all([getGlobalKpisData(), readAuditSummary()]);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Research & Tools</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Methodology & Data Governance</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Source hierarchy, classification logic, KPI governance, deduplication standards, and assumptions used across
          the Global Catastrophe Bond Intelligence Platform.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Source Hierarchy</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>1. Single source of truth: Artemis.bm Deal Directory (transaction-level catastrophe bond dataset).</p>
            <p>2. All KPI, chart, globe, and country analytics are generated only from this master dataset.</p>
            <p>3. Frontend pages read generated JSON outputs; no hardcoded transaction values are used.</p>
          </div>
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Classification Rules</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              Sovereign classification is derived by a deterministic `isSovereign` rule using sponsor/program text and
              explicit sovereign indicators.
            </p>
            <p>
              Trigger and peril dimensions are normalized into consistent categories to support comparability across
              years, segments, and countries.
            </p>
          </div>
        </article>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">KPI Logic</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Deal Count"
            value={globalKpis.total_deals.toLocaleString("en-US")}
            definition="COUNT(DISTINCT deal_id)"
            interpretation="Number of unique deal-level records in scope."
            dataType="historical"
          />
          <KpiCard
            label="Cumulative Issuance"
            value={`$${(globalKpis.cumulative_issuance_usd / 1_000_000_000).toFixed(3)}B`}
            definition="SUM(deal_size_usd)"
            interpretation="Historical issuance total at deal level."
            dataType="historical"
          />
          <KpiCard
            label="Sovereign Deals"
            value={globalKpis.sovereign_deal_count.toLocaleString("en-US")}
            definition="COUNT(deal_id WHERE sovereign_flag = TRUE)"
            interpretation="Sovereign segment transaction count."
            dataType="derived"
          />
          <KpiCard
            label="Non-Sovereign Deals"
            value={globalKpis.non_sovereign_deal_count.toLocaleString("en-US")}
            definition="COUNT(deal_id WHERE sovereign_flag = FALSE)"
            interpretation="Non-sovereign transaction count."
            dataType="derived"
          />
          <KpiCard
            label="Countries Covered"
            value={globalKpis.countries_covered.toLocaleString("en-US")}
            definition="COUNT(DISTINCT country_of_sponsor)"
            interpretation="Distinct sponsor countries represented."
            dataType="derived"
          />
          <KpiCard
            label="Latest Market Year"
            value={String(globalKpis.latest_market_year ?? "N/A")}
            definition="MAX(issue_year)"
            interpretation="Most recent issue year in current data coverage."
            dataType="historical"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Data Audit Snapshot</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Generated At" value={audit.generated_at ?? "N/A"} />
            <Row label="Source Root" value={audit.source_root ?? "N/A"} />
            <Row label="Raw Rows" value={String(audit.row_counts?.raw_rows ?? "N/A")} />
            <Row label="Duplicate Rows Removed" value={String(audit.row_counts?.duplicate_rows_removed ?? "N/A")} />
            <Row label="Cleaned Rows" value={String(audit.row_counts?.cleaned_rows ?? "N/A")} />
            <Row label="Primary Dedup Key" value={audit.deduplication?.primary_key ?? "N/A"} />
            <Row label="Missing Deal IDs" value={String(audit.deduplication?.missing_deal_id_rows ?? "N/A")} />
          </dl>
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Assumptions vs Official Data</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              Official data: direct fields from the Artemis.bm Deal Directory, ingested and normalised into the platform dataset.
            </p>
            <p>Derived data: KPI and analytics datasets generated deterministically from official fields.</p>
            <p>
              Illustrative assumptions: policy simulation modules (for example Israel Lab scenario presets).
            </p>
            <p>
              Missing values are handled conservatively: records with incomplete pricing are excluded from pricing-only
              metrics while remaining in deal-count and issuance totals.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

async function readAuditSummary(): Promise<AuditSummary> {
  try {
    const filePath = path.join(process.cwd(), "data", "master", "data_audit_summary.json");
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text) as AuditSummary;
  } catch {
    return {};
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}
