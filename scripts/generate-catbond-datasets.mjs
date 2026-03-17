#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_ROOT = path.join(ROOT, "data");
const MASTER_CSV_PATH = path.join(DATA_ROOT, "master", "cat_bond_master.csv");
const COUNTRY_COORDINATES_PATH = path.join(DATA_ROOT, "countries", "country_coordinates.json");
const HOME_KPIS_PATH = path.join(ROOT, "content", "home", "kpis.json");

const UNKNOWN_LABELS = new Set([
  "",
  "unknown",
  "not stated",
  "n/a",
  "na",
  "null",
  "none",
  "missing"
]);

const COUNTRY_ALIAS = new Map([
  ["usa", "United States"],
  ["us", "United States"],
  ["united states of america", "United States"],
  ["uk", "United Kingdom"],
  ["u.k.", "United Kingdom"],
  ["uae", "United Arab Emirates"],
  ["korea", "South Korea"],
  ["republic of korea", "South Korea"]
]);

const REGION_NORMALIZATION = new Map([
  ["apac", "Asia-Pacific"],
  ["asia pacific", "Asia-Pacific"],
  ["asia", "Asia"],
  ["north america", "North America"],
  ["latin america", "Latin America"],
  ["caribbean", "Caribbean"],
  ["europe", "Europe"],
  ["europe / middle east", "Europe / Middle East"],
  ["middle east", "Middle East"],
  ["global", "Global"],
  ["africa", "Africa"]
]);

const SOVEREIGN_POSITIVE = [
  /\brepublic\b/i,
  /\bgovernment\b/i,
  /\bministry\b/i,
  /\btreasury\b/i,
  /fonden/i,
  /agroasemex/i,
  /pacific alliance/i,
  /\bccrif\b/i,
  /caribbean catastrophe risk insurance facility/i,
  /world bank/i,
  /\bsovereign\b/i
];

const SOVEREIGN_NEGATIVE = [
  /allstate/i,
  /state farm/i,
  /mutual/i,
  /insurance exchange/i,
  /insurer/i,
  /reinsurance/i,
  /markel/i,
  /gryphon/i,
  /tower hill/i,
  /liberty mutual/i
];

const OUTPUT_PATHS = {
  masterDatabase: path.join(DATA_ROOT, "master", "cat_bond_master_database.json"),
  masterGlobalKpis: path.join(DATA_ROOT, "master", "global_kpis.json"),
  chartGlobalKpis: path.join(DATA_ROOT, "chart_data", "global_kpis.json"),
  dataAuditSummary: path.join(DATA_ROOT, "master", "data_audit_summary.json"),
  dedupAudit: path.join(DATA_ROOT, "master", "dedup_audit.json"),
  sovereignDeals: path.join(DATA_ROOT, "sovereign_deals", "sovereign_deals_master.json"),
  privateDeals: path.join(DATA_ROOT, "private_deals", "private_deals_master.json"),
  issuanceByYear: path.join(DATA_ROOT, "chart_data", "issuance_by_year.json"),
  perilDistribution: path.join(DATA_ROOT, "chart_data", "peril_distribution.json"),
  triggerDistribution: path.join(DATA_ROOT, "chart_data", "trigger_distribution.json"),
  spreadVsExpectedLoss: path.join(DATA_ROOT, "chart_data", "spread_vs_expected_loss.json"),
  sovereignVsPrivate: path.join(DATA_ROOT, "chart_data", "sovereign_vs_private.json"),
  topCountries: path.join(DATA_ROOT, "chart_data", "top_countries.json"),
  topSovereignCountries: path.join(DATA_ROOT, "chart_data", "top_sovereign_countries.json"),
  topSponsors: path.join(DATA_ROOT, "chart_data", "top_sponsors.json"),
  topBrokers: path.join(DATA_ROOT, "chart_data", "top_brokers.json"),
  topBookrunners: path.join(DATA_ROOT, "chart_data", "top_bookrunners.json"),
  topPlacementAgents: path.join(DATA_ROOT, "chart_data", "top_placement_agents.json"),
  heatmapYearPeril: path.join(DATA_ROOT, "chart_data", "heatmap_year_peril.json"),
  heatmapYearTrigger: path.join(DATA_ROOT, "chart_data", "heatmap_year_trigger.json"),
  expectedLossDistribution: path.join(DATA_ROOT, "chart_data", "expected_loss_distribution.json"),
  spreadDistribution: path.join(DATA_ROOT, "chart_data", "spread_distribution.json"),
  triggeredDealsSummary: path.join(DATA_ROOT, "chart_data", "triggered_deals_summary.json"),
  triggeredLossSummary: path.join(DATA_ROOT, "chart_data", "triggered_loss_summary.json"),
  pricingIntelligence: path.join(DATA_ROOT, "chart_data", "pricing_intelligence.json"),
  sovereignDashboard: path.join(DATA_ROOT, "chart_data", "sovereign_dashboard.json"),
  riskGapSummary: path.join(DATA_ROOT, "chart_data", "risk_gap_summary.json"),
  countryPageIndex: path.join(DATA_ROOT, "countries", "country_page_index.json"),
  countryKpis: path.join(DATA_ROOT, "countries", "country_kpis.json"),
  countryGlobePoints: path.join(DATA_ROOT, "countries", "country_globe_points.json"),
  globeCountrySummary: path.join(DATA_ROOT, "countries", "globe_country_summary.json"),
  homeKpis: HOME_KPIS_PATH
};

await main();

