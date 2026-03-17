import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = path.join(process.cwd(), "data");

const PATHS = {
  master: path.join(DATA_ROOT, "master", "cat_bond_master_database.json"),
  globalKpis: path.join(DATA_ROOT, "chart_data", "global_kpis.json"),
  countryGlobePoints: path.join(DATA_ROOT, "countries", "country_globe_points.json"),
  countryPageIndex: path.join(DATA_ROOT, "countries", "country_page_index.json"),
  countryKpis: path.join(DATA_ROOT, "countries", "country_kpis.json"),
  issuanceByYear: path.join(DATA_ROOT, "chart_data", "issuance_by_year.json"),
  perilDistribution: path.join(DATA_ROOT, "chart_data", "peril_distribution.json"),
  triggerDistribution: path.join(DATA_ROOT, "chart_data", "trigger_distribution.json"),
  spreadVsExpectedLoss: path.join(DATA_ROOT, "chart_data", "spread_vs_expected_loss.json"),
  expectedLossDistribution: path.join(DATA_ROOT, "chart_data", "expected_loss_distribution.json"),
  spreadDistribution: path.join(DATA_ROOT, "chart_data", "spread_distribution.json"),
  sovereignVsPrivate: path.join(DATA_ROOT, "chart_data", "sovereign_vs_private.json"),
  topCountries: path.join(DATA_ROOT, "chart_data", "top_countries.json"),
  topSponsors: path.join(DATA_ROOT, "chart_data", "top_sponsors.json"),
  topSovereignCountries: path.join(DATA_ROOT, "chart_data", "top_sovereign_countries.json"),
  topBrokers: path.join(DATA_ROOT, "chart_data", "top_brokers.json"),
  topBookrunners: path.join(DATA_ROOT, "chart_data", "top_bookrunners.json"),
  topPlacementAgents: path.join(DATA_ROOT, "chart_data", "top_placement_agents.json"),
  heatmapYearPeril: path.join(DATA_ROOT, "chart_data", "heatmap_year_peril.json"),
  heatmapYearTrigger: path.join(DATA_ROOT, "chart_data", "heatmap_year_trigger.json"),
  triggeredDealsSummary: path.join(DATA_ROOT, "chart_data", "triggered_deals_summary.json"),
  triggeredLossSummary: path.join(DATA_ROOT, "chart_data", "triggered_loss_summary.json"),
  sovereignDeals: path.join(DATA_ROOT, "sovereign_deals", "sovereign_deals_master.json"),
  privateDeals: path.join(DATA_ROOT, "private_deals", "private_deals_master.json")
};

export interface MasterDealRecord {
  id: string;
  deal_id: string | null;
  deal_name: string | null;
  series_name: string | null;
  announcement_date: string | null;
  pricing_date: string | null;
  issue_date: string | null;
  maturity_date: string | null;
  deal_year: number | null;
  sponsor_name: string | null;
  issuer_name: string | null;
  cedent_name: string | null;
  country_of_sponsor: string | null;
  country_name: string | null;
  country_slug: string | null;
  region_of_sponsor: string | null;
  region_normalized: string;
  sovereign_or_corporate: string | null;
  government_program_flag: boolean;
  sovereign_flag: boolean;
  market_segment: string;
  original_amount_musd?: number | null;
  original_amount_usd?: number | null;
  amount_source?: string;
  total_deal_size_ils_m: number;
  total_deal_size_musd?: number;
  total_deal_size_usd: number;
  program_size_ils_m: number | null;
  covered_perils: string | null;
  peril_tags: string[];
  peril_category?: string;
  covered_region: string | null;
  trigger_type: string | null;
  trigger_type_normalized: string;
  trigger_category?: string;
  expected_loss?: number | null;
  spread?: number | null;
  risk_multiple?: number | null;
  peril_type?: string;
  average_expected_loss_percent: number | null;
  average_final_spread_bps: number | null;
  average_risk_multiple: number | null;
  triggered_deal_flag: boolean;
  total_principal_loss_ils_m: number;
  total_principal_loss_musd?: number;
  total_principal_loss_usd?: number;
  broker_name?: string | null;
  bookrunner_name?: string | null;
  placement_agent_name?: string | null;
  primary_source_url: string | null;
}

export interface MasterDataset {
  generated_at: string;
  source_csv?: string;
  source_root?: string;
  total_records: number;
  deals: MasterDealRecord[];
}

export interface GlobalKpisDataset {
  generated_at: string;
  total_deals: number;
  total_market_volume_musd: number;
  total_market_volume_usd: number;
  sovereign_deal_count: number;
  non_sovereign_deal_count: number;
  countries_covered: number;
  latest_market_year: number | null;
  largest_sovereign_issuer?: string;
  validation?: {
    expected_total_volume_busd_range?: number[];
    actual_total_volume_busd?: number;
    within_expected_range?: boolean;
  };
}

