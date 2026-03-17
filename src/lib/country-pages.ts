import { cache } from "react";

import {
  getCountryKpiBySlug as getCountryKpiFromDataset,
  getCountryPageIndex as getCountryIndexFromDataset,
  getCountryDealsBySlug
} from "@/lib/market-data";
import { slugify } from "@/lib/utils";

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

export const getCountryPageIndexPayload = cache(async (): Promise<CountryPageIndexPayload> => {
  const countries = await getCountryIndexFromDataset();
  return {
    generated_at: "",
    source_root: "data/master/cat_bond_master.csv",
    countries: countries.map((country) => ({
      country_name: country.country_name,
      slug: country.slug,
      folder_name: null,
      region: country.region,
      summary: country.summary,
      available_sections: [
        "country_overview",
        "disaster_context",
        "transaction_details",
        "pricing_details",
        "risk_parameters",
        "structure_coverage",
        "policy_lessons",
        "document_metadata"
      ],
      has_investor_data: false,
      has_investor_geography: false,
      has_policy_lessons: true,
      has_documents: true,
      has_transactions: true,
      deal_count: country.deal_count,
      total_volume_usd: country.total_volume_usd,
      total_volume_musd: country.total_volume_musd,
      latest_issue_year: country.latest_issue_year,
      main_peril: country.main_peril,
      trigger_types: country.trigger_types,
      model_types: country.model_types,
      sovereign_flag: country.sovereign_flag,
      market_segment_summary: country.market_segment_summary,
      destination_url: country.destination_url,
      timeline_count: country.deal_count,
      sovereign_activity_summary: country.sovereign_activity_summary
    }))
  };
});

export const getCountryPageIndex = cache(async (): Promise<CountryPageSummary[]> => {
  const payload = await getCountryPageIndexPayload();
  return payload.countries;
});

export const getCountrySummaryBySlug = cache(async (slug: string): Promise<CountryPageSummary | null> => {
  const entries = await getCountryPageIndex();
  const wanted = slugify(slug);
  return entries.find((entry) => slugify(entry.slug) === wanted) ?? null;
});

export const getCountryKpisBySlug = cache(async (slug: string): Promise<CountryKpisDataset | null> => {
  const kpi = await getCountryKpiFromDataset(slug);
  if (!kpi) return null;
  return {
    country_name: kpi.country_name,
    slug: kpi.slug,
    total_deals: kpi.deal_count,
    total_volume_usd: kpi.total_volume_usd,
    latest_issue_year: kpi.latest_issue_year,
    main_peril: kpi.main_peril,
    main_trigger_type: kpi.trigger_breakdown[0]?.trigger ?? "Not stated",
    sovereign_flag: kpi.sovereign_flag,
    market_segment: kpi.market_segment_breakdown[0]?.segment ?? (kpi.sovereign_flag ? "Sovereign" : "Non-Sovereign")
  };
});

export const getCountryTimelineBySlug = cache(async (slug: string): Promise<CountryTimelineDataset | null> => {
  const summary = await getCountrySummaryBySlug(slug);
  if (!summary) return null;
  const deals = await getCountryDealsBySlug(slug);
  return {
    country: summary.country_name,
    slug: summary.slug,
    count: deals.length,
    events: deals
      .filter((deal) => deal.deal_year != null)
      .sort((a, b) => (a.deal_year ?? 0) - (b.deal_year ?? 0))
      .map((deal) => ({
        deal_name: deal.deal_name ?? "Deal",
        issue_date: deal.issue_date ?? "Not stated",
        year: deal.deal_year,
        size_usd: deal.total_deal_size_usd
      }))
  };
});

export const getCountrySectionBySlug = cache(
  async (_slug: string, _section: CountrySectionKey): Promise<CountrySectionDataset | null> => {
    return null;
  }
);

function buildOverview(summary: CountryPageSummary, kpis: CountryKpisDataset | null): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "country_overview",
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

function buildDisasterContext(summary: CountryPageSummary, deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>): CountrySectionDataset {
  const perilMap = new Map<string, number>();
  for (const deal of deals) {
    for (const peril of deal.peril_tags) {
      perilMap.set(peril, (perilMap.get(peril) ?? 0) + 1);
    }
  }
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "disaster_context",
    row_count: perilMap.size,
    rows: [...perilMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([peril, count]) => ({
        "Peril Category": peril,
        "Deal Count": count,
        "Policy Relevance":
          count > 1
            ? "Repeated peril transfer suggests sustained risk-financing relevance."
            : "Single recorded peril transfer; additional analysis may be required."
      }))
  };
}

function buildTransactionTable(summary: CountryPageSummary, deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "transaction_details",
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
      "Deal Size (USD)": deal.total_deal_size_usd,
      Peril: deal.peril_tags.join("; "),
      Trigger: deal.trigger_type_normalized,
      "Expected Loss (%)": deal.average_expected_loss_percent ?? "Not stated",
      "Spread (bps)": deal.average_final_spread_bps ?? "Not stated",
      "Risk Multiple": deal.average_risk_multiple ?? "Not stated",
      "Primary Source": deal.primary_source_url ?? "Not stated"
    }))
  };
}