async function main() {
  const timestamp = new Date().toISOString();
  const csvText = await fs.readFile(MASTER_CSV_PATH, "utf8");
  const rawRows = parseCsvToObjects(csvText);
  const coordinates = await readCountryCoordinates();

  const dedup = deduplicateRows(rawRows, coordinates);
  const deals = dedup.deals.sort(
    (a, b) =>
      (b.deal_year ?? Number.NEGATIVE_INFINITY) - (a.deal_year ?? Number.NEGATIVE_INFINITY) ||
      b.deal_size_usd - a.deal_size_usd ||
      String(a.deal_name ?? "").localeCompare(String(b.deal_name ?? ""))
  );

  const globalKpis = buildGlobalKpis(deals, timestamp);
  const chartDatasets = buildChartDatasets(deals, globalKpis, timestamp);
  const countryDatasets = buildCountryDatasets(deals, coordinates, timestamp);
  const sovereignDeals = deals.filter((deal) => deal.sovereign_flag);
  const privateDeals = deals.filter((deal) => !deal.sovereign_flag);
  const dataAudit = buildDataAuditSummary(rawRows.length, dedup, globalKpis, timestamp);

  await writeJson(OUTPUT_PATHS.masterDatabase, {
    generated_at: timestamp,
    source_csv: "data/master/cat_bond_master.csv",
    source_root: "data/master",
    total_records: deals.length,
    raw_rows_before_dedup: rawRows.length,
    removed_duplicates: dedup.duplicatesRemoved,
    deals
  });

  await writeJson(OUTPUT_PATHS.masterGlobalKpis, globalKpis);
  await writeJson(OUTPUT_PATHS.chartGlobalKpis, globalKpis);
  await writeJson(OUTPUT_PATHS.dataAuditSummary, dataAudit);
  await writeJson(OUTPUT_PATHS.dedupAudit, {
    generated_at: timestamp,
    source_csv: "data/master/cat_bond_master.csv",
    raw_rows: rawRows.length,
    deduplicated_rows: deals.length,
    duplicates_removed: dedup.duplicatesRemoved,
    duplicates_by_deal_id: dedup.duplicatesByDealId,
    duplicates_by_fallback_key: dedup.duplicatesByFallbackKey,
    missing_deal_id_rows: dedup.missingDealIdRows,
    deduplication_key: "deal_id (fallback: hash(deal_name|issue_year|sponsor))",
    tranche_handling: "Dataset is treated as deal-level records. No tranche-size fields are used in totals."
  });

  await writeJson(OUTPUT_PATHS.sovereignDeals, {
    generated_at: timestamp,
    source_csv: "data/master/cat_bond_master.csv",
    total_records: sovereignDeals.length,
    deals: sovereignDeals
  });
  await writeJson(OUTPUT_PATHS.privateDeals, {
    generated_at: timestamp,
    source_csv: "data/master/cat_bond_master.csv",
    total_records: privateDeals.length,
    deals: privateDeals
  });

  await writeJson(OUTPUT_PATHS.issuanceByYear, chartDatasets.issuanceByYear);
  await writeJson(OUTPUT_PATHS.perilDistribution, chartDatasets.perilDistribution);
  await writeJson(OUTPUT_PATHS.triggerDistribution, chartDatasets.triggerDistribution);
  await writeJson(OUTPUT_PATHS.spreadVsExpectedLoss, chartDatasets.spreadVsExpectedLoss);
  await writeJson(OUTPUT_PATHS.sovereignVsPrivate, chartDatasets.sovereignVsPrivate);
  await writeJson(OUTPUT_PATHS.topCountries, chartDatasets.topCountries);
  await writeJson(OUTPUT_PATHS.topSovereignCountries, chartDatasets.topSovereignCountries);
  await writeJson(OUTPUT_PATHS.topSponsors, chartDatasets.topSponsors);
  await writeJson(OUTPUT_PATHS.topBrokers, chartDatasets.topBrokers);
  await writeJson(OUTPUT_PATHS.topBookrunners, chartDatasets.topBookrunners);
  await writeJson(OUTPUT_PATHS.topPlacementAgents, chartDatasets.topPlacementAgents);
  await writeJson(OUTPUT_PATHS.heatmapYearPeril, chartDatasets.heatmapYearPeril);
  await writeJson(OUTPUT_PATHS.heatmapYearTrigger, chartDatasets.heatmapYearTrigger);
  await writeJson(OUTPUT_PATHS.expectedLossDistribution, chartDatasets.expectedLossDistribution);
  await writeJson(OUTPUT_PATHS.spreadDistribution, chartDatasets.spreadDistribution);
  await writeJson(OUTPUT_PATHS.triggeredDealsSummary, chartDatasets.triggeredDealsSummary);
  await writeJson(OUTPUT_PATHS.triggeredLossSummary, chartDatasets.triggeredDealsSummary);
  await writeJson(OUTPUT_PATHS.pricingIntelligence, chartDatasets.pricingIntelligence);
  await writeJson(OUTPUT_PATHS.sovereignDashboard, chartDatasets.sovereignDashboard);
  await writeJson(OUTPUT_PATHS.riskGapSummary, chartDatasets.riskGapSummary);

  await writeJson(OUTPUT_PATHS.countryPageIndex, {
    generated_at: timestamp,
    source_csv: "data/master/cat_bond_master.csv",
    countries: countryDatasets.countryPageIndex
  });
  await writeJson(OUTPUT_PATHS.countryKpis, {
    generated_at: timestamp,
    source_csv: "data/master/cat_bond_master.csv",
    countries: countryDatasets.countryKpis
  });
  await writeJson(OUTPUT_PATHS.countryGlobePoints, countryDatasets.countryGlobePoints);
  await writeJson(OUTPUT_PATHS.globeCountrySummary, countryDatasets.countryGlobePoints);

  await writeJson(OUTPUT_PATHS.homeKpis, buildHomeKpiContent(globalKpis));

  console.log(
    [
      `Generated datasets from data/master/cat_bond_master.csv`,
      `Raw rows: ${rawRows.length}`,
      `Unique deal rows: ${deals.length}`,
      `Duplicates removed: ${dedup.duplicatesRemoved}`,
      `Cumulative issuance: $${(globalKpis.cumulative_issuance_usd / 1_000_000_000).toFixed(3)}B`
    ].join("\n")
  );
}

function parseCsvToObjects(text) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((header) => String(header ?? "").trim());
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = (row[index] ?? "").trim();
    });
    return obj;
  });
}

function deduplicateRows(rawRows, coordinates) {
  const map = new Map();
  let duplicatesRemoved = 0;
  let duplicatesByDealId = 0;
  let duplicatesByFallbackKey = 0;
  let missingDealIdRows = 0;

  for (const raw of rawRows) {
    const normalized = normalizeDeal(raw, coordinates);
    if (!normalized.deal_id_raw) missingDealIdRows += 1;

    const key = normalized.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalized);
      continue;
    }

    duplicatesRemoved += 1;
    if (normalized.deal_id_raw) {
      duplicatesByDealId += 1;
    } else {
      duplicatesByFallbackKey += 1;
    }

    if (normalized._quality_score > existing._quality_score) {
      map.set(key, normalized);
    }
  }

  const deals = [...map.values()].map((entry) => {
    const { _quality_score, deal_id_raw, ...deal } = entry;
    return deal;
  });

  return {
    deals,
    duplicatesRemoved,
    duplicatesByDealId,
    duplicatesByFallbackKey,
    missingDealIdRows
  };
}