export interface CountryGlobePoint {
  id: string;
  country_name: string;
  slug: string;
  lat: number;
  lng: number;
  sovereign_flag: boolean;
  market_segment: string;
  market_segment_summary?: string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd?: number;
  main_peril: string;
  latest_issue_year: number | null;
  tooltip_title: string;
  tooltip_text: string;
  destination_url: string;
}

export interface CountryPageRecord {
  id: string;
  country_name: string;
  slug: string;
  region: string;
  sovereign_flag: boolean;
  market_segment_summary: string;
  deal_count: number;
  sovereign_deal_count: number;
  non_sovereign_deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
  latest_issue_year: number | null;
  main_peril: string;
  trigger_types: string[];
  model_types: string[];
  sovereign_activity_summary: string;
  summary: string;
  latitude: number | null;
  longitude: number | null;
  destination_url: string;
}

export interface CountryKpiRecord {
  slug: string;
  country_name: string;
  region: string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
  latest_issue_year: number | null;
  main_peril: string;
  sovereign_flag: boolean;
  sovereign_activity_summary: string;
  market_segment_breakdown: Array<{
    segment: string;
    count: number;
  }>;
  trigger_breakdown: Array<{
    trigger: string;
    count: number;
  }>;
  yearly_issuance: Array<{
    year: number;
    count: number;
    total_volume_usd: number;
  }>;
}

export interface CountryKpiDataset {
  generated_at: string;
  countries: CountryKpiRecord[];
}

export interface IssuanceByYearRecord {
  year: number;
  segment?: string;
  segment_key?: "all" | "sovereign" | "non_sovereign" | string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
}

export interface PerilDistributionRecord {
  peril: string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
}

export interface TriggerDistributionRecord {
  trigger_type: string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
}

export interface SpreadVsExpectedLossRecord {
  id: string;
  deal_id: string | null;
  deal_name: string | null;
  country_name: string | null;
  country_slug: string | null;
  sovereign_flag: boolean;
  market_segment: string;
  deal_year: number | null;
  expected_loss_percent: number;
  final_spread_bps: number;
  risk_multiple: number | null;
  total_deal_size_ils_m: number;
}

export interface HistogramBucket {
  bin_start: number;
  bin_end: number;
  count: number;
}

export interface DistributionDataset {
  generated_at: string;
  metric: string;
  source: string;
  bucket_size: number;
  count: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  buckets: HistogramBucket[];
}

export interface SovereignVsPrivateDataset {
  summary_by_sovereign_flag: Array<{
    segment: string;
    sovereign_flag: boolean;
    deal_count: number;
    total_volume_usd: number;
    total_volume_musd: number;
  }>;
  summary_by_market_segment: Array<{
    market_segment: string;
    deal_count: number;
    total_volume_usd: number;
    total_volume_musd: number;
  }>;
  trigger_by_market_segment?: Array<{
    market_segment: string;
    trigger_type: string;
    deal_count: number;
    total_volume_usd: number;
    total_volume_musd: number;
  }>;
  peril_by_market_segment?: Array<{
    market_segment: string;
    peril: string;
    deal_count: number;
    total_volume_usd: number;
    total_volume_musd: number;
  }>;
}

export interface TopCountryRecord {
  rank: number;
  country_name: string;
  country_slug: string;
  deal_count: number;
  sovereign_flag: boolean;
  total_volume_usd: number;
  total_volume_musd: number;
  latest_issue_year: number | null;
}

export interface TopSponsorRecord {
  rank: number;
  sponsor_name: string;
  deal_count: number;
  sovereign_deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
}

export interface TopIntermediaryRow {
  rank: number;
  name: string;
  deal_count: number;
  sovereign_deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
  market_share_percent: number;
}

export interface TopIntermediaryDataset {
  label: string;
  field_used: string | null;
  field_available: boolean;
  rows: TopIntermediaryRow[];
}

export interface HeatmapYearPerilRecord {
  year: number;
  peril: string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
}

export interface HeatmapYearTriggerRecord {
  year: number;
  trigger_type: string;
  deal_count: number;
  total_volume_usd: number;
  total_volume_musd: number;
}