function buildPricing(summary: CountryPageSummary, deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "pricing_details",
    row_count: deals.length,
    rows: deals.map((deal) => ({
      "Deal Name": deal.deal_name ?? "Not stated",
      Year: deal.deal_year ?? "Not stated",
      "Deal Size (USD)": deal.total_deal_size_usd,
      "Expected Loss (%)": deal.average_expected_loss_percent ?? "Not stated",
      "Spread (bps)": deal.average_final_spread_bps ?? "Not stated",
      "Risk Multiple": deal.average_risk_multiple ?? "Not stated"
    }))
  };
}

function buildRisk(summary: CountryPageSummary, deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "risk_parameters",
    row_count: deals.length,
    rows: deals.map((deal) => ({
      "Deal Name": deal.deal_name ?? "Not stated",
      "Peril Tags": deal.peril_tags.join("; "),
      "Trigger Type": deal.trigger_type_normalized,
      "Expected Loss (%)": deal.average_expected_loss_percent ?? "Not stated",
      "Triggered Deal": deal.triggered_deal_flag ? "Yes" : "No",
      "Principal Loss (USD)": deal.total_principal_loss_usd
    }))
  };
}

function buildStructure(summary: CountryPageSummary, deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>): CountrySectionDataset {
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "structure_coverage",
    row_count: deals.length,
    rows: deals.map((deal) => ({
      "Deal Name": deal.deal_name ?? "Not stated",
      "Covered Region": deal.covered_region ?? deal.region_normalized ?? "Not stated",
      "Covered Perils": deal.covered_perils ?? deal.peril_tags.join("; "),
      "Trigger Type": deal.trigger_type_normalized,
      "Market Segment": deal.market_segment
    }))
  };
}

function buildPolicyLessons(summary: CountryPageSummary, kpis: CountryKpisDataset | null): CountrySectionDataset {
  const trigger = kpis?.main_trigger_type ?? summary.trigger_types[0] ?? "parametric";
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "policy_lessons",
    row_count: 3,
    rows: [
      {
        "Key Lesson": "Pre-arranged Liquidity",
        Explanation:
          "Deal history indicates the value of ex-ante contingent financing for rapid post-event fiscal response.",
        "Relevance for Sovereign Finance": "Supports budget continuity under severe disaster shocks."
      },
      {
        "Key Lesson": "Trigger Architecture",
        Explanation: `Observed primary trigger structure is ${trigger}, highlighting the importance of transparent payout mechanics.`,
        "Relevance for Sovereign Finance": "Improves predictability of emergency financing disbursement."
      },
      {
        "Key Lesson": "Portfolio Integration",
        Explanation:
          "Country transactions should be assessed alongside reserves, contingent credit, and budgetary buffers.",
        "Relevance for Sovereign Finance": "Strengthens multi-instrument disaster risk financing strategy."
      }
    ]
  };
}

function buildDocuments(summary: CountryPageSummary, deals: Awaited<ReturnType<typeof getCountryDealsBySlug>>): CountrySectionDataset {
  const dedup = new Map<string, Record<string, unknown>>();
  for (const deal of deals) {
    if (!deal.primary_source_url) continue;
    if (dedup.has(deal.primary_source_url)) continue;
    dedup.set(deal.primary_source_url, {
      "Document Title": deal.deal_name ?? "Transaction Source",
      "Institution / Source": deal.sponsor_name ?? "Not stated",
      "Document Type": "Source Link",
      "Year of Document": deal.deal_year ?? "Not stated",
      "Main Topic": deal.covered_perils ?? "Catastrophe bond transaction details",
      "File Name": deal.primary_source_url
    });
  }
  return {
    country: summary.country_name,
    slug: summary.slug,
    source_file: "data/master/cat_bond_master.csv",
    sheet_name: "document_metadata",
    row_count: dedup.size,
    rows: [...dedup.values()]
  };
}

export const getCountryPageDataBySlug = cache(async (slug: string) => {
  const summary = await getCountrySummaryBySlug(slug);
  if (!summary) return null;

  const [kpis, timeline, deals] = await Promise.all([
    getCountryKpisBySlug(slug),
    getCountryTimelineBySlug(slug),
    getCountryDealsBySlug(slug)
  ]);

  return {
    summary,
    kpis,
    timeline,
    countryOverview: buildOverview(summary, kpis),
    disaster: buildDisasterContext(summary, deals),
    transactions: buildTransactionTable(summary, deals),
    pricing: buildPricing(summary, deals),
    risk: buildRisk(summary, deals),
    structure: buildStructure(summary, deals),
    investorDistribution: null,
    investorGeography: null,
    policyLessons: buildPolicyLessons(summary, kpis),
    documents: buildDocuments(summary, deals)
  };
});