function normalizeDeal(raw, coordinates) {
  const dealName = cleanText(raw.deal_name);
  const sponsor = cleanText(raw.sponsor);
  const issueYear = deriveYear(raw);
  const dealIdRaw = cleanText(raw.deal_id);
  const fallbackSeed = `${dealName ?? ""}|${issueYear ?? ""}|${sponsor ?? ""}`;
  const fallbackId = `HASH-${hashShort(fallbackSeed)}`;
  const id = dealIdRaw ?? fallbackId;

  const countryName = normalizeCountry(cleanText(raw.country));
  const countrySlug = countryName ? slugify(countryName) : null;
  const regionNormalized = normalizeRegion(cleanText(raw.region), countryName, coordinates);
  const sovereignFlag = inferSovereignFlag(raw);
  const marketSegment = sovereignFlag ? "Sovereign" : inferMarketSegment(raw);
  const dealSizeUsd = Math.max(0, parseNumber(raw.deal_size_usd) ?? 0);
  const expectedLoss = parseNumber(raw.expected_loss);
  const spread = parseNumber(raw.spread);
  const riskMultiple = parseNumber(raw.risk_multiple);
  const perilTags = extractPerilTags(cleanText(raw.covered_perils));
  const perilType = perilTags[0] ?? "Other";
  const triggerType = normalizeTriggerType(cleanText(raw.trigger_type));
  const principalLossUsd = Math.max(0, parseNumber(raw.total_principal_loss_usd) ?? 0);

  const normalized = {
    id,
    deal_id_raw: dealIdRaw,
    deal_id: id,
    dedup_key: id,
    deal_name: dealName,
    series_name: cleanText(raw.series_name),
    status: cleanText(raw.status),
    announcement_date: normalizeDate(cleanText(raw.announcement_date)),
    pricing_date: normalizeDate(cleanText(raw.pricing_date)),
    issue_date: normalizeDate(cleanText(raw.issue_date)),
    maturity_date: normalizeDate(cleanText(raw.maturity_date)),
    deal_year: issueYear,
    sponsor_name: sponsor,
    issuer_name: cleanText(raw.issuer),
    cedent_name: cleanText(raw.cedent),
    country_of_sponsor: countryName,
    country_name: countryName,
    country_slug: countrySlug,
    region_of_sponsor: regionNormalized,
    region_normalized: regionNormalized,
    sovereign_or_corporate: cleanText(raw.sovereign_or_corporate),
    government_program_flag: parseBoolean(raw.government_program_flag),
    sovereign_flag: sovereignFlag,
    market_segment: marketSegment,
    deal_size_usd: dealSizeUsd,
    original_amount_usd: dealSizeUsd,
    original_amount_musd: roundNumber(dealSizeUsd / 1_000_000, 6),
    amount_source: "deal_size_usd",
    total_deal_size_usd: dealSizeUsd,
    total_deal_size_musd: roundNumber(dealSizeUsd / 1_000_000, 6),
    total_deal_size_ils_m: roundNumber(dealSizeUsd / 1_000_000, 6),
    program_size_ils_m: null,
    covered_perils: cleanText(raw.covered_perils),
    peril_tags: perilTags,
    peril_type: perilType,
    peril_category: perilType,
    covered_region: cleanText(raw.covered_region),
    trigger_type: triggerType,
    trigger_type_normalized: triggerType,
    trigger_category: triggerType,
    expected_loss: expectedLoss,
    average_expected_loss_percent: expectedLoss,
    spread,
    average_final_spread_bps: spread,
    risk_multiple: riskMultiple,
    average_risk_multiple: riskMultiple,
    tranche_count: parseInteger(raw.tranche_count) ?? 1,
    triggered_deal_flag: parseBoolean(raw.triggered_deal_flag),
    total_principal_loss_usd: principalLossUsd,
    total_principal_loss_musd: roundNumber(principalLossUsd / 1_000_000, 6),
    total_principal_loss_ils_m: roundNumber(principalLossUsd / 1_000_000, 6),
    primary_source_url: cleanText(raw.primary_source_url),
    extraction_status: cleanText(raw.extraction_status),
    data_quality_score: parseNumber(raw.data_quality_score),
    bookrunner_name: cleanText(raw.bookrunner),
    broker_name: cleanText(raw.broker),
    placement_agent_name: cleanText(raw.placement_agent)
  };

  return {
    ...normalized,
    _quality_score: qualityScore(normalized)
  };
}

function qualityScore(deal) {
  const keys = [
    "deal_name",
    "series_name",
    "sponsor_name",
    "issuer_name",
    "country_name",
    "region_normalized",
    "covered_perils",
    "trigger_type_normalized",
    "issue_date",
    "maturity_date",
    "primary_source_url"
  ];
  let score = 0;
  for (const key of keys) {
    if (deal[key]) score += 1;
  }
  if (deal.deal_year != null) score += 1;
  if (deal.deal_size_usd > 0) score += 2;
  if (deal.average_expected_loss_percent != null) score += 1;
  if (deal.average_final_spread_bps != null) score += 1;
  if (deal.average_risk_multiple != null) score += 1;
  return score;
}

