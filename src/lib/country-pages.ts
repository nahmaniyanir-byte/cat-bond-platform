import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

import { getCountryDealsBySlug } from "@/lib/market-data";
import { slugify } from "@/lib/utils";

const COUNTRIES_ROOT = path.join(process.cwd(), "data", "countries");
const INDEX_PATH = path.join(COUNTRIES_ROOT, "country_page_index.json");
const COUNTRY_KPIS_PATH = path.join(COUNTRIES_ROOT, "country_kpis.json");

export type CountrySectionKey =
  | "country_overview"
  | "disaster_context"
  | "document_metadata"
  | "investor_distribution"
  | "investor_geography"
  | "policy_lessons"
  | "pricing_details"
  | "risk_parameters"
  | "structure_coverage"
  | "transaction_details";

export const SECTION_FILE_MAP: Record<CountrySectionKey, string> = {
  country_overview: "country_overview.json",
  disaster_context: "disaster_context.json",
  document_metadata: "document_metadata.json",
  investor_distribution: "investor_distribution.json",
  investor_geography: "investor_geography.json",
  policy_lessons: "policy_lessons.json",
  pricing_details: "pricing_details.json",
  risk_parameters: "risk_parameters.json",
  structure_coverage: "structure_coverage.json",
  transaction_details: "transaction_details.json"
};

export interface CountrySectionDataset {
  country: string;
  slug: string;
  source_file: string;
  sheet_name: string;
  row_count: number;
  rows: Array<Record<string, unknown>>;
}

export interface CountryTimelineDataset {
  country: string;
  slug: string;
  count: number;
  events: Array<Record<string, unknown>>;
}

export interface CountryKpisDataset {
  country_name: string;
  slug: string;
  total_deals: number;
  total_volume_usd: number;
  latest_issue_year: number | null;
  main_peril: string;
  main_trigger_type: string;
  sovereign_flag: boolean;
  market_segment: string;
}

export interface CountryPageSummary {
  country_name: string;
  slug: string;
  folder_name: string | null;
  region: string;
  summary: string;
  available_sections: string[];
  has_investor_data: boolean;
  has_investor_geography: boolean;
  has_policy_lessons: boolean;
  has_documents: boolean;
  has_transactions: boolean;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
  latest_issue_year: number | null;
  main_peril: string;
  trigger_types: string[];
  model_types: string[];
  sovereign_flag: boolean;
  market_segment_summary: string;
  destination_url: string;
  timeline_count: number;
  sovereign_activity_summary?: string;
}

