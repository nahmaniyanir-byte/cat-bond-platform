import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink } from "lucide-react";

import type { CountryPageSummary, CountrySectionDataset, CountryTimelineDataset } from "@/lib/country-pages";
import { formatCurrency } from "@/lib/utils";

interface CountryPageData {
  summary: CountryPageSummary;
  kpis: {
    total_deals: number;
    total_volume_usd: number;
    latest_issue_year: number | null;
    main_peril: string;
    main_trigger_type: string;
    sovereign_flag: boolean;
    market_segment: string;
  } | null;
  timeline: CountryTimelineDataset | null;
  countryOverview: CountrySectionDataset | null;
  disaster: CountrySectionDataset | null;
  transactions: CountrySectionDataset | null;
  pricing: CountrySectionDataset | null;
  risk: CountrySectionDataset | null;
  structure: CountrySectionDataset | null;
  investorDistribution: CountrySectionDataset | null;
  investorGeography: CountrySectionDataset | null;
  policyLessons: CountrySectionDataset | null;
  documents: CountrySectionDataset | null;
}

interface CountryIntelligencePageProps {
  data: CountryPageData;
}

export function CountryIntelligencePage({ data }: CountryIntelligencePageProps) {
  const { summary, kpis } = data;
  const overviewRows = data.countryOverview?.rows ?? [];
  const transactionRows = data.transactions?.rows ?? [];
  const summaryLines = extractSummaryLines(overviewRows);
  const israelRelevance = extractIsraelRelevance(data.policyLessons?.rows ?? []);

  return (
    <div className="space-y-6">
      <Link href="/countries" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">
        <ArrowLeft className="h-4 w-4" />
        Back to Countries
      </Link>

      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Country Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{summary.country_name} Catastrophe Bond Program</h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">{summary.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">{summary.region}</span>
          <span className="chip">{kpis?.main_peril ?? summary.main_peril}</span>
          <span className="chip">{kpis?.main_trigger_type ?? summary.trigger_types[0] ?? "Not stated"}</span>
          <span className="chip">{kpis?.sovereign_flag ? "Sovereign" : "Non-Sovereign / Mixed"}</span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Total Deals" value={String(kpis?.total_deals ?? summary.deal_count)} />
        <KpiCard label="Total Issuance" value={formatCurrency(kpis?.total_volume_usd ?? summary.total_volume_usd)} />
        <KpiCard label="Latest Issue Year" value={String(kpis?.latest_issue_year ?? summary.latest_issue_year ?? "N/A")} />
        <KpiCard label="Main Peril" value={kpis?.main_peril ?? summary.main_peril} />
        <KpiCard label="Main Trigger" value={kpis?.main_trigger_type ?? summary.trigger_types[0] ?? "N/A"} />
        <KpiCard label="Market Segment" value={kpis?.market_segment ?? summary.market_segment_summary} />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Executive Summary / Overview</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {summaryLines.length ? (
            summaryLines.map((line) => (
              <p key={line} className="leading-relaxed">
                {line}
              </p>
            ))
          ) : (
            <EmptySectionState />
          )}
        </div>
      </section>

      <DataTableSection title="Disaster Risk Context" dataset={data.disaster} />
      <DataTableSection title="Transaction Table" dataset={data.transactions} />
      <DataTableSection title="Pricing Section" dataset={data.pricing} />
      <DataTableSection title="Risk Parameters Section" dataset={data.risk} />
      <DataTableSection title="Structure & Coverage Section" dataset={data.structure} />
      <DataTableSection title="Investor Distribution Section" dataset={data.investorDistribution} />
      <DataTableSection title="Investor Geography Section" dataset={data.investorGeography} />

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Policy Lessons</h2>
        <PolicyLessonsGrid rows={data.policyLessons?.rows ?? []} />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">What Israel Can Learn</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {israelRelevance.length ? (
            israelRelevance.map((item) => (
              <article key={item} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                {item}
              </article>
            ))
          ) : (
            <article className="rounded-xl border border-dashed border-white/15 bg-slate-900/55 p-4">
              Israel relevance notes will be added soon.
            </article>
          )}
        </div>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Source Documents / Metadata</h2>
        <DocumentCards rows={data.documents?.rows ?? []} />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Country Timeline</h2>
        <TimelineRows rows={data.timeline?.events ?? []} fallbackRows={transactionRows} />
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-semibold text-cyan-100">{value}</p>
    </article>
  );
}