function buildGlobalKpis(deals, timestamp) {
  const totalDeals = deals.length;
  const cumulativeIssuanceUsd = sum(deals, (deal) => deal.deal_size_usd);
  const cumulativeIssuanceMusd = cumulativeIssuanceUsd / 1_000_000;
  const sovereignDeals = deals.filter((deal) => deal.sovereign_flag);
  const nonSovereignDeals = deals.filter((deal) => !deal.sovereign_flag);
  const countriesCovered = new Set(
    deals.map((deal) => deal.country_of_sponsor).filter((country) => country && !UNKNOWN_LABELS.has(country.toLowerCase()))
  ).size;
  const latestMarketYear = maxNumber(deals.map((deal) => deal.deal_year));

  const sovereignSponsorVolume = aggregateByString(
    sovereignDeals,
    (deal) => deal.sponsor_name ?? "Unknown Sponsor",
    (deal) => deal.deal_size_usd
  );
  const largestSovereignIssuer = [...sovereignSponsorVolume.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const actualBusd = cumulativeIssuanceUsd / 1_000_000_000;
  const expectedRange = [180, 220];
  const withinExpectedRange = actualBusd >= expectedRange[0] && actualBusd <= expectedRange[1];

  return {
    generated_at: timestamp,
    source_dataset: "data/master/cat_bond_master.csv",
    definitions: {
      total_deals: "COUNT(DISTINCT deal_id)",
      cumulative_issuance: "SUM(deal_size_usd)",
      sovereign_deal_count: "COUNT(deal_id WHERE sovereign_flag = TRUE)",
      non_sovereign_deal_count: "COUNT(deal_id WHERE sovereign_flag = FALSE)",
      countries_covered: "COUNT(DISTINCT country_of_sponsor)",
      latest_market_year: "MAX(issue_year)"
    },
    total_deals: totalDeals,
    deal_count: totalDeals,
    cumulative_issuance_musd: roundNumber(cumulativeIssuanceMusd, 6),
    cumulative_issuance_usd: roundNumber(cumulativeIssuanceUsd, 2),
    total_market_volume_musd: roundNumber(cumulativeIssuanceMusd, 6),
    total_market_volume_usd: roundNumber(cumulativeIssuanceUsd, 2),
    sovereign_deal_count: sovereignDeals.length,
    non_sovereign_deal_count: nonSovereignDeals.length,
    countries_covered: countriesCovered,
    latest_market_year: latestMarketYear,
    largest_sovereign_issuer: largestSovereignIssuer,
    outstanding_market_size_note: "Outstanding market size not available in current dataset",
    triggered_deal_coverage_note:
      deals.some((deal) => deal.triggered_deal_flag) || deals.some((deal) => deal.total_principal_loss_usd > 0)
        ? null
        : "Triggered deal coverage incomplete",
    validation: {
      expected_total_volume_busd_range: expectedRange,
      actual_total_volume_busd: roundNumber(actualBusd, 3),
      within_expected_range: withinExpectedRange
    }
  };
}
function buildChartDatasets(deals, globalKpis, timestamp) {
  const issuanceByYear = buildIssuanceByYear(deals);
  const perilDistribution = aggregateDimension(deals, (deal) => deal.peril_type ?? "Other", "peril");
  const triggerDistribution = aggregateDimension(
    deals,
    (deal) => deal.trigger_type_normalized ?? "Other",
    "trigger_type"
  );

  const spreadVsExpectedLoss = deals
    .filter((deal) => deal.average_expected_loss_percent != null && deal.average_final_spread_bps != null)
    .map((deal) => ({
      id: deal.id,
      deal_id: deal.deal_id,
      deal_name: deal.deal_name,
      country_name: deal.country_name,
      country_slug: deal.country_slug,
      sovereign_flag: deal.sovereign_flag,
      market_segment: deal.market_segment,
      deal_year: deal.deal_year,
      expected_loss_percent: deal.average_expected_loss_percent,
      final_spread_bps: deal.average_final_spread_bps,
      risk_multiple: deal.average_risk_multiple,
      total_deal_size_ils_m: roundNumber(deal.deal_size_usd / 1_000_000, 6),
      deal_size_usd: deal.deal_size_usd
    }));

  const summaryBySovereign = ["Sovereign", "Non-Sovereign"].map((segment) => {
    const sovereignFlag = segment === "Sovereign";
    const subset = deals.filter((deal) => deal.sovereign_flag === sovereignFlag);
    const volume = sum(subset, (deal) => deal.deal_size_usd);
    return {
      segment,
      sovereign_flag: sovereignFlag,
      deal_count: subset.length,
      cumulative_issuance_usd: roundNumber(volume, 2),
      total_volume_usd: roundNumber(volume, 2),
      total_volume_musd: roundNumber(volume / 1_000_000, 6),
      market_share_percent:
        globalKpis.cumulative_issuance_usd > 0
          ? roundNumber((volume / globalKpis.cumulative_issuance_usd) * 100, 4)
          : 0
    };
  });

  const summaryByMarketSegment = aggregateDimension(
    deals,
    (deal) => deal.market_segment || "Non-Sovereign",
    "market_segment"
  );

  const triggerBySegment = aggregateMultiDimension(
    deals,
    (deal) => deal.market_segment || "Non-Sovereign",
    (deal) => deal.trigger_type_normalized || "Other",
    "market_segment",
    "trigger_type"
  );

  const perilBySegment = aggregateMultiDimension(
    deals,
    (deal) => deal.market_segment || "Non-Sovereign",
    (deal) => deal.peril_type || "Other",
    "market_segment",
    "peril"
  );

  const topCountries = buildTopCountries(deals, false);
  const topSovereignCountries = buildTopCountries(deals, true);
  const topSponsors = buildTopSponsors(deals);
  const topBrokers = buildTopIntermediary(deals, "broker_name", "Top Brokers");
  const topBookrunners = buildTopIntermediary(deals, "bookrunner_name", "Top Bookrunners");
  const topPlacementAgents = buildTopIntermediary(deals, "placement_agent_name", "Top Placement Agents");

  const heatmapYearPeril = aggregateMultiDimension(
    deals.filter((deal) => deal.deal_year != null),
    (deal) => String(deal.deal_year),
    (deal) => deal.peril_type || "Other",
    "year",
    "peril"
  ).map((row) => ({
    year: Number(row.year),
    peril: row.peril,
    deal_count: row.deal_count,
    total_volume_usd: row.total_volume_usd,
    total_volume_musd: row.total_volume_musd
  }));

  const heatmapYearTrigger = aggregateMultiDimension(
    deals.filter((deal) => deal.deal_year != null),
    (deal) => String(deal.deal_year),
    (deal) => deal.trigger_type_normalized || "Other",
    "year",
    "trigger_type"
  ).map((row) => ({
    year: Number(row.year),
    trigger_type: row.trigger_type,
    deal_count: row.deal_count,
    total_volume_usd: row.total_volume_usd,
    total_volume_musd: row.total_volume_musd
  }));

  const expectedLossDistribution = buildDistributionDataset(
    deals.map((deal) => deal.average_expected_loss_percent).filter((value) => value != null),
    0.1,
    "expected_loss_percent",
    "cat_bond_master.csv",
    timestamp
  );

  const spreadDistribution = buildDistributionDataset(
    deals.map((deal) => deal.average_final_spread_bps).filter((value) => value != null),
    50,
    "spread_bps",
    "cat_bond_master.csv",
    timestamp
  );

  const triggeredDeals = deals.filter((deal) => deal.triggered_deal_flag || deal.total_principal_loss_usd > 0);
  const triggeredDealsSummary = {
    generated_at: timestamp,
    source: "cat_bond_master.csv",
    total_triggered_deals: triggeredDeals.length,
    total_principal_loss_usd: roundNumber(sum(triggeredDeals, (deal) => deal.total_principal_loss_usd), 2),
    total_principal_loss_musd: roundNumber(
      sum(triggeredDeals, (deal) => deal.total_principal_loss_usd) / 1_000_000,
      6
    ),
    by_year: aggregateDimension(triggeredDeals, (deal) => String(deal.deal_year ?? "Unknown"), "year")
      .filter((row) => row.year !== "Unknown")
      .map((row) => ({
        year: Number(row.year),
        deal_count: row.deal_count,
        principal_loss_usd: row.total_volume_usd,
        principal_loss_musd: row.total_volume_musd
      })),
    by_country: aggregateDimension(
      triggeredDeals.filter((deal) => deal.country_name),
      (deal) => deal.country_name,
      "country_name"
    ).map((row) => ({
      country_name: row.country_name,
      deal_count: row.deal_count,
      principal_loss_usd: row.total_volume_usd,
      principal_loss_musd: row.total_volume_musd
    }))
  };

  const pricingIntelligence = buildPricingIntelligence(deals, timestamp);
  const sovereignDashboard = buildSovereignDashboard(deals, timestamp);
  const riskGapSummary = buildRiskGapSummary(deals, timestamp, globalKpis.latest_market_year);

  return {
    issuanceByYear,
    perilDistribution,
    triggerDistribution,
    spreadVsExpectedLoss,
    sovereignVsPrivate: {
      generated_at: timestamp,
      source: "cat_bond_master.csv",
      summary_by_sovereign_flag: summaryBySovereign,
      summary_by_market_segment: summaryByMarketSegment,
      trigger_by_market_segment: triggerBySegment,
      peril_by_market_segment: perilBySegment
    },
    topCountries,
    topSovereignCountries,
    topSponsors,
    topBrokers,
    topBookrunners,
    topPlacementAgents,
    heatmapYearPeril,
    heatmapYearTrigger,
    expectedLossDistribution,
    spreadDistribution,
    triggeredDealsSummary,
    pricingIntelligence,
    sovereignDashboard,
    riskGapSummary
  };
}

function buildCountryDatasets(deals, coordinates, timestamp) {
  const countryGroups = new Map();
  for (const deal of deals) {
    if (!deal.country_name) continue;
    const key = deal.country_name;
    if (!countryGroups.has(key)) countryGroups.set(key, []);
    countryGroups.get(key).push(deal);
  }

  const countryPageIndex = [];
  const countryKpis = [];
  const countryGlobePoints = [];

  for (const [countryName, countryDeals] of countryGroups.entries()) {
    const slug = slugify(countryName);
    const volumeUsd = roundNumber(sum(countryDeals, (deal) => deal.deal_size_usd), 2);
    const dealCount = countryDeals.length;
    const sovereignDeals = countryDeals.filter((deal) => deal.sovereign_flag).length;
    const nonSovereignDeals = dealCount - sovereignDeals;
    const sovereignFlag = sovereignDeals > 0;
    const latestIssueYear = maxNumber(countryDeals.map((deal) => deal.deal_year));
    const perilCounter = countBy(countryDeals.map((deal) => deal.peril_type ?? "Other"));
    const triggerCounter = countBy(countryDeals.map((deal) => deal.trigger_type_normalized ?? "Other"));
    const mainPeril = topKey(perilCounter) ?? "Other";
    const triggerTypes = sortedCounterKeys(triggerCounter);
    const modelTypes = [sovereignFlag ? "Sovereign" : "Non-Sovereign"];
    const marketSegmentSummary =
      sovereignDeals > 0 && nonSovereignDeals > 0
        ? "Mixed (Sovereign / Non-Sovereign)"
        : sovereignDeals > 0
          ? "Sovereign"
          : "Non-Sovereign";

    const resolvedCoordinates = resolveCountryCoordinates(countryName, slug, coordinates);
    const region =
      normalizeRegion(
        countryDeals.map((deal) => deal.region_normalized).find(Boolean) ?? null,
        countryName,
        coordinates
      ) ?? "Global";

    const yearlyIssuance = aggregateDimension(
      countryDeals.filter((deal) => deal.deal_year != null),
      (deal) => String(deal.deal_year),
      "year"
    )
      .map((row) => ({
        year: Number(row.year),
        count: row.deal_count,
        total_volume_usd: row.total_volume_usd
      }))
      .sort((a, b) => a.year - b.year);

    const countrySummary = {
      id: slug,
      country_name: countryName,
      slug,
      region,
      sovereign_flag: sovereignFlag,
      market_segment_summary: marketSegmentSummary,
      deal_count: dealCount,
      sovereign_deal_count: sovereignDeals,
      non_sovereign_deal_count: nonSovereignDeals,
      total_volume_usd: volumeUsd,
      total_volume_musd: roundNumber(volumeUsd / 1_000_000, 6),
      latest_issue_year: latestIssueYear,
      main_peril: mainPeril,
      trigger_types: triggerTypes,
      model_types: modelTypes,
      sovereign_activity_summary:
        sovereignDeals > 0
          ? `Includes ${sovereignDeals} sovereign deal(s) and ${nonSovereignDeals} non-sovereign deal(s).`
          : "No sovereign deals identified in current classification.",
      summary: `Deal-level intelligence for ${countryName}, based exclusively on the cleaned master catastrophe bond dataset.`,
      latitude: resolvedCoordinates?.lat ?? null,
      longitude: resolvedCoordinates?.lng ?? null,
      destination_url: `/countries/${slug}`,
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
      has_policy_lessons: true
    };

    countryPageIndex.push(countrySummary);

    countryKpis.push({
      slug,
      country_name: countryName,
      region,
      deal_count: dealCount,
      total_volume_usd: volumeUsd,
      total_volume_musd: roundNumber(volumeUsd / 1_000_000, 6),
      latest_issue_year: latestIssueYear,
      main_peril: mainPeril,
      sovereign_flag: sovereignFlag,
      sovereign_activity_summary: countrySummary.sovereign_activity_summary,
      market_segment_breakdown: [
        { segment: "Sovereign", count: sovereignDeals },
        { segment: "Non-Sovereign", count: nonSovereignDeals }
      ],
      trigger_breakdown: sortedCounterEntries(triggerCounter).map(([trigger, count]) => ({
        trigger,
        count
      })),
      yearly_issuance: yearlyIssuance
    });

    const lat = resolvedCoordinates?.lat ?? syntheticLatitude(slug);
    const lng = resolvedCoordinates?.lng ?? syntheticLongitude(slug);
    const tooltipText = `${dealCount.toLocaleString("en-US")} deals | ${sovereignDeals} sovereign / ${nonSovereignDeals} non-sovereign | ${mainPeril} | Latest ${latestIssueYear ?? "N/A"}`;

    countryGlobePoints.push({
      id: slug,
      country_name: countryName,
      slug,
      lat: roundNumber(lat, 6),
      lng: roundNumber(lng, 6),
      sovereign_flag: sovereignFlag,
      market_segment: marketSegmentSummary,
      market_segment_summary: marketSegmentSummary,
      deal_count: dealCount,
      issuance_volume_usd: volumeUsd,
      total_volume_usd: volumeUsd,
      total_volume_musd: roundNumber(volumeUsd / 1_000_000, 6),
      latest_deal_year: latestIssueYear,
      latest_issue_year: latestIssueYear,
      main_peril: mainPeril,
      sovereign_deal_count: sovereignDeals,
      non_sovereign_deal_count: nonSovereignDeals,
      tooltip_title: countryName,
      tooltip_text: tooltipText,
      destination_url: `/countries/${slug}`
    });
  }

  countryPageIndex.sort((a, b) => b.total_volume_usd - a.total_volume_usd);
  countryKpis.sort((a, b) => b.total_volume_usd - a.total_volume_usd);
  countryGlobePoints.sort((a, b) => b.total_volume_usd - a.total_volume_usd);

  return {
    generated_at: timestamp,
    countryPageIndex,
    countryKpis,
    countryGlobePoints
  };
}

function buildIssuanceByYear(deals) {
  const segments = [
    { key: "all", label: "All", filter: () => true },
    { key: "sovereign", label: "Sovereign", filter: (deal) => deal.sovereign_flag },
    { key: "non_sovereign", label: "Non-Sovereign", filter: (deal) => !deal.sovereign_flag }
  ];

  const rows = [];
  for (const segment of segments) {
    const subset = deals.filter((deal) => deal.deal_year != null && segment.filter(deal));
    const grouped = aggregateDimension(subset, (deal) => String(deal.deal_year), "year")
      .map((row) => ({
        year: Number(row.year),
        segment: segment.label,
        segment_key: segment.key,
        deal_count: row.deal_count,
        cumulative_issuance_usd: row.total_volume_usd,
        total_volume_usd: row.total_volume_usd,
        total_volume_musd: row.total_volume_musd
      }))
      .sort((a, b) => a.year - b.year);
    rows.push(...grouped);
  }

  return rows;
}
function buildTopCountries(deals, sovereignOnly) {
  const grouped = new Map();
  for (const deal of deals) {
    if (!deal.country_name) continue;
    if (sovereignOnly && !deal.sovereign_flag) continue;
    if (!grouped.has(deal.country_name)) {
      grouped.set(deal.country_name, {
        country_name: deal.country_name,
        country_slug: deal.country_slug ?? slugify(deal.country_name),
        deal_count: 0,
        total_volume_usd: 0,
        latest_issue_year: null,
        sovereign_flag: false
      });
    }
    const agg = grouped.get(deal.country_name);
    agg.deal_count += 1;
    agg.total_volume_usd += deal.deal_size_usd;
    agg.sovereign_flag = agg.sovereign_flag || deal.sovereign_flag;
    if (deal.deal_year != null) {
      agg.latest_issue_year = agg.latest_issue_year == null ? deal.deal_year : Math.max(agg.latest_issue_year, deal.deal_year);
    }
  }

  return [...grouped.values()]
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
    .map((row, index) => ({
      rank: index + 1,
      country_name: row.country_name,
      country_slug: row.country_slug,
      deal_count: row.deal_count,
      sovereign_flag: row.sovereign_flag,
      total_volume_usd: roundNumber(row.total_volume_usd, 2),
      total_volume_musd: roundNumber(row.total_volume_usd / 1_000_000, 6),
      latest_issue_year: row.latest_issue_year
    }));
}

function buildTopSponsors(deals) {
  const grouped = new Map();
  for (const deal of deals) {
    const key = deal.sponsor_name ?? "Unknown Sponsor";
    if (!grouped.has(key)) {
      grouped.set(key, {
        sponsor_name: key,
        deal_count: 0,
        sovereign_deal_count: 0,
        total_volume_usd: 0
      });
    }
    const agg = grouped.get(key);
    agg.deal_count += 1;
    if (deal.sovereign_flag) agg.sovereign_deal_count += 1;
    agg.total_volume_usd += deal.deal_size_usd;
  }

  return [...grouped.values()]
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
    .map((row, index) => ({
      rank: index + 1,
      sponsor_name: row.sponsor_name,
      deal_count: row.deal_count,
      sovereign_deal_count: row.sovereign_deal_count,
      total_volume_usd: roundNumber(row.total_volume_usd, 2),
      total_volume_musd: roundNumber(row.total_volume_usd / 1_000_000, 6)
    }));
}

function buildTopIntermediary(deals, fieldName, label) {
  const values = deals.map((deal) => deal[fieldName]).filter((value) => Boolean(value));
  if (!values.length) {
    return {
      label,
      field_used: fieldName,
      field_available: false,
      rows: []
    };
  }

  const grouped = new Map();
  for (const deal of deals) {
    const value = deal[fieldName];
    if (!value) continue;
    if (!grouped.has(value)) {
      grouped.set(value, {
        name: value,
        deal_count: 0,
        sovereign_deal_count: 0,
        total_volume_usd: 0
      });
    }
    const agg = grouped.get(value);
    agg.deal_count += 1;
    if (deal.sovereign_flag) agg.sovereign_deal_count += 1;
    agg.total_volume_usd += deal.deal_size_usd;
  }

  const total = sum(deals, (deal) => deal.deal_size_usd);
  const rows = [...grouped.values()]
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
    .map((row, index) => ({
      rank: index + 1,
      name: row.name,
      deal_count: row.deal_count,
      sovereign_deal_count: row.sovereign_deal_count,
      total_volume_usd: roundNumber(row.total_volume_usd, 2),
      total_volume_musd: roundNumber(row.total_volume_usd / 1_000_000, 6),
      market_share_percent: total > 0 ? roundNumber((row.total_volume_usd / total) * 100, 4) : 0
    }));

  return {
    label,
    field_used: fieldName,
    field_available: true,
    rows
  };
}

function buildDistributionDataset(values, bucketSize, metric, source, timestamp) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) {
    return {
      generated_at: timestamp,
      metric,
      source,
      bucket_size: bucketSize,
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      p25: null,
      p75: null,
      buckets: []
    };
  }

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const start = Math.floor(min / bucketSize) * bucketSize;
  const end = Math.ceil(max / bucketSize) * bucketSize;
  const bucketCount = Math.max(1, Math.ceil((end - start) / bucketSize));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    bin_start: roundNumber(start + index * bucketSize, 6),
    bin_end: roundNumber(start + (index + 1) * bucketSize, 6),
    count: 0
  }));

  for (const value of sorted) {
    const idx = Math.min(buckets.length - 1, Math.max(0, Math.floor((value - start) / bucketSize)));
    buckets[idx].count += 1;
  }

  return {
    generated_at: timestamp,
    metric,
    source,
    bucket_size: bucketSize,
    count: sorted.length,
    min: roundNumber(min, 6),
    max: roundNumber(max, 6),
    mean: roundNumber(sorted.reduce((acc, value) => acc + value, 0) / sorted.length, 6),
    median: roundNumber(percentile(sorted, 0.5), 6),
    p25: roundNumber(percentile(sorted, 0.25), 6),
    p75: roundNumber(percentile(sorted, 0.75), 6),
    buckets
  };
}