export interface CountryPageIndexPayload {
  generated_at: string;
  source_root: string;
  countries: CountryPageSummary[];
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  if (!(await pathExists(filePath))) return fallback;
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function resolveCountryFolder(slug: string): Promise<string | null> {
  const entries = await fs.readdir(COUNTRIES_ROOT, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const wanted = slugify(slug);
  const matched = dirs.find((dir) => slugify(dir) === wanted);
  return matched ?? null;
}

export const getCountryPageIndexPayload = cache(async (): Promise<CountryPageIndexPayload> => {
  return readJson<CountryPageIndexPayload>(INDEX_PATH, {
    generated_at: "",
    source_root: COUNTRIES_ROOT,
    countries: []
  });
});

export const getCountryPageIndex = cache(async (): Promise<CountryPageSummary[]> => {
  const payload = await getCountryPageIndexPayload();
  return payload.countries.map((entry) => ({
    ...entry,
    folder_name: entry.folder_name ?? null
  }));
});

export const getCountrySummaryBySlug = cache(async (slug: string): Promise<CountryPageSummary | null> => {
  const all = await getCountryPageIndex();
  const wanted = slugify(slug);
  return all.find((entry) => slugify(entry.slug) === wanted) ?? null;
});

export const getCountryKpisBySlug = cache(async (slug: string): Promise<CountryKpisDataset | null> => {
  const summary = await getCountrySummaryBySlug(slug);
  const folderName = summary?.folder_name ?? (await resolveCountryFolder(slug));
  if (folderName) {
    const filePath = path.join(COUNTRIES_ROOT, folderName, "json", "country_kpis.json");
    const local = await readJson<CountryKpisDataset | null>(filePath, null);
    if (local) return local;
  }

  const globalKpis = await readJson<{ generated_at?: string; countries?: Array<Record<string, unknown>> }>(
    COUNTRY_KPIS_PATH,
    { countries: [] }
  );
  const wanted = slugify(slug);
  const found = (globalKpis.countries ?? []).find((entry) => slugify(String(entry.slug ?? "")) === wanted);
  if (!found) return null;

  return {
    country_name: String(found.country_name ?? summary?.country_name ?? slug),
    slug: String(found.slug ?? slug),
    total_deals: Number(found.deal_count ?? 0),
    total_volume_usd: Number(found.total_volume_usd ?? 0),
    latest_issue_year: found.latest_issue_year == null ? null : Number(found.latest_issue_year),
    main_peril: String(found.main_peril ?? "Not stated"),
    main_trigger_type:
      Array.isArray(found.trigger_breakdown) && found.trigger_breakdown[0]
        ? String((found.trigger_breakdown[0] as Record<string, unknown>).trigger ?? "Not stated")
        : "Not stated",
    sovereign_flag: Boolean(found.sovereign_flag),
    market_segment: Boolean(found.sovereign_flag) ? "Sovereign" : "Non-Sovereign"
  };
});

export const getCountryTimelineBySlug = cache(async (slug: string): Promise<CountryTimelineDataset | null> => {
  const summary = await getCountrySummaryBySlug(slug);
  const folderName = summary?.folder_name ?? (await resolveCountryFolder(slug));
  if (!folderName) return null;
  const filePath = path.join(COUNTRIES_ROOT, folderName, "json", "timeline.json");
  return readJson<CountryTimelineDataset | null>(filePath, null);
});

export const getCountrySectionBySlug = cache(
  async (slug: string, section: CountrySectionKey): Promise<CountrySectionDataset | null> => {
    const summary = await getCountrySummaryBySlug(slug);
    const folderName = summary?.folder_name ?? (await resolveCountryFolder(slug));
    if (!folderName) return null;
    const filePath = path.join(COUNTRIES_ROOT, folderName, "json", SECTION_FILE_MAP[section]);
    return readJson<CountrySectionDataset | null>(filePath, null);
  }
);

function buildTransactionsFromMaster(
  summary: CountryPageSummary,
  deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>
): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "cat_bond_master_database.json",
    sheet_name: "master_deals",
    row_count: deals.length,
    rows: deals.map((deal) => ({
      "Deal ID": deal.deal_id ?? deal.id,
      "Deal Name": deal.deal_name ?? "Not stated",
      "Series Name": deal.series_name ?? "Not stated",
      Sponsor: deal.sponsor_name ?? "Not stated",
      Issuer: deal.issuer_name ?? "Not stated",
      "Issue Date": deal.issue_date ?? "Not stated",
      "Maturity Date": deal.maturity_date ?? "Not stated",
      Year: deal.deal_year ?? "Not stated",
      Peril: deal.peril_type ?? deal.covered_perils ?? deal.peril_tags.join("; "),
      Trigger: deal.trigger_type_normalized ?? deal.trigger_type ?? "Not stated",
      "Market Segment": deal.market_segment,
      "Sovereign Flag": deal.sovereign_flag ? "Yes" : "No",
      "Original Amount (USD m)": deal.original_amount_musd ?? "Not stated",
      "Original Amount (USD)": deal.original_amount_usd ?? deal.total_deal_size_usd,
      "Expected Loss (%)": deal.expected_loss ?? deal.average_expected_loss_percent ?? "Not stated",
      "Spread (bps)": deal.spread ?? deal.average_final_spread_bps ?? "Not stated",
      "Risk Multiple": deal.risk_multiple ?? deal.average_risk_multiple ?? "Not stated",
      "Primary Source": deal.primary_source_url ?? "Not stated"
    }))
  };
}

function buildOverviewFromSummary(summary: CountryPageSummary, kpis: CountryKpisDataset | null): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "country_page_index.json",
    sheet_name: "derived_overview",
    row_count: 1,
    rows: [
      {
        Country: summary.country_name,
        Region: summary.region,
        "Short Summary": summary.summary,
        "Main Peril": kpis?.main_peril ?? summary.main_peril,
        "Trigger Type": kpis?.main_trigger_type ?? summary.trigger_types[0] ?? "Not stated",
        "Market Segment": kpis?.market_segment ?? summary.market_segment_summary,
        "Latest Issue Year": kpis?.latest_issue_year ?? summary.latest_issue_year ?? "Not stated",
        "Total Deals": kpis?.total_deals ?? summary.deal_count,
        "Total Volume USD": kpis?.total_volume_usd ?? summary.total_volume_usd
      }
    ]
  };
}

function buildPricingFromMaster(
  summary: CountryPageSummary,
  deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>
): CountrySectionDataset {
  const rows = deals
    .filter((deal) => deal.average_expected_loss_percent != null || deal.average_final_spread_bps != null)
    .map((deal) => ({
      "Deal Name": deal.deal_name ?? "Not stated",
      "Issue Year": deal.deal_year ?? "Not stated",
      "Expected Loss (%)": deal.expected_loss ?? deal.average_expected_loss_percent ?? "Not stated",
      "Spread (bps)": deal.spread ?? deal.average_final_spread_bps ?? "Not stated",
      "Risk Multiple": deal.risk_multiple ?? deal.average_risk_multiple ?? "Not stated",
      "Original Amount (USD m)": deal.original_amount_musd ?? "Not stated",
      "Original Amount (USD)": deal.original_amount_usd ?? deal.total_deal_size_usd
    }));

  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "cat_bond_master_database.json",
    sheet_name: "derived_pricing",
    row_count: rows.length,
    rows
  };
}