export interface TriggeredLossSummaryDataset {
  generated_at?: string;
  source?: string;
  total_triggered_deals: number;
  total_principal_loss_usd: number;
  total_principal_loss_musd?: number;
  by_year: Array<{
    year: number;
    deal_count: number;
    principal_loss_usd: number;
    principal_loss_musd: number;
  }>;
  by_country: Array<{
    country_name: string;
    deal_count: number;
    principal_loss_usd: number;
    principal_loss_musd: number;
  }>;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  if (!(await pathExists(filePath))) return fallback;
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function readTopIntermediaryDataset(filePath: string, label: string): Promise<TopIntermediaryDataset> {
  const raw = await readJsonFile<unknown>(filePath, { label, field_used: null, field_available: false, rows: [] });
  if (Array.isArray(raw)) {
    return {
      label,
      field_used: null,
      field_available: false,
      rows: raw as TopIntermediaryRow[]
    };
  }

  const obj = raw as Partial<TopIntermediaryDataset>;
  return {
    label: obj.label ?? label,
    field_used: obj.field_used ?? null,
    field_available: Boolean(obj.field_available),
    rows: Array.isArray(obj.rows) ? (obj.rows as TopIntermediaryRow[]) : []
  };
}

export const getMasterDataset = cache(async (): Promise<MasterDataset> => {
  return readJsonFile<MasterDataset>(PATHS.master, {
    generated_at: "",
    source_csv: "",
    total_records: 0,
    deals: []
  });
});

export const getGlobalKpisData = cache(async (): Promise<GlobalKpisDataset> => {
  return readJsonFile<GlobalKpisDataset>(PATHS.globalKpis, {
    generated_at: "",
    total_deals: 0,
    total_market_volume_musd: 0,
    total_market_volume_usd: 0,
    sovereign_deal_count: 0,
    non_sovereign_deal_count: 0,
    countries_covered: 0,
    latest_market_year: null
  });
});

export const getMasterDeals = cache(async (): Promise<MasterDealRecord[]> => {
  const dataset = await getMasterDataset();
  return dataset.deals;
});

export const getCountryGlobePoints = cache(async (): Promise<CountryGlobePoint[]> => {
  return readJsonFile<CountryGlobePoint[]>(PATHS.countryGlobePoints, []);
});

export const getCountryPageIndex = cache(async (): Promise<CountryPageRecord[]> => {
  const raw = await readJsonFile<unknown>(PATHS.countryPageIndex, []);
  if (Array.isArray(raw)) {
    return raw as CountryPageRecord[];
  }

  const wrapped = raw as { countries?: Array<Record<string, unknown>> };
  if (wrapped?.countries && Array.isArray(wrapped.countries)) {
    return wrapped.countries.map((entry) => ({
      id: String(entry.id ?? entry.slug ?? ""),
      country_name: String(entry.country_name ?? ""),
      slug: String(entry.slug ?? ""),
      region: String(entry.region ?? "Not stated"),
      sovereign_flag: Boolean(entry.sovereign_flag),
      market_segment_summary: String(entry.market_segment_summary ?? "Not stated"),
      deal_count: Number(entry.deal_count ?? 0),
      sovereign_deal_count: Number(entry.sovereign_deal_count ?? 0),
      non_sovereign_deal_count: Number(entry.non_sovereign_deal_count ?? 0),
      total_volume_usd: Number(entry.total_volume_usd ?? 0),
      total_volume_musd: Number(entry.total_volume_musd ?? 0),
      latest_issue_year: entry.latest_issue_year ? Number(entry.latest_issue_year) : null,
      main_peril: String(entry.main_peril ?? "Not stated"),
      trigger_types: Array.isArray(entry.trigger_types) ? (entry.trigger_types as string[]) : [],
      model_types: Array.isArray(entry.model_types) ? (entry.model_types as string[]) : [],
      sovereign_activity_summary: String(entry.sovereign_activity_summary ?? ""),
      summary: String(entry.summary ?? ""),
      latitude: entry.latitude == null ? null : Number(entry.latitude),
      longitude: entry.longitude == null ? null : Number(entry.longitude),
      destination_url: String(entry.destination_url ?? `/countries/${String(entry.slug ?? "")}`)
    }));
  }

  return [];
});

export const getCountryKpisDataset = cache(async (): Promise<CountryKpiDataset> => {
  return readJsonFile<CountryKpiDataset>(PATHS.countryKpis, {
    generated_at: "",
    countries: []
  });
});

export const getCountryKpiBySlug = cache(async (slug: string): Promise<CountryKpiRecord | null> => {
  const data = await getCountryKpisDataset();
  return data.countries.find((entry) => entry.slug === slug) ?? null;
});

export const getCountryRecordBySlug = cache(async (slug: string): Promise<CountryPageRecord | null> => {
  const countries = await getCountryPageIndex();
  return countries.find((entry) => entry.slug === slug) ?? null;
});

export const getCountryDealsBySlug = cache(async (slug: string): Promise<MasterDealRecord[]> => {
  const deals = await getMasterDeals();
  return deals
    .filter((deal) => deal.country_slug === slug)
    .sort((a, b) => (b.deal_year ?? 0) - (a.deal_year ?? 0) || b.total_deal_size_usd - a.total_deal_size_usd);
});

export const getIssuanceByYearData = cache(async (): Promise<IssuanceByYearRecord[]> => {
  return readJsonFile<IssuanceByYearRecord[]>(PATHS.issuanceByYear, []);
});

export const getPerilDistributionData = cache(async (): Promise<PerilDistributionRecord[]> => {
  return readJsonFile<PerilDistributionRecord[]>(PATHS.perilDistribution, []);
});

export const getTriggerDistributionData = cache(async (): Promise<TriggerDistributionRecord[]> => {
  return readJsonFile<TriggerDistributionRecord[]>(PATHS.triggerDistribution, []);
});

export const getSpreadVsExpectedLossData = cache(async (): Promise<SpreadVsExpectedLossRecord[]> => {
  return readJsonFile<SpreadVsExpectedLossRecord[]>(PATHS.spreadVsExpectedLoss, []);
});

export const getExpectedLossDistributionData = cache(async (): Promise<DistributionDataset> => {
  return readJsonFile<DistributionDataset>(PATHS.expectedLossDistribution, {
    generated_at: "",
    metric: "average_expected_loss_percent",
    source: "cat_bond_master_database",
    bucket_size: 0.25,
    count: 0,
    min: null,
    max: null,
    mean: null,
    median: null,
    p25: null,
    p75: null,
    buckets: []
  });
});

export const getSpreadDistributionData = cache(async (): Promise<DistributionDataset> => {
  return readJsonFile<DistributionDataset>(PATHS.spreadDistribution, {
    generated_at: "",
    metric: "average_final_spread_bps",
    source: "cat_bond_master_database",
    bucket_size: 50,
    count: 0,
    min: null,
    max: null,
    mean: null,
    median: null,
    p25: null,
    p75: null,
    buckets: []
  });
});

export const getSovereignVsPrivateData = cache(async (): Promise<SovereignVsPrivateDataset> => {
  return readJsonFile<SovereignVsPrivateDataset>(PATHS.sovereignVsPrivate, {
    summary_by_sovereign_flag: [],
    summary_by_market_segment: []
  });
});

export const getTopCountriesData = cache(async (): Promise<TopCountryRecord[]> => {
  return readJsonFile<TopCountryRecord[]>(PATHS.topCountries, []);
});

export const getTopSponsorsData = cache(async (): Promise<TopSponsorRecord[]> => {
  return readJsonFile<TopSponsorRecord[]>(PATHS.topSponsors, []);
});

export const getTopSovereignCountriesData = cache(async (): Promise<TopCountryRecord[]> => {
  return readJsonFile<TopCountryRecord[]>(PATHS.topSovereignCountries, []);
});

export const getTopBrokersData = cache(async (): Promise<TopIntermediaryDataset> => {
  return readTopIntermediaryDataset(PATHS.topBrokers, "Top Brokers");
});

export const getTopBookrunnersData = cache(async (): Promise<TopIntermediaryDataset> => {
  return readTopIntermediaryDataset(PATHS.topBookrunners, "Top Bookrunners");
});

export const getTopPlacementAgentsData = cache(async (): Promise<TopIntermediaryDataset> => {
  return readTopIntermediaryDataset(PATHS.topPlacementAgents, "Top Placement Agents");
});

export const getHeatmapYearPerilData = cache(async (): Promise<HeatmapYearPerilRecord[]> => {
  return readJsonFile<HeatmapYearPerilRecord[]>(PATHS.heatmapYearPeril, []);
});

export const getHeatmapYearTriggerData = cache(async (): Promise<HeatmapYearTriggerRecord[]> => {
  return readJsonFile<HeatmapYearTriggerRecord[]>(PATHS.heatmapYearTrigger, []);
});

export const getTriggeredLossSummaryData = cache(async (): Promise<TriggeredLossSummaryDataset> => {
  const nextVersion = await readJsonFile<TriggeredLossSummaryDataset | null>(PATHS.triggeredDealsSummary, null);
  if (nextVersion) return nextVersion;
  return readJsonFile<TriggeredLossSummaryDataset>(PATHS.triggeredLossSummary, {
    total_triggered_deals: 0,
    total_principal_loss_usd: 0,
    by_year: [],
    by_country: []
  });
});

export const getSovereignDealsDataset = cache(async (): Promise<MasterDataset> => {
  return readJsonFile<MasterDataset>(PATHS.sovereignDeals, {
    generated_at: "",
    source_csv: "",
    total_records: 0,
    deals: []
  });
});

export const getPrivateDealsDataset = cache(async (): Promise<MasterDataset> => {
  return readJsonFile<MasterDataset>(PATHS.privateDeals, {
    generated_at: "",
    source_csv: "",
    total_records: 0,
    deals: []
  });
});