function buildPricingIntelligence(deals, timestamp) {
  const withPricing = deals.filter(
    (deal) => deal.average_expected_loss_percent != null && deal.average_final_spread_bps != null
  );

  const aggregatePricing = (keySelector) => {
    const grouped = new Map();
    for (const deal of withPricing) {
      const key = keySelector(deal);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          count: 0,
          spreadSum: 0,
          elSum: 0
        });
      }
      const agg = grouped.get(key);
      agg.count += 1;
      agg.spreadSum += deal.average_final_spread_bps;
      agg.elSum += deal.average_expected_loss_percent;
    }
    return [...grouped.values()]
      .map((row) => ({
        key: row.key,
        count: row.count,
        avg_spread_bps: roundNumber(row.spreadSum / row.count, 6),
        avg_expected_loss_percent: roundNumber(row.elSum / row.count, 6)
      }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    generated_at: timestamp,
    pricing_by_peril: aggregatePricing((deal) => deal.peril_type ?? "Other").map((row) => ({
      peril: row.key,
      count: row.count,
      avg_spread_bps: row.avg_spread_bps,
      avg_expected_loss_percent: row.avg_expected_loss_percent
    })),
    pricing_by_trigger: aggregatePricing((deal) => deal.trigger_type_normalized ?? "Other").map((row) => ({
      trigger: row.key,
      count: row.count,
      avg_spread_bps: row.avg_spread_bps,
      avg_expected_loss_percent: row.avg_expected_loss_percent
    })),
    segment_pricing: aggregatePricing((deal) => (deal.sovereign_flag ? "Sovereign" : "Non-Sovereign")).map((row) => ({
      segment: row.key,
      count: row.count,
      avg_spread_bps: row.avg_spread_bps,
      avg_expected_loss_percent: row.avg_expected_loss_percent
    }))
  };
}