function buildRiskFromMaster(
  summary: CountryPageSummary,
  deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>
): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "cat_bond_master_database.json",
    sheet_name: "derived_risk_parameters",
    row_count: deals.length,
    rows: deals.map((deal) => ({
      "Deal Name": deal.deal_name ?? "Not stated",
      "Trigger Type": deal.trigger_type_normalized ?? deal.trigger_type ?? "Not stated",
      "Peril Tags": deal.peril_tags.join("; "),
      "Expected Loss (%)": deal.average_expected_loss_percent ?? "Not stated",
      "Risk Multiple": deal.average_risk_multiple ?? "Not stated",
      "Triggered Flag": deal.triggered_deal_flag ? "Yes" : "No",
      "Principal Loss USD": deal.total_principal_loss_usd ?? deal.total_principal_loss_ils_m * 1_000_000
    }))
  };
}

function buildStructureFromMaster(
  summary: CountryPageSummary,
  deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>
): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "cat_bond_master_database.json",
    sheet_name: "derived_structure",
    row_count: deals.length,
    rows: deals.map((deal) => ({
      "Deal Name": deal.deal_name ?? "Not stated",
      "Covered Region": deal.covered_region ?? deal.region_normalized ?? "Not stated",
      "Covered Perils": deal.covered_perils ?? deal.peril_tags.join("; "),
      "Trigger Type": deal.trigger_type_normalized ?? deal.trigger_type ?? "Not stated",
      "Sponsor Type": deal.market_segment,
      "Program Size (ILS m)": deal.program_size_ils_m ?? "Not stated"
    }))
  };
}

function buildDocumentsFromMaster(
  summary: CountryPageSummary,
  deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>
): CountrySectionDataset {
  const rows = deals
    .filter((deal) => deal.primary_source_url)
    .map((deal) => ({
      "Document Title": deal.deal_name ?? "Transaction Source",
      "Institution / Source": deal.sponsor_name ?? deal.issuer_name ?? "Not stated",
      "Document Type": "Source Link",
      "Year of Document": deal.deal_year ?? "Not stated",
      "Main Topic": deal.covered_perils ?? "Catastrophe bond transaction details",
      "File Name": deal.primary_source_url
    }));

  const dedupedRows = Array.from(
    rows.reduce((map, row) => {
      const key = String(row["File Name"]);
      if (!map.has(key)) map.set(key, row);
      return map;
    }, new Map<string, Record<string, unknown>>()).values()
  );

  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "cat_bond_master_database.json",
    sheet_name: "derived_documents",
    row_count: dedupedRows.length,
    rows: dedupedRows
  };
}

export const getCountryPageDataBySlug = cache(async (slug: string) => {
  const summary = await getCountrySummaryBySlug(slug);
  if (!summary) return null;

  const [kpis, timeline, countryOverviewLocal, disaster, transactionsLocal, pricingLocal, riskLocal, structureLocal, investorDistribution, investorGeography, policyLessons, documentsLocal, masterDeals] =
    await Promise.all([
      getCountryKpisBySlug(slug),
      getCountryTimelineBySlug(slug),
      getCountrySectionBySlug(slug, "country_overview"),
      getCountrySectionBySlug(slug, "disaster_context"),
      getCountrySectionBySlug(slug, "transaction_details"),
      getCountrySectionBySlug(slug, "pricing_details"),
      getCountrySectionBySlug(slug, "risk_parameters"),
      getCountrySectionBySlug(slug, "structure_coverage"),
      getCountrySectionBySlug(slug, "investor_distribution"),
      getCountrySectionBySlug(slug, "investor_geography"),
      getCountrySectionBySlug(slug, "policy_lessons"),
      getCountrySectionBySlug(slug, "document_metadata"),
      getCountryDealsBySlug(slug)
    ]);

  const transactions = buildTransactionsFromMaster(summary, masterDeals);
  const countryOverview = buildOverviewFromSummary(summary, kpis);
  const pricing = buildPricingFromMaster(summary, masterDeals);
  const risk = buildRiskFromMaster(summary, masterDeals);
  const structure = buildStructureFromMaster(summary, masterDeals);
  const documents = buildDocumentsFromMaster(summary, masterDeals);

  return {
    summary,
    kpis,
    timeline,
    countryOverview,
    disaster,
    transactions,
    pricing,
    risk,
    structure,
    investorDistribution,
    investorGeography,
    policyLessons,
    documents
  };
});