function DataTableSection({ title, dataset }: { title: string; dataset: CountrySectionDataset | null }) {
  return (
    <section className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4">{dataset && dataset.rows.length ? <GenericDataTable rows={dataset.rows} /> : <EmptySectionState />}</div>
    </section>
  );
}

function GenericDataTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="border-b border-white/5 text-slate-100/90">
              {columns.map((column) => (
                <td key={`${rowIndex}-${column}`} className="px-3 py-3 align-top text-slate-300">
                  {formatCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PolicyLessonsGrid({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) {
    return <EmptySectionState />;
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {rows.map((row, index) => (
        <article key={`lesson-${index}`} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
          <p className="text-base font-semibold text-white">{String(row["Key Lesson"] ?? row["Lesson"] ?? "Policy Lesson")}</p>
          {row["Explanation"] ? <p className="mt-2 text-sm text-slate-300">{String(row["Explanation"])}</p> : null}
          {row["Relevance for Sovereign Finance"] ? (
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-100">Sovereign Finance: </span>
              {String(row["Relevance for Sovereign Finance"])}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function DocumentCards({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) {
    return (
      <div className="mt-4">
        <EmptySectionState />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {rows.map((row, index) => (
        <article key={`doc-${index}`} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
          <p className="text-base font-semibold text-white">{String(row["Document Title"] ?? row["Title"] ?? "Document")}</p>
          <p className="mt-1 text-sm text-slate-300">{String(row["Institution / Source"] ?? row["Source"] ?? "Not stated")}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
            {String(row["Document Type"] ?? "Document")} {row["Year of Document"] ? `| ${String(row["Year of Document"])}` : ""}
          </p>
          {row["Main Topic"] ? <p className="mt-2 text-sm text-slate-300">{String(row["Main Topic"])}</p> : null}
          {row["File Name"] ? (
            String(row["File Name"]).startsWith("http") ? (
              <a
                href={String(row["File Name"])}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center rounded-md border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:border-cyan-200/60 hover:bg-cyan-500/20"
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5 text-cyan-200" />
                Open Source
              </a>
            ) : (
              <div className="mt-3 inline-flex items-center rounded-md border border-white/10 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300">
                <ExternalLink className="mr-2 h-3.5 w-3.5 text-cyan-200" />
                {String(row["File Name"])}
              </div>
            )
          ) : null}
        </article>
      ))}
    </div>
  );
}

function TimelineRows({
  rows,
  fallbackRows
}: {
  rows: Array<Record<string, unknown>>;
  fallbackRows: Array<Record<string, unknown>>;
}) {
  const entries = rows.length
    ? rows
    : fallbackRows.map((row) => ({
        deal_name: row["Deal Name"],
        issue_date: row["Issue Date"],
        year: toYear(row["Issue Date"]),
        size_usd: row["Size USD"]
      }));

  if (!entries.length) {
    return (
      <div className="mt-4">
        <EmptySectionState />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {entries.map((entry, index) => (
        <article key={`timeline-${index}`} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{String(entry["deal_name"] ?? "Deal")}</p>
            <p className="inline-flex items-center gap-1 text-xs text-slate-300">
              <Clock3 className="h-3.5 w-3.5" />
              {String(entry["year"] ?? toYear(entry["issue_date"]) ?? "N/A")}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-400">{String(entry["issue_date"] ?? "Date not stated")}</p>
          <p className="mt-2 text-sm text-slate-300">
            {entry["size_usd"] ? `Size: ${formatCurrency(Number(entry["size_usd"]))}` : "Size not stated"}
          </p>
        </article>
      ))}
    </div>
  );
}

function EmptySectionState() {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-slate-900/55 p-4 text-sm text-slate-400">
      Data not available in current dataset.
    </div>
  );
}

function extractSummaryLines(rows: Array<Record<string, unknown>>): string[] {
  const lines = rows
    .map((row) => row["Short Summary"])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const deduped = Array.from(new Set(lines.map((line) => line.trim())));
  return deduped;
}

function extractIsraelRelevance(rows: Array<Record<string, unknown>>): string[] {
  const lines = rows
    .map((row) => row["Possible Relevance for Israel"])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return Array.from(new Set(lines.map((line) => line.trim())));
}

function toYear(value: unknown): number | null {
  if (typeof value === "number") return Math.trunc(value);
  if (typeof value !== "string") return null;
  const m = value.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

function formatCell(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "number") {
    if (Math.abs(value) > 10_000 && Number.isInteger(value)) return value.toLocaleString("en-US");
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