function buildSovereignDashboard(deals, timestamp) {
  const sovereignDeals = deals.filter((deal) => deal.sovereign_flag);
  const avg = (rows, field) => {
    const values = rows.map((row) => row[field]).filter((value) => value != null);
    if (!values.length) return null;
    return roundNumber(values.reduce((acc, value) => acc + value, 0) / values.length, 6);
  };

  const toBreakdown = (rows, keyField) =>
    aggregateDimension(rows, (deal) => deal[keyField] ?? "Other", "name")
      .map((row) => ({
        name: row.name,
        deal_count: row.deal_count,
        total_volume_usd: row.total_volume_usd
      }))
      .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
      .slice(0, 12);

  return {
    generated_at: timestamp,
    kpis: {
      dealCount: sovereignDeals.length,
      totalVolumeUsd: roundNumber(sum(sovereignDeals, (deal) => deal.deal_size_usd), 2),
      countries: new Set(sovereignDeals.map((deal) => deal.country_name).filter(Boolean)).size,
      avgExpectedLoss: avg(sovereignDeals, "average_expected_loss_percent"),
      avgSpreadBps: avg(sovereignDeals, "average_final_spread_bps"),
      latestYear: maxNumber(sovereignDeals.map((deal) => deal.deal_year))
    },
    issuanceByYear: aggregateDimension(
      sovereignDeals.filter((deal) => deal.deal_year != null),
      (deal) => String(deal.deal_year),
      "year"
    )
      .map((row) => ({
        year: Number(row.year),
        deal_count: row.deal_count,
        total_volume_usd: row.total_volume_usd
      }))
      .sort((a, b) => a.year - b.year),
    perilMix: toBreakdown(sovereignDeals, "peril_type"),
    triggerMix: toBreakdown(sovereignDeals, "trigger_type_normalized"),
    topSponsors: toBreakdown(sovereignDeals, "sponsor_name"),
    topCountries: toBreakdown(sovereignDeals, "country_name")
  };
}

function buildRiskGapSummary(deals, timestamp, latestMarketYear) {
  const grouped = new Map();
  for (const deal of deals) {
    if (!deal.country_name) continue;
    if (!grouped.has(deal.country_name)) grouped.set(deal.country_name, []);
    grouped.get(deal.country_name).push(deal);
  }

  const rows = [];
  for (const [countryName, countryDeals] of grouped.entries()) {
    const volume = sum(countryDeals, (deal) => deal.deal_size_usd);
    const dealCount = countryDeals.length;
    const sovereignDeals = countryDeals.filter((deal) => deal.sovereign_flag).length;
    const latest = maxNumber(countryDeals.map((deal) => deal.deal_year));
    const yearPenalty =
      latest == null || latestMarketYear == null
        ? 20
        : latest >= latestMarketYear - 2
          ? 0
          : latest >= latestMarketYear - 5
            ? 10
            : 20;
    const depthPenalty = dealCount >= 25 ? 0 : dealCount >= 10 ? 10 : dealCount >= 3 ? 20 : 30;
    const sovereignPenalty = sovereignDeals > 0 ? 0 : 20;
    const gapScore = clampNumber(yearPenalty + depthPenalty + sovereignPenalty, 0, 100);
    const gapLabel = gapScore <= 25 ? "Low Gap" : gapScore <= 55 ? "Moderate Gap" : "High Gap";

    rows.push({
      country_name: countryName,
      slug: slugify(countryName),
      region:
        countryDeals.find((deal) => deal.region_normalized)?.region_normalized ??
        countryDeals.find((deal) => deal.region_of_sponsor)?.region_of_sponsor ??
        "Global",
      deal_count: dealCount,
      total_volume_usd: roundNumber(volume, 2),
      latest_issue_year: latest,
      sovereign_flag: sovereignDeals > 0,
      gap_label: gapLabel,
      gap_score: roundNumber(gapScore, 2),
      rationale:
        gapLabel === "Low Gap"
          ? "Higher issuance depth and recent activity indicate stronger risk-transfer presence."
          : gapLabel === "Moderate Gap"
            ? "Partial issuance coverage or recency gaps suggest potential policy development needs."
            : "Limited issuance depth and/or stale recency indicate potential catastrophe risk transfer gap."
    });
  }

  rows.sort((a, b) => b.gap_score - a.gap_score);
  return {
    generated_at: timestamp,
    source: "cat_bond_master.csv",
    rows
  };
}
function buildDataAuditSummary(rawRowsCount, dedup, globalKpis, timestamp) {
  const actualBusd = globalKpis.cumulative_issuance_usd / 1_000_000_000;
  const withinRange = actualBusd >= 180 && actualBusd <= 220;

  return {
    generated_at: timestamp,
    source_root: "data/master",
    source_files: {
      master_csv: "cat_bond_master.csv"
    },
    row_counts: {
      raw_rows: rawRowsCount,
      duplicate_rows_removed: dedup.duplicatesRemoved,
      cleaned_rows: dedup.deals.length
    },
    deduplication: {
      primary_key: "deal_id",
      fallback_key: "hash(deal_name|issue_year|sponsor)",
      duplicates_by_deal_id: dedup.duplicatesByDealId,
      duplicates_by_fallback_key: dedup.duplicatesByFallbackKey,
      missing_deal_id_rows: dedup.missingDealIdRows
    },
    amount_methodology: {
      required_column: "deal_size_usd",
      rule: "SUM(deal_size_usd) at deal level; tranche/program fields excluded from totals",
      cumulative_issuance_musd: globalKpis.cumulative_issuance_musd,
      cumulative_issuance_usd: globalKpis.cumulative_issuance_usd
    },
    validation: {
      expected_total_volume_busd_range: [180, 220],
      actual_total_volume_busd: roundNumber(actualBusd, 3),
      within_expected_range: withinRange,
      note: withinRange
        ? "Validation range check passed."
        : "Total issuance differs from expected validation range; review source dataset coverage."
    }
  };
}

function buildHomeKpiContent(globalKpis) {
  return {
    enabled: true,
    section_title: "Market Snapshot",
    section_subtitle: "Calculated from data/master/cat_bond_master.csv",
    items: [
      {
        id: "deal_count",
        label: "Deal Count",
        value: `${globalKpis.total_deals.toLocaleString("en-US")}`,
        note: "COUNT(DISTINCT deal_id)",
        definition: "Distinct catastrophe bond deals in the cleaned master dataset.",
        interpretation: "Historical transaction footprint represented in the platform.",
        data_type: "historical"
      },
      {
        id: "cumulative_issuance",
        label: "Cumulative Issuance",
        value: `$${(globalKpis.cumulative_issuance_usd / 1_000_000_000).toFixed(1)}B`,
        note: "SUM(deal_size_usd)",
        definition: "Sum of deal_size_usd at deal level.",
        interpretation: "Historical issuance total, not outstanding stock.",
        data_type: "historical"
      },
      {
        id: "sovereign_deals",
        label: "Sovereign Deals",
        value: `${globalKpis.sovereign_deal_count.toLocaleString("en-US")}`,
        note: "COUNT(sovereign_flag = TRUE)",
        definition: "Deals classified as sovereign by platform classification rules.",
        interpretation: "Depth of sovereign catastrophe bond participation.",
        data_type: "derived"
      },
      {
        id: "non_sovereign_deals",
        label: "Non-Sovereign Deals",
        value: `${globalKpis.non_sovereign_deal_count.toLocaleString("en-US")}`,
        note: "COUNT(sovereign_flag = FALSE)",
        definition: "Deals classified as non-sovereign.",
        interpretation: "Private market transaction depth in current coverage.",
        data_type: "derived"
      },
      {
        id: "countries_covered",
        label: "Countries Covered",
        value: `${globalKpis.countries_covered.toLocaleString("en-US")}`,
        note: "COUNT(DISTINCT country_of_sponsor)",
        definition: "Distinct sponsor countries represented in the dataset.",
        interpretation: "Geographic breadth of market coverage.",
        data_type: "derived"
      },
      {
        id: "latest_market_year",
        label: "Latest Market Year",
        value: String(globalKpis.latest_market_year ?? "N/A"),
        note: "MAX(issue_year)",
        definition: "Latest issue year available in the cleaned dataset.",
        interpretation: "Recency of captured market activity.",
        data_type: "historical"
      },
      {
        id: "outstanding_market_size",
        label: "Outstanding Market Size",
        value: "Not available",
        note: "Outstanding market size not available in current dataset",
        definition: "Requires full maturity/outstanding history to compute current stock.",
        interpretation: "Suppressed until complete outstanding coverage is available.",
        data_type: "derived"
      }
    ]
  };
}

function aggregateDimension(rows, keySelector, outputKey) {
  const grouped = new Map();
  for (const row of rows) {
    const key = keySelector(row);
    if (!key) continue;
    if (!grouped.has(key)) {
      grouped.set(key, {
        [outputKey]: key,
        deal_count: 0,
        total_volume_usd: 0
      });
    }
    const agg = grouped.get(key);
    agg.deal_count += 1;
    agg.total_volume_usd += row.deal_size_usd ?? row.total_principal_loss_usd ?? 0;
  }
  return [...grouped.values()]
    .map((row) => ({
      ...row,
      total_volume_usd: roundNumber(row.total_volume_usd, 2),
      total_volume_musd: roundNumber(row.total_volume_usd / 1_000_000, 6)
    }))
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd);
}

function aggregateMultiDimension(rows, firstSelector, secondSelector, firstKey, secondKey) {
  const grouped = new Map();
  for (const row of rows) {
    const a = firstSelector(row);
    const b = secondSelector(row);
    if (!a || !b) continue;
    const key = `${a}|||${b}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        [firstKey]: a,
        [secondKey]: b,
        deal_count: 0,
        total_volume_usd: 0
      });
    }
    const agg = grouped.get(key);
    agg.deal_count += 1;
    agg.total_volume_usd += row.deal_size_usd ?? row.total_principal_loss_usd ?? 0;
  }
  return [...grouped.values()]
    .map((row) => ({
      ...row,
      total_volume_usd: roundNumber(row.total_volume_usd, 2),
      total_volume_musd: roundNumber(row.total_volume_usd / 1_000_000, 6)
    }))
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd);
}

function inferSovereignFlag(raw) {
  const sovereignOrCorporate = cleanText(raw.sovereign_or_corporate)?.toLowerCase() ?? "";
  if (/\bsovereign\b|\bgovernment\b/.test(sovereignOrCorporate)) return true;

  const text = [
    cleanText(raw.sponsor),
    cleanText(raw.issuer),
    cleanText(raw.deal_name),
    cleanText(raw.series_name),
    cleanText(raw.cedent),
    cleanText(raw.sovereign_or_corporate)
  ]
    .filter(Boolean)
    .join(" ");

  if (SOVEREIGN_POSITIVE.some((pattern) => pattern.test(text))) {
    if (SOVEREIGN_NEGATIVE.some((pattern) => pattern.test(text))) {
      return /\bgovernment\b|\brepublic\b|\bministry\b|\btreasury\b/i.test(text);
    }
    return true;
  }

  if (parseBoolean(raw.government_program_flag) || parseBoolean(raw.sovereign_flag)) {
    return /\bgovernment\b|\brepublic\b|\bministry\b|\btreasury\b|fonden|agroasemex|pacific alliance|world bank|ccrif/i.test(text);
  }

  return false;
}

function inferMarketSegment(raw) {
  const text = [
    cleanText(raw.sponsor),
    cleanText(raw.issuer),
    cleanText(raw.deal_name),
    cleanText(raw.series_name),
    cleanText(raw.cedent)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/reinsurance|reinsurer|\bre ltd\b|\b re\b/.test(text)) return "Reinsurer";
  if (/insurance|insurer|mutual|exchange/.test(text)) return "Insurer";
  if (/corporate|corporation|corp\b|capital|holdings|fund/.test(text)) return "Corporate";
  return "Non-Sovereign";
}

function normalizeTriggerType(rawTrigger) {
  const value = rawTrigger?.toLowerCase() ?? "";
  if (!value || UNKNOWN_LABELS.has(value)) return "Other";
  if (value.includes("parametric")) return "Parametric";
  if (value.includes("indemnity")) return "Indemnity";
  if (value.includes("industry")) return "Industry Loss";
  if (value.includes("model")) return "Modelled Loss";
  if (value.includes("hybrid")) return "Hybrid";
  return "Other";
}

function extractPerilTags(rawPerils) {
  const value = rawPerils?.toLowerCase() ?? "";
  if (!value || UNKNOWN_LABELS.has(value)) return ["Other"];
  const tags = new Set();
  if (/earthquake|seismic/.test(value)) tags.add("Earthquake");
  if (/hurricane|named storm|typhoon|cyclone|windstorm|wind/.test(value)) tags.add("Hurricane / Wind");
  if (/flood|rain|rainfall|precipitation/.test(value)) tags.add("Flood");
  if (!tags.size) tags.add("Other");
  if (tags.size > 1) return ["Multi-Peril"];
  return [...tags];
}
function normalizeCountry(country) {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  if (UNKNOWN_LABELS.has(key)) return null;
  const alias = COUNTRY_ALIAS.get(key);
  if (alias) return alias;
  return toTitleCase(country.trim());
}

function normalizeRegion(region, country, coordinates) {
  if (region) {
    const key = region.trim().toLowerCase();
    if (!UNKNOWN_LABELS.has(key)) {
      return REGION_NORMALIZATION.get(key) ?? toTitleCase(region.trim());
    }
  }
  if (country && coordinates[country]?.region) {
    return coordinates[country].region;
  }
  return "Global";
}

function resolveCountryCoordinates(country, slug, coordinates) {
  if (country && coordinates[country]) return coordinates[country];
  const bySlug = Object.entries(coordinates).find(([name]) => slugify(name) === slug);
  if (bySlug) return bySlug[1];
  return null;
}

async function readCountryCoordinates() {
  try {
    const text = await fs.readFile(COUNTRY_COORDINATES_PATH, "utf8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function parseBoolean(value) {
  if (typeof value !== "string") return false;
  return /^(true|1|yes|y)$/i.test(value.trim());
}

function parseNumber(value) {
  if (value == null) return null;
  const normalized = String(value).replace(/[$,%\s]/g, "").replace(/,/g, "");
  if (!normalized.length) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value) {
  const parsed = parseNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function cleanText(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }
  return null;
}

function deriveYear(raw) {
  const directYear = parseInteger(raw.issue_year);
  if (directYear != null && directYear > 0) return directYear;
  const candidates = [cleanText(raw.issue_date), cleanText(raw.pricing_date), cleanText(raw.announcement_date)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.match(/\b(19|20)\d{2}\b/);
    if (match) return Number(match[0]);
  }
  return null;
}

function aggregateByString(rows, keySelector, valueSelector) {
  const map = new Map();
  for (const row of rows) {
    const key = keySelector(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + valueSelector(row));
  }
  return map;
}

function countBy(values) {
  const map = new Map();
  for (const value of values) {
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

function topKey(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function sortedCounterKeys(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
}

function sortedCounterEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function sum(rows, selector) {
  return rows.reduce((acc, row) => acc + (selector(row) ?? 0), 0);
}

function maxNumber(values) {
  const filtered = values.filter((value) => value != null && Number.isFinite(value));
  return filtered.length ? Math.max(...filtered) : null;
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return null;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hashShort(value) {
  return crypto.createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 12).toUpperCase();
}

function syntheticLatitude(seed) {
  const hash = parseInt(hashShort(seed).slice(0, 6), 16);
  return ((hash % 12000) / 100) - 60;
}

function syntheticLongitude(seed) {
  const hash = parseInt(hashShort(`${seed}-lng`).slice(0, 6), 16);
  return ((hash % 36000) / 100) - 180;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
