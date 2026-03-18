#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_ROOT = path.join(ROOT, "data");
const CONTENT_ROOT = path.join(ROOT, "content");

const SQL_READY_DIR =
  process.env.SQL_READY_PACKAGE_DIR ||
  path.join(ROOT, "..", "final_outputs_country_fixed", "sql_ready_package");
const SEISMIC_DIR =
  process.env.SEISMIC_PACKAGE_DIR ||
  path.join(ROOT, "..", "final_sql_ready_seismic_catbond_package");

const USD_ILS = Number(process.env.USD_ILS || 3.67);
const SCOPE = (process.argv.find((a) => a.startsWith("--scope="))?.split("=")[1] || "all").toLowerCase();

const SRC = {
  deals: path.join(SQL_READY_DIR, "deals_master_sql_ready.csv"),
  tranches: path.join(SQL_READY_DIR, "tranches_core_sql_ready.csv"),
  pricing: path.join(SQL_READY_DIR, "pricing_and_returns_sql_ready.csv"),
  issuers: path.join(SQL_READY_DIR, "issuers_entities_sql_ready.csv"),
  metrics: path.join(SQL_READY_DIR, "calculated_metrics_sql_ready.csv"),
  seismicSummary: path.join(SEISMIC_DIR, "seismic_high_risk_countries_cat_bonds_summary.csv"),
  seismicDetailed: path.join(SEISMIC_DIR, "seismic_high_risk_countries_cat_bonds_detailed.csv")
};

const OUT = {
  master: path.join(DATA_ROOT, "master", "cat_bond_master_database.json"),
  globalKpisMaster: path.join(DATA_ROOT, "master", "global_kpis.json"),
  globalKpisChart: path.join(DATA_ROOT, "chart_data", "global_kpis.json"),
  audit: path.join(DATA_ROOT, "master", "data_audit_summary.json"),
  dedup: path.join(DATA_ROOT, "master", "dedup_audit.json"),
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
  dealSlugIndex: path.join(DATA_ROOT, "deals", "deal_slug_index.json"),
  homeKpis: path.join(CONTENT_ROOT, "home", "kpis.json"),
  seismicCards: path.join(DATA_ROOT, "seismic", "seismic_country_cards.json"),
  seismicCoverage: path.join(DATA_ROOT, "seismic", "seismic_coverage_summary.json"),
  seismicGlobePoints: path.join(DATA_ROOT, "seismic", "seismic_country_globe_points.json"),
  seismicIssuanceByYear: path.join(DATA_ROOT, "seismic", "seismic_issuance_by_year.json"),
  seismicTriggerDistribution: path.join(DATA_ROOT, "seismic", "seismic_trigger_distribution.json"),
  seismicPerilDistribution: path.join(DATA_ROOT, "seismic", "seismic_peril_distribution.json"),
  report: path.join(ROOT, "DATA_INTEGRATION_REPORT.md")
};

const warnings = [];
const COORDS = {
  "United States": { lat: 38.8951, lng: -77.0364 },
  Mexico: { lat: 23.6345, lng: -102.5528 },
  Chile: { lat: -35.6751, lng: -71.543 },
  Colombia: { lat: 4.5709, lng: -74.2973 },
  Peru: { lat: -9.19, lng: -75.0152 },
  Philippines: { lat: 12.8797, lng: 121.774 },
  Jamaica: { lat: 18.1096, lng: -77.2975 },
  "Dominican Republic": { lat: 18.7357, lng: -70.1627 },
  Israel: { lat: 31.0461, lng: 34.8516 },
  Japan: { lat: 36.2048, lng: 138.2529 },
  Turkey: { lat: 38.9637, lng: 35.2433 },
  Italy: { lat: 41.8719, lng: 12.5674 },
  Greece: { lat: 39.0742, lng: 21.8243 },
  Bermuda: { lat: 32.3078, lng: -64.7505 },
  Canada: { lat: 56.1304, lng: -106.3468 }
};

await main();

async function main() {
  const t0 = Date.now();
  const doMain = SCOPE === "all" || SCOPE === "main";
  const doSeismic = SCOPE === "all" || SCOPE === "seismic";

  let mainData = null;
  if (doMain) mainData = await buildMain();
  if (doSeismic) await buildSeismic(mainData);

  await writeReport(mainData);
  console.log(`[data-refresh] scope=${SCOPE} done in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  if (warnings.length) warnings.slice(0, 25).forEach((w) => console.log(`[warn] ${w}`));
}

async function buildMain() {
  const [dealsRaw, tranchesRaw, pricingRaw, issuersRaw] = await Promise.all([
    readCsv(SRC.deals),
    readCsv(SRC.tranches),
    readCsv(SRC.pricing),
    readCsv(SRC.issuers)
  ]);
  if (!dealsRaw.length) throw new Error(`No rows in ${SRC.deals}`);

  const dedup = dedupDeals(dealsRaw);
  const tranchesByDeal = aggregateTranches(tranchesRaw);
  const pricingByDeal = aggregatePricing(pricingRaw);
  const issuerBySponsor = new Map(
    issuersRaw
      .map((r) => [
        clean(r.sponsor_name)?.toLowerCase(),
        {
          issuer_name: clean(r.issuer_name),
          sponsor_type: clean(r.sponsor_type),
          public_or_private: clean(r.public_or_private),
          sovereign_or_corporate: clean(r.sovereign_or_corporate)
        }
      ])
      .filter(([k]) => Boolean(k))
  );

  const deals = dedup.rows.map((row) => {
    const dealId = clean(row.deal_id) || fallbackDealId(row);
    const t = tranchesByDeal.get(dealId);
    const p = pricingByDeal.get(dealId);

    const country = normalizeCountry(clean(row.issuing_country_canonical) || clean(row.country_of_sponsor) || "Not stated");
    const region = normalizeRegion(clean(row.region_of_sponsor));
    const sponsorName = clean(row.sponsor_name) || "";
    const issuerMeta = issuerBySponsor.get(sponsorName.toLowerCase());
    // Use explicit sponsor-name patterns only — the source sovereign_or_corporate
    // column is blank for all rows so we rely on known sovereign sponsor keywords.
    // govFlag alone is not sufficient (Allstate/State Farm have it set True in the
    // source data due to a labelling error in the upstream CSV).
    const sponsorHint = /(republic\s+of|government\s+of|ministry\s+of|fonden|agroasemex|ibrd|world\s+bank|ccrif|tcip|turkish\s+catastrophe|caribbean\s+catastrophe|african\s+risk\s+capacity|pandemic\s+emergency|pacific\s+alliance|california\s+state\s+compensation)/i.test(
      sponsorName
    );
    const dealHint = /(multicat\s+mexico|cat-mex|bosphorus\s+(re|1\s+re)|golden\s+state\s+re|puerto\s+rico\s+parametric)/i.test(
      clean(row.deal_name) || ""
    );
    const sovereign = sponsorHint || dealHint;

    const musd = t?.volumeMusd ?? ((num(row.total_deal_size_ils_m) || 0) / USD_ILS);
    const usd = musd * 1_000_000;
    const perils = dedupe([...(splitPerils(row.covered_perils)), ...(t?.perils || [])]);
    const trigger = normalizeTrigger(clean(row.trigger_type) || t?.trigger || "Unknown");

    return {
      id: dealId,
      deal_id: clean(row.deal_id) || dealId,
      deal_name: clean(row.deal_name) || "Not stated",
      series_name: clean(row.series_name) || null,
      announcement_date: normDate(row.announcement_date),
      pricing_date: normDate(row.pricing_date),
      issue_date: normDate(row.issue_date),
      maturity_date: normDate(row.maturity_date),
      deal_year: int(row.deal_year) || inferYear(row.issue_date) || null,
      sponsor_name: sponsorName || null,
      issuer_name:
        clean(row.issuer_name) ||
        issuerMeta?.issuer_name ||
        null,
      cedent_name: clean(row.cedent_name) || null,
      country_of_sponsor: country,
      country_name: country,
      country_slug: slug(country),
      region_of_sponsor: clean(row.region_of_sponsor) || null,
      region_normalized: region,
      sovereign_or_corporate: clean(row.sovereign_or_corporate) || null,
      government_program_flag: parseBool(row.government_program_flag),
      sovereign_flag: sovereign,
      market_segment: sovereign ? "Sovereign" : "Non-Sovereign",
      amount_source: t ? "tranches_core_sql_ready.csv" : "deals_master_sql_ready.csv",
      total_deal_size_ils_m: num(row.total_deal_size_ils_m) || 0,
      total_deal_size_musd: musd,
      total_deal_size_usd: usd,
      deal_size_usd: usd,
      program_size_ils_m: num(row.program_size_ils_m),
      covered_perils: clean(row.covered_perils) || null,
      peril_tags: perils,
      peril_category: perilCategory(perils),
      covered_region: clean(row.covered_region) || null,
      trigger_type: clean(row.trigger_type) || null,
      trigger_type_normalized: trigger,
      trigger_category: trigger,
      average_expected_loss_percent: firstNum(num(row.average_expected_loss_percent), p?.expected, t?.expected),
      average_final_spread_bps: firstNum(num(row.average_final_spread_bps), p?.spread, t?.spread),
      average_risk_multiple: firstNum(num(row.average_risk_multiple), p?.risk, t?.risk),
      tranche_count: int(row.tranche_count) || t?.trancheCount || 0,
      active_tranche_count: t?.activeCount || 0,
      matured_tranche_count: t?.maturedCount || 0,
      active_or_matured:
        (t?.activeCount || 0) > 0 ? "Active" : (t?.maturedCount || 0) > 0 ? "Matured" : "Not stated",
      triggered_deal_flag: parseBool(row.triggered_deal_flag) || Boolean(t?.triggeredCount),
      total_principal_loss_ils_m: firstNum(num(row.total_principal_loss_ils_m), t?.principalLossIlsM) || 0,
      total_principal_loss_musd:
        (firstNum(num(row.total_principal_loss_ils_m), t?.principalLossIlsM) || 0) / USD_ILS,
      total_principal_loss_usd:
        ((firstNum(num(row.total_principal_loss_ils_m), t?.principalLossIlsM) || 0) / USD_ILS) * 1_000_000,
      broker_name: t?.broker || null,
      bookrunner_name: t?.bookrunner || null,
      placement_agent_name: t?.placement || null,
      primary_source_url: clean(row.primary_source_url) || null,
      destination_url: `/countries/${slug(country)}`
    };
  });
  deals.sort((a, b) => (b.deal_year || 0) - (a.deal_year || 0) || b.total_deal_size_usd - a.total_deal_size_usd);

  const generatedAt = new Date().toISOString();
  const kpis = globalKpis(deals, generatedAt);
  const country = aggregateCountries(deals);

  const spreads = deals
    .filter((d) => fin(d.average_expected_loss_percent) && fin(d.average_final_spread_bps))
    .map((d) => ({
      id: d.id,
      deal_id: d.deal_id,
      deal_name: d.deal_name,
      country_name: d.country_name,
      country_slug: d.country_slug,
      sovereign_flag: d.sovereign_flag,
      market_segment: d.market_segment,
      deal_year: d.deal_year,
      expected_loss_percent: d.average_expected_loss_percent,
      final_spread_bps: d.average_final_spread_bps,
      risk_multiple: d.average_risk_multiple,
      total_deal_size_ils_m: d.total_deal_size_ils_m,
      total_deal_size_usd: d.total_deal_size_usd
    }));

  const topCountries = rankCountries(deals);
  const topSovCountries = rankCountries(deals.filter((d) => d.sovereign_flag));
  const topSponsors = rankSponsors(deals);
  const trigSummary = triggeredSummary(deals, generatedAt);

  const pricing = pricingIntelligence(deals, generatedAt);
  const sovDash = sovereignDashboard(deals, generatedAt);
  const riskGap = { generated_at: generatedAt, rows: country.riskGapRows };
  const slugIndex = dealSlugIndex(deals);

  const masterPayload = {
    generated_at: generatedAt,
    source_root: SQL_READY_DIR,
    source_files: {
      deals: rel(SRC.deals),
      tranches: rel(SRC.tranches),
      pricing: rel(SRC.pricing),
      issuers: rel(SRC.issuers),
      metrics: rel(SRC.metrics)
    },
    total_records: deals.length,
    deals
  };

  const audit = {
    generated_at: generatedAt,
    source_root: SQL_READY_DIR,
    row_counts: {
      raw_rows: dealsRaw.length,
      duplicate_rows_removed: dedup.removed,
      cleaned_rows: deals.length
    },
    deduplication: {
      primary_key: "deal_id (fallback deterministic hash)",
      duplicates_by_deal_id: dedup.byDealId,
      duplicates_by_fallback_key: dedup.byFallback,
      missing_deal_id_rows: dedup.missingDealId,
      preserved_separate_tranches: true
    },
    amount_methodology: {
      rule: "Prefer tranche-derived original_amount/tranche_size conversion; fallback to deal-level ILS million amount converted to USD.",
      cumulative_issuance_musd: round(kpis.cumulative_issuance_musd, 3),
      cumulative_issuance_usd: round(kpis.cumulative_issuance_usd, 2)
    },
    validation: kpis.validation
  };

  await Promise.all([
    writeJson(OUT.master, masterPayload),
    writeJson(OUT.globalKpisMaster, kpis),
    writeJson(OUT.globalKpisChart, kpis),
    writeJson(OUT.audit, audit),
    writeJson(OUT.dedup, {
      generated_at: generatedAt,
      raw_rows: dealsRaw.length,
      cleaned_rows: deals.length,
      duplicates_removed: dedup.removed,
      duplicates_by_deal_id: dedup.byDealId,
      duplicates_by_fallback_key: dedup.byFallback,
      missing_deal_id_rows: dedup.missingDealId
    }),
    writeJson(OUT.sovereignDeals, {
      generated_at: generatedAt,
      total_records: deals.filter((d) => d.sovereign_flag).length,
      deals: deals.filter((d) => d.sovereign_flag)
    }),
    writeJson(OUT.privateDeals, {
      generated_at: generatedAt,
      total_records: deals.filter((d) => !d.sovereign_flag).length,
      deals: deals.filter((d) => !d.sovereign_flag)
    }),
    writeJson(OUT.issuanceByYear, issuanceByYear(deals)),
    writeJson(OUT.perilDistribution, distBy(deals, "peril_category", "peril")),
    writeJson(OUT.triggerDistribution, distBy(deals, "trigger_type_normalized", "trigger_type")),
    writeJson(OUT.spreadVsExpectedLoss, spreads),
    writeJson(OUT.sovereignVsPrivate, sovereignVsPrivate(deals)),
    writeJson(OUT.topCountries, topCountries),
    writeJson(OUT.topSovereignCountries, topSovCountries),
    writeJson(OUT.topSponsors, topSponsors),
    writeJson(OUT.topBrokers, topIntermediary(deals, "broker_name", "Top Brokers")),
    writeJson(OUT.topBookrunners, topIntermediary(deals, "bookrunner_name", "Top Bookrunners")),
    writeJson(OUT.topPlacementAgents, topIntermediary(deals, "placement_agent_name", "Top Placement Agents")),
    writeJson(OUT.heatmapYearPeril, heatmap(deals, "peril_category", "peril")),
    writeJson(OUT.heatmapYearTrigger, heatmap(deals, "trigger_type_normalized", "trigger_type")),
    writeJson(
      OUT.expectedLossDistribution,
      histogram(deals.filter((d) => d.average_expected_loss_percent <= 0.10).map((d) => d.average_expected_loss_percent), 0.005, "average_expected_loss_percent", generatedAt)
    ),
    writeJson(
      OUT.spreadDistribution,
      histogram(deals.map((d) => d.average_final_spread_bps), 50, "average_final_spread_bps", generatedAt)
    ),
    writeJson(OUT.triggeredDealsSummary, trigSummary),
    writeJson(OUT.triggeredLossSummary, trigSummary),
    writeJson(OUT.pricingIntelligence, pricing),
    writeJson(OUT.sovereignDashboard, sovDash),
    writeJson(OUT.riskGapSummary, riskGap),
    writeJson(OUT.countryPageIndex, { generated_at: generatedAt, source_root: SQL_READY_DIR, countries: country.index }),
    writeJson(OUT.countryKpis, { generated_at: generatedAt, countries: country.kpis }),
    writeJson(OUT.countryGlobePoints, country.globe),
    writeJson(OUT.globeCountrySummary, country.globe),
    writeJson(OUT.dealSlugIndex, slugIndex),
    writeHomeKpis(kpis, generatedAt)
  ]);

  return { generatedAt, deals, kpis, dedup, country };
}

async function buildSeismic(mainData) {
  const [summary, detailed] = await Promise.all([readCsv(SRC.seismicSummary), readCsv(SRC.seismicDetailed)]);
  if (!summary.length && !detailed.length) return;

  const countryLookup = new Map((mainData?.country?.index || []).map((c) => [normalizeCountry(c.country_name), c]));
  const cards = summary
    .map((r) => {
      const country = normalizeCountry(clean(r.country_normalized) || clean(r.country_name) || "Unknown");
      const c = countryLookup.get(country);
      const ilsM = num(r.total_original_amount_ils_m) || 0;
      const usd = (ilsM / USD_ILS) * 1_000_000;
      const p = coords(country);
      const hasAny = parseBool(r.has_any_cat_bond);
      const hasSov = parseBool(r.has_sovereign_or_public_cat_bond);

      return {
        id: slug(country),
        country_name: country,
        slug: slug(country),
        high_seismic_risk_flag: parseBool(r.high_seismic_risk_flag),
        has_any_cat_bond: hasAny,
        has_sovereign_or_public_cat_bond: hasSov,
        has_private_or_corporate_cat_bond: parseBool(r.has_private_or_corporate_cat_bond),
        has_world_bank_supported_cat_bond: parseBool(r.has_world_bank_supported_cat_bond),
        issuance_status: hasAny ? "Issued" : "No Issuance",
        issuance_count: int(r.total_unique_deals) || 0,
        total_volume_usd: usd,
        total_volume_musd: usd / 1_000_000,
        main_perils: splitPerils(r.main_perils),
        main_trigger_types: splitSemi(r.main_trigger_types),
        first_issue_date: normDate(r.first_issue_date),
        latest_issue_date: normDate(r.latest_issue_date),
        lat: p.lat,
        lng: p.lng,
        coordinates_source: p.source,
        destination_url: c ? `/countries/${c.slug}` : `/countries/${slug(country)}`,
        insight: hasAny
          ? hasSov
            ? "Seismic-risk country with sovereign/public issuance."
            : "Seismic-risk country with non-sovereign issuance."
          : "No seismic-related issuance recorded in current package.",
        data_status:
          parseBool(r.manual_review_needed_flag) || parseBool(r.data_gaps_flag)
            ? "derived_from_source"
            : "official_source",
        source_note: "seismic_high_risk_countries_cat_bonds_summary.csv"
      };
    })
    .sort((a, b) => a.country_name.localeCompare(b.country_name));

  const det = detailed
    .map((r) => ({
      year: inferYear(r.issue_date) || int(r.issue_year),
      volume: trancheVolumeMusd(r) * 1_000_000,
      trigger: normalizeTrigger(clean(r.trigger_type_canonical) || clean(r.trigger_type) || "Unknown"),
      peril: perilCategory(splitPerils(r.covered_perils)),
      issued: parseBool(r.cat_bond_issued_flag)
    }))
    .filter((r) => r.issued);

  const issued = cards.filter((c) => c.has_any_cat_bond).length;
  const coverage = {
    generated_at: new Date().toISOString(),
    source_root: SEISMIC_DIR,
    total_high_risk_countries: cards.length,
    issued_countries: issued,
    non_issued_countries: cards.length - issued,
    sovereign_issuing_countries: cards.filter((c) => c.has_sovereign_or_public_cat_bond).length
  };

  await Promise.all([
    writeJson(OUT.seismicCards, { generated_at: new Date().toISOString(), source_root: SEISMIC_DIR, cards }),
    writeJson(OUT.seismicCoverage, coverage),
    writeJson(
      OUT.seismicGlobePoints,
      cards.map((c) => ({
        id: c.id,
        country_name: c.country_name,
        slug: c.slug,
        lat: c.lat,
        lng: c.lng,
        high_seismic_risk_flag: c.high_seismic_risk_flag,
        has_any_cat_bond: c.has_any_cat_bond,
        has_sovereign_or_public_cat_bond: c.has_sovereign_or_public_cat_bond,
        sovereign_flag: c.has_sovereign_or_public_cat_bond,
        market_segment: c.has_sovereign_or_public_cat_bond
          ? "Sovereign"
          : c.has_private_or_corporate_cat_bond
            ? "Non-Sovereign"
            : "No Issuance",
        deal_count: c.issuance_count,
        total_volume_usd: c.total_volume_usd,
        main_peril: c.main_perils[0] || "Not stated",
        latest_issue_year: inferYear(c.latest_issue_date),
        tooltip_title: `${c.country_name} - ${c.issuance_status}`,
        tooltip_text: c.insight,
        destination_url: c.destination_url
      }))
    ),
    writeJson(
      OUT.seismicIssuanceByYear,
      agg(det.filter((d) => d.year != null), (d) => String(d.year), (d) => d.volume)
        .map(([k, v]) => ({ year: Number(k), issuance_volume_usd: round(v.sum, 2), issuance_volume_musd: round(v.sum / 1_000_000, 3) }))
        .sort((a, b) => a.year - b.year)
    ),
    writeJson(OUT.seismicTriggerDistribution, countVol(det, (d) => d.trigger)),
    writeJson(OUT.seismicPerilDistribution, countVol(det, (d) => d.peril))
  ]);
}
async function writeHomeKpis(kpis, generatedAt) {
  await writeJson(OUT.homeKpis, {
    enabled: true,
    section_title: "Executive KPI Strip",
    section_subtitle: "Deal-level metrics generated from SQL-ready package",
    generated_at: generatedAt,
    source: "final_outputs_country_fixed/sql_ready_package",
    items: [
      {
        id: "total_deals",
        label: "Total Deals",
        value: kpis.total_deals.toLocaleString("en-US"),
        note: "COUNT DISTINCT(deal_id)",
        definition: "Unique deal records in cleaned master dataset.",
        interpretation: "Transaction-level coverage.",
        data_type: "historical"
      },
      {
        id: "cumulative_issuance",
        label: "Cumulative Issuance",
        value: usdFmt(kpis.cumulative_issuance_usd),
        note: `${(kpis.cumulative_issuance_usd / 1e9).toFixed(2)}B USD`,
        definition: "SUM(deal-level issuance).",
        interpretation: "Historical issuance total.",
        data_type: "historical"
      },
      {
        id: "sovereign_deals",
        label: "Sovereign Deals",
        value: kpis.sovereign_deal_count.toLocaleString("en-US"),
        note: "Sovereign classification",
        definition: "Deals with sovereign_flag=true.",
        interpretation: "Sovereign participation depth.",
        data_type: "derived"
      },
      {
        id: "countries_covered",
        label: "Countries Covered",
        value: kpis.countries_covered.toLocaleString("en-US"),
        note: "Distinct sponsor countries",
        definition: "Distinct countries in dataset.",
        interpretation: "Geographic breadth.",
        data_type: "derived"
      },
      {
        id: "latest_market_year",
        label: "Latest Market Year",
        value: String(kpis.latest_market_year || "N/A"),
        note: "MAX(deal_year)",
        definition: "Latest issuance year represented.",
        interpretation: "Recency signal.",
        data_type: "historical"
      }
    ]
  });
}

async function writeReport(mainData) {
  const lines = [
    "# DATA_INTEGRATION_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Old Sources Replaced",
    "- Legacy local master/mock/static deal datasets are bypassed by generated JSON from SQL-ready packages.",
    "- Home KPIs are regenerated from canonical SQL-ready outputs.",
    "",
    "## Canonical Sources Used",
    `- ${rel(SRC.deals)}`,
    `- ${rel(SRC.tranches)}`,
    `- ${rel(SRC.pricing)}`,
    `- ${rel(SRC.issuers)}`,
    `- ${rel(SRC.metrics)}`,
    `- ${rel(SRC.seismicSummary)}`,
    `- ${rel(SRC.seismicDetailed)}`,
    "",
    "## Data Mapping",
    "- deals_master_sql_ready.csv -> deal-level base records + top-level summaries",
    "- tranches_core_sql_ready.csv -> tranche enrichment, perils/triggers, maturity status, volume fallback",
    "- pricing_and_returns_sql_ready.csv -> spread/expected-loss/risk enrichment",
    "- issuers_entities_sql_ready.csv -> sponsor/issuer metadata enrichment",
    "- calculated_metrics_sql_ready.csv -> reserved as derived-metrics source in pipeline context",
    "- seismic package -> high-seismic-risk cards/charts/map datasets",
    "",
    "## Pages/Components Powered By Generated Datasets",
    "- Homepage KPI strip and globe",
    "- Global Market Dashboard",
    "- Sovereign Dashboard",
    "- Pricing Intelligence",
    "- Risk Gap Module",
    "- Deal Explorer / Deal Pages",
    "- Country list and country pages",
    "- High Seismic Risk Countries page",
    "",
    "## Deduplication",
    "- Primary key: deal_id",
    "- Fallback key: deterministic hash(deal_name|series|issue/pricing date|sponsor|country|size)",
    "- Tranches are preserved for tranche analytics and aggregated once to enrich deal-level records.",
    "",
    "## Cleaning Applied",
    "- trim/null normalization, numeric parsing, boolean normalization",
    "- date normalization to YYYY-MM-DD when possible",
    "- peril/trigger category normalization",
    "- coordinate fallback for unmapped countries",
    ""
  ];

  if (mainData?.dedup) {
    lines.push(
      "## Dedup Audit Summary",
      `- raw_rows: ${mainData.dedup.raw}`,
      `- duplicates_removed: ${mainData.dedup.removed}`,
      `- cleaned_rows: ${mainData.dedup.rows.length}`,
      ""
    );
  }

  if (warnings.length) {
    lines.push("## Warnings", ...warnings.map((w) => `- ${w}`), "");
  }

  await writeFile(OUT.report, lines.join("\n"));
}

function dedupDeals(rows) {
  const seen = new Set();
  let byDealId = 0;
  let byFallback = 0;
  let missingDealId = 0;
  const out = [];

  for (const row of rows) {
    const id = clean(row.deal_id);
    if (!id) missingDealId += 1;
    const key = id || fallbackDealId(row);
    if (!key) continue;
    if (seen.has(key)) {
      if (id) byDealId += 1;
      else byFallback += 1;
      continue;
    }
    seen.add(key);
    out.push(row);
  }

  return {
    rows: out,
    raw: rows.length,
    removed: byDealId + byFallback,
    byDealId,
    byFallback,
    missingDealId
  };
}

function fallbackDealId(r) {
  return `DL-FALLBACK-${sha(
    [
      clean(r.deal_name),
      clean(r.series_name),
      clean(r.issue_date),
      clean(r.pricing_date),
      clean(r.sponsor_name),
      clean(r.country_of_sponsor),
      clean(r.total_deal_size_ils_m)
    ].join("|")
  )}`;
}

function sha(x) {
  return crypto
    .createHash("sha1")
    .update(String(x))
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

function aggregateTranches(rows) {
  const map = new Map();
  for (const r of rows) {
    const id = clean(r.deal_id);
    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, {
        trancheCount: 0,
        // volumeMusd is set ONCE from the first tranche row because original_amount
        // in tranches_core_sql_ready.csv stores the DEAL TOTAL (not per-class amount)
        // and is duplicated across every class row for the same deal.
        // Summing it across tranche rows would multiply-count multi-class deals.
        volumeMusd: trancheVolumeMusd(r),
        spreads: [],
        expecteds: [],
        risks: [],
        perils: new Set(),
        triggerCounts: new Map(),
        activeCount: 0,
        maturedCount: 0,
        triggeredCount: 0,
        sovereignCount: 0,
        nonSovereignCount: 0,
        principalLossIlsM: 0,
        brokers: [],
        bookrunners: [],
        placements: []
      });
    }

    const x = map.get(id);
    x.trancheCount += 1;
    // Do NOT re-add volumeMusd here — it was already set correctly on first encounter.
    pushNum(x.spreads, num(r.final_spread_bps));
    pushNum(x.expecteds, num(r.expected_loss_percent));
    pushNum(x.risks, firstNum(num(r.risk_multiple), num(r.spread_to_el_ratio)));
    splitPerils(r.covered_perils).forEach((p) => x.perils.add(p));
    const trg = normalizeTrigger(clean(r.trigger_type_canonical) || clean(r.trigger_type) || "Unknown");
    x.triggerCounts.set(trg, (x.triggerCounts.get(trg) || 0) + 1);

    if (/active/i.test(clean(r.active_or_matured) || "")) x.activeCount += 1;
    if (/matured/i.test(clean(r.active_or_matured) || "")) x.maturedCount += 1;
    if (parseBool(r.triggered_flag) || parseBool(r.triggered_deal_flag)) x.triggeredCount += 1;

    if (
      parseBool(r.sovereign_flag) ||
      parseBool(r.government_program_flag) ||
      /sovereign|government|public/i.test(clean(r.sovereign_or_corporate) || "")
    ) {
      x.sovereignCount += 1;
    } else {
      x.nonSovereignCount += 1;
    }

    x.principalLossIlsM += num(r.principal_loss_ils_m) || 0;
    pushStr(x.brokers, findCol(r, /(broker|arranger)/i));
    pushStr(x.bookrunners, findCol(r, /(bookrunner|lead manager|underwriter)/i));
    pushStr(x.placements, findCol(r, /(placement agent|placement)/i));
  }

  return new Map(
    [...map.entries()].map(([k, v]) => [
      k,
      {
        ...v,
        perils: [...v.perils],
        trigger: topKey(v.triggerCounts),
        spread: avg(v.spreads),
        expected: avg(v.expecteds),
        risk: avg(v.risks),
        broker: mode(v.brokers),
        bookrunner: mode(v.bookrunners),
        placement: mode(v.placements)
      }
    ])
  );
}
function aggregatePricing(rows) {
  const map = new Map();
  for (const r of rows) {
    const id = clean(r.deal_id);
    if (!id) continue;
    if (!map.has(id)) map.set(id, { spreads: [], expecteds: [], risks: [] });
    const x = map.get(id);
    pushNum(x.spreads, num(r.final_spread_bps));
    pushNum(x.expecteds, num(r.expected_loss_percent));
    pushNum(x.risks, num(r.risk_multiple));
  }
  return new Map(
    [...map.entries()].map(([k, v]) => [k, { spread: avg(v.spreads), expected: avg(v.expecteds), risk: avg(v.risks) }])
  );
}

function globalKpis(deals, generatedAt) {
  const usd = sum(deals.map((d) => d.total_deal_size_usd));
  const busd = usd / 1e9;
  return {
    generated_at: generatedAt,
    total_deals: deals.length,
    cumulative_issuance_musd: usd / 1e6,
    cumulative_issuance_usd: usd,
    total_market_volume_musd: usd / 1e6,
    total_market_volume_usd: usd,
    sovereign_deal_count: deals.filter((d) => d.sovereign_flag).length,
    non_sovereign_deal_count: deals.filter((d) => !d.sovereign_flag).length,
    countries_covered: new Set(deals.map((d) => d.country_name)).size,
    latest_market_year: max(deals.map((d) => d.deal_year)),
    largest_sovereign_issuer:
      topAgg(
        deals.filter((d) => d.sovereign_flag),
        (d) => clean(d.sponsor_name) || "Not stated",
        (d) => d.total_deal_size_usd
      )?.key || null,
    outstanding_market_size_usd: 47_000_000_000,
    outstanding_market_size_note: "Estimated outstanding market size based on industry sources (~$47B as of 2025)",
    triggered_deal_coverage_note: "Triggered deal coverage may be incomplete for older vintages.",
    validation: {
      expected_total_volume_busd_range: [180, 220],
      actual_total_volume_busd: round(busd, 3),
      within_expected_range: busd >= 180 && busd <= 220
    }
  };
}

function issuanceByYear(deals) {
  const segments = [
    { key: "all", f: () => true, label: "All" },
    { key: "sovereign", f: (d) => d.sovereign_flag, label: "Sovereign" },
    { key: "non_sovereign", f: (d) => !d.sovereign_flag, label: "Non-Sovereign" }
  ];

  const out = [];
  for (const s of segments) {
    countVol(
      deals.filter((d) => d.deal_year != null && s.f(d)),
      (d) => String(d.deal_year)
    ).forEach((r) =>
      out.push({
        year: Number(r.key),
        segment: s.label,
        segment_key: s.key,
        deal_count: r.deal_count,
        total_volume_usd: r.total_volume_usd,
        total_volume_musd: r.total_volume_musd
      })
    );
  }
  return out.sort((a, b) => a.year - b.year || a.segment_key.localeCompare(b.segment_key));
}

function distBy(deals, key, outKey) {
  return countVol(deals, (d) => d[key] || "Unknown").map((r) => ({
    [outKey]: r.key,
    deal_count: r.deal_count,
    total_volume_usd: r.total_volume_usd,
    total_volume_musd: r.total_volume_musd
  }));
}

function countVol(rows, keyFn) {
  return agg(rows, keyFn, (r) => r.total_deal_size_usd || r.volume || 0)
    .map(([k, v]) => ({
      key: k,
      deal_count: v.count,
      total_volume_usd: v.sum,
      total_volume_musd: v.sum / 1e6
    }))
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd);
}

function agg(rows, keyFn, valFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r) || "Unknown";
    if (!m.has(k)) m.set(k, { count: 0, sum: 0 });
    const x = m.get(k);
    x.count += 1;
    x.sum += valFn(r) || 0;
  }
  return [...m.entries()];
}

function sovereignVsPrivate(deals) {
  const s = deals.filter((d) => d.sovereign_flag);
  const n = deals.filter((d) => !d.sovereign_flag);

  return {
    summary_by_sovereign_flag: [
      {
        segment: "Sovereign",
        sovereign_flag: true,
        deal_count: s.length,
        total_volume_usd: sum(s.map((d) => d.total_deal_size_usd)),
        total_volume_musd: sum(s.map((d) => d.total_deal_size_usd)) / 1e6
      },
      {
        segment: "Non-Sovereign",
        sovereign_flag: false,
        deal_count: n.length,
        total_volume_usd: sum(n.map((d) => d.total_deal_size_usd)),
        total_volume_musd: sum(n.map((d) => d.total_deal_size_usd)) / 1e6
      }
    ],
    summary_by_market_segment: countVol(deals, (d) => d.market_segment).map((r) => ({
      market_segment: r.key,
      deal_count: r.deal_count,
      total_volume_usd: r.total_volume_usd,
      total_volume_musd: r.total_volume_musd
    })),
    trigger_by_market_segment: countVol(
      deals.map((d) => ({ ...d, key: `${d.market_segment}|||${d.trigger_type_normalized}` })),
      (d) => d.key
    ).map((r) => {
      const [m, t] = r.key.split("|||");
      return { market_segment: m, trigger_type: t, deal_count: r.deal_count, total_volume_usd: r.total_volume_usd, total_volume_musd: r.total_volume_musd };
    }),
    peril_by_market_segment: countVol(
      deals.map((d) => ({ ...d, key: `${d.market_segment}|||${d.peril_category}` })),
      (d) => d.key
    ).map((r) => {
      const [m, p] = r.key.split("|||");
      return { market_segment: m, peril: p, deal_count: r.deal_count, total_volume_usd: r.total_volume_usd, total_volume_musd: r.total_volume_musd };
    })
  };
}

function rankCountries(deals) {
  return countVol(deals, (d) => d.country_name)
    .map((r) => ({
      country_name: r.key,
      country_slug: slug(r.key),
      deal_count: r.deal_count,
      sovereign_flag: deals.some((d) => d.country_name === r.key && d.sovereign_flag),
      total_volume_usd: r.total_volume_usd,
      total_volume_musd: r.total_volume_musd,
      latest_issue_year: max(deals.filter((d) => d.country_name === r.key).map((d) => d.deal_year))
    }))
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function rankSponsors(deals) {
  return countVol(deals, (d) => clean(d.sponsor_name) || "Not stated")
    .map((r) => ({
      sponsor_name: r.key,
      deal_count: r.deal_count,
      sovereign_deal_count: deals.filter((d) => (clean(d.sponsor_name) || "Not stated") === r.key && d.sovereign_flag).length,
      total_volume_usd: r.total_volume_usd,
      total_volume_musd: r.total_volume_musd
    }))
    .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function topIntermediary(deals, field, label) {
  const has = deals.some((d) => clean(d[field]));
  if (!has) return { label, field_used: field, field_available: false, rows: [] };

  const tot = sum(deals.map((d) => d.total_deal_size_usd));
  return {
    label,
    field_used: field,
    field_available: true,
    rows: countVol(
      deals.filter((d) => clean(d[field])),
      (d) => clean(d[field])
    ).map((r, i) => ({
      rank: i + 1,
      name: r.key,
      deal_count: r.deal_count,
      sovereign_deal_count: deals.filter((d) => clean(d[field]) === r.key && d.sovereign_flag).length,
      total_volume_usd: r.total_volume_usd,
      total_volume_musd: r.total_volume_musd,
      market_share_percent: tot ? (r.total_volume_usd / tot) * 100 : 0
    }))
  };
}

function heatmap(deals, key, colName) {
  return countVol(
    deals
      .filter((d) => d.deal_year != null)
      .map((d) => ({ ...d, key: `${d.deal_year}|||${d[key] || "Unknown"}` })),
    (d) => d.key
  )
    .map((r) => {
      const [y, c] = r.key.split("|||");
      return {
        year: Number(y),
        [colName]: c,
        deal_count: r.deal_count,
        total_volume_usd: r.total_volume_usd,
        total_volume_musd: r.total_volume_musd
      };
    })
    .sort((a, b) => a.year - b.year || String(a[colName]).localeCompare(String(b[colName])));
}
function histogram(vals, step, metric, generatedAt) {
  const arr = vals.filter(fin);
  if (!arr.length) {
    return {
      generated_at: generatedAt,
      metric,
      source: "deals_master_sql_ready.csv",
      bucket_size: step,
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

  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const st = Math.floor(mn / step) * step;
  const en = Math.ceil(mx / step) * step;
  const buckets = [];
  for (let a = st; a < en; a += step) {
    buckets.push({
      bin_start: round(a, 6),
      bin_end: round(a + step, 6),
      count: arr.filter((x) => x >= a && x < a + step).length
    });
  }

  return {
    generated_at: generatedAt,
    metric,
    source: "deals_master_sql_ready.csv",
    bucket_size: step,
    count: arr.length,
    min: round(mn, 6),
    max: round(mx, 6),
    mean: round(avg(arr), 6),
    median: round(med(arr), 6),
    p25: round(q(arr, 0.25), 6),
    p75: round(q(arr, 0.75), 6),
    buckets
  };
}

function triggeredSummary(deals, generatedAt) {
  const t = deals.filter((d) => d.triggered_deal_flag);
  return {
    generated_at: generatedAt,
    source: "deals_master_sql_ready.csv",
    total_triggered_deals: t.length,
    total_principal_loss_usd: sum(t.map((d) => d.total_principal_loss_usd || 0)),
    total_principal_loss_musd: sum(t.map((d) => d.total_principal_loss_usd || 0)) / 1e6,
    by_year: agg(
      t.filter((d) => d.deal_year != null),
      (d) => String(d.deal_year),
      (d) => d.total_principal_loss_usd || 0
    )
      .map(([y, v]) => ({
        year: Number(y),
        deal_count: t.filter((d) => String(d.deal_year) === y).length,
        principal_loss_usd: v.sum,
        principal_loss_musd: v.sum / 1e6
      }))
      .sort((a, b) => a.year - b.year),
    by_country: agg(
      t,
      (d) => d.country_name || "Not stated",
      (d) => d.total_principal_loss_usd || 0
    )
      .map(([c, v]) => ({
        country_name: c,
        deal_count: t.filter((d) => (d.country_name || "Not stated") === c).length,
        principal_loss_usd: v.sum,
        principal_loss_musd: v.sum / 1e6
      }))
      .sort((a, b) => b.principal_loss_usd - a.principal_loss_usd)
      .slice(0, 20)
  };
}

function pricingIntelligence(deals, generatedAt) {
  const p = deals.filter((d) => fin(d.average_expected_loss_percent) && fin(d.average_final_spread_bps));
  const mk = (rows, kf, keyName) =>
    agg(rows, kf, () => 1)
      .map(([k, v]) => {
        const subset = rows.filter((r) => kf(r) === k);
        return {
          [keyName]: k,
          count: v.count,
          avg_spread_bps: avg(subset.map((s) => s.average_final_spread_bps)) || 0,
          avg_expected_loss_percent: avg(subset.map((s) => s.average_expected_loss_percent)) || 0
        };
      })
      .sort((a, b) => b.avg_spread_bps - a.avg_spread_bps);

  return {
    generated_at: generatedAt,
    pricing_by_peril: mk(p, (d) => d.peril_category || "Other", "peril"),
    pricing_by_trigger: mk(p, (d) => d.trigger_type_normalized || "Unknown", "trigger"),
    segment_pricing: mk(p, (d) => (d.sovereign_flag ? "Sovereign" : "Non-Sovereign"), "segment")
  };
}

function sovereignDashboard(deals, generatedAt) {
  const s = deals.filter((d) => d.sovereign_flag);
  return {
    generated_at: generatedAt,
    kpis: {
      dealCount: s.length,
      totalVolumeUsd: sum(s.map((d) => d.total_deal_size_usd)),
      countries: new Set(s.map((d) => d.country_name)).size,
      avgExpectedLoss: avg(s.map((d) => d.average_expected_loss_percent).filter(fin)),
      avgSpreadBps: avg(s.map((d) => d.average_final_spread_bps).filter(fin)),
      latestYear: max(s.map((d) => d.deal_year))
    },
    issuanceByYear: countVol(
      s.filter((d) => d.deal_year != null),
      (d) => String(d.deal_year)
    )
      .map((r) => ({ year: Number(r.key), deal_count: r.deal_count, total_volume_usd: r.total_volume_usd }))
      .sort((a, b) => a.year - b.year),
    perilMix: countVol(s, (d) => d.peril_category || "Other")
      .map((r) => ({ name: r.key, deal_count: r.deal_count, total_volume_usd: r.total_volume_usd }))
      .slice(0, 10),
    triggerMix: countVol(s, (d) => d.trigger_type_normalized || "Unknown")
      .map((r) => ({ name: r.key, deal_count: r.deal_count, total_volume_usd: r.total_volume_usd }))
      .slice(0, 10),
    topSponsors: countVol(s, (d) => clean(d.sponsor_name) || "Not stated")
      .map((r) => ({ name: r.key, deal_count: r.deal_count, total_volume_usd: r.total_volume_usd }))
      .slice(0, 10),
    topCountries: countVol(s, (d) => d.country_name || "Not stated")
      .map((r) => ({ name: r.key, deal_count: r.deal_count, total_volume_usd: r.total_volume_usd }))
      .slice(0, 10)
  };
}

function aggregateCountries(deals) {
  const m = new Map();
  for (const d of deals) {
    const c = d.country_name || "Not stated";
    if (!m.has(c)) m.set(c, { country: c, slug: slug(c), region: d.region_normalized || "Not stated", deals: [] });
    m.get(c).deals.push(d);
  }

  const index = [];
  const kpis = [];
  const globe = [];
  const riskGapRows = [];

  for (const { country, slug: s, region, deals: ds } of m.values()) {
    const vol = sum(ds.map((d) => d.total_deal_size_usd));
    const years = ds.map((d) => d.deal_year).filter((x) => x != null);
    const sovereignCount = ds.filter((d) => d.sovereign_flag).length;
    const nonCount = ds.length - sovereignCount;
    const peril = topAgg(ds, (d) => d.peril_category || "Other", () => 1)?.key || "Not stated";
    const trgs = [...new Set(ds.map((d) => d.trigger_type_normalized).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const seg = sovereignCount && nonCount ? "Mixed" : sovereignCount ? "Sovereign" : "Non-Sovereign";
    const p = coords(country);

    index.push({
      id: s,
      country_name: country,
      slug: s,
      region,
      sovereign_flag: sovereignCount > 0,
      market_segment_summary: seg,
      deal_count: ds.length,
      sovereign_deal_count: sovereignCount,
      non_sovereign_deal_count: nonCount,
      total_volume_usd: vol,
      total_volume_musd: vol / 1e6,
      latest_issue_year: years.length ? Math.max(...years) : null,
      main_peril: peril,
      trigger_types: trgs,
      model_types: [seg],
      sovereign_activity_summary: sovereignCount > 0 ? `Sovereign activity present (${sovereignCount} deals).` : "No sovereign deals detected in current dataset.",
      summary: `${country} has ${ds.length} recorded catastrophe bond deals with cumulative issuance of ${usdFmt(vol)}.`,
      latitude: p.lat,
      longitude: p.lng,
      destination_url: `/countries/${s}`
    });

    kpis.push({
      slug: s,
      country_name: country,
      region,
      deal_count: ds.length,
      total_volume_usd: vol,
      total_volume_musd: vol / 1e6,
      latest_issue_year: years.length ? Math.max(...years) : null,
      main_peril: peril,
      sovereign_flag: sovereignCount > 0,
      sovereign_activity_summary: sovereignCount > 0 ? `Sovereign issuance observed across ${sovereignCount} deals.` : "No sovereign issuance recorded.",
      market_segment_breakdown: [
        { segment: "Sovereign", count: sovereignCount },
        { segment: "Non-Sovereign", count: nonCount }
      ],
      trigger_breakdown: trgs.map((t) => ({ trigger: t, count: ds.filter((d) => d.trigger_type_normalized === t).length })),
      yearly_issuance: countVol(
        ds.filter((d) => d.deal_year != null),
        (d) => String(d.deal_year)
      )
        .map((r) => ({ year: Number(r.key), count: r.deal_count, total_volume_usd: r.total_volume_usd }))
        .sort((a, b) => a.year - b.year)
    });

    globe.push({
      id: s,
      country_name: country,
      slug: s,
      lat: p.lat,
      lng: p.lng,
      sovereign_flag: sovereignCount > 0,
      market_segment: seg,
      market_segment_summary: seg,
      deal_count: ds.length,
      total_volume_usd: vol,
      total_volume_musd: vol / 1e6,
      main_peril: peril,
      latest_issue_year: years.length ? Math.max(...years) : null,
      tooltip_title: `${country} - ${ds.length} deals`,
      tooltip_text: `${seg} | Main peril: ${peril} | Latest year: ${years.length ? Math.max(...years) : "N/A"}`,
      destination_url: `/countries/${s}`
    });

    const gap = Math.min(
      100,
      (ds.length ? (ds.length <= 2 ? 40 : ds.length <= 5 ? 20 : 0) : 85) +
        (years.length
          ? new Date().getUTCFullYear() - Math.max(...years) > 8
            ? 25
            : new Date().getUTCFullYear() - Math.max(...years) > 4
              ? 12
              : 0
          : 20) +
        (sovereignCount ? 0 : 12) +
        (vol < 5e8 ? 10 : 0)
    );

    riskGapRows.push({
      country_name: country,
      slug: s,
      region,
      deal_count: ds.length,
      total_volume_usd: vol,
      latest_issue_year: years.length ? Math.max(...years) : null,
      sovereign_flag: sovereignCount > 0,
      gap_label: gap >= 65 ? "High Gap" : gap >= 35 ? "Moderate Gap" : "Low Gap",
      gap_score: round(gap, 2),
      rationale:
        ds.length === 0
          ? "No recorded issuance in current dataset."
          : sovereignCount === 0
            ? "Issuance exists but sovereign participation is not observed."
            : "Sovereign issuance footprint is present."
    });
  }

  index.sort((a, b) => a.country_name.localeCompare(b.country_name));
  kpis.sort((a, b) => a.country_name.localeCompare(b.country_name));
  globe.sort((a, b) => b.total_volume_usd - a.total_volume_usd);
  riskGapRows.sort((a, b) => b.gap_score - a.gap_score);

  return { index, kpis, globe, riskGapRows };
}
function dealSlugIndex(deals) {
  const used = new Set();
  const idx = {};

  for (const d of deals) {
    const base = slug(`${d.deal_name || "deal"}-${d.deal_year || "na"}`);
    let s = base;
    let i = 2;
    while (used.has(s)) {
      s = `${base}-${i}`;
      i += 1;
    }
    used.add(s);
    idx[d.id] = s;
    if (d.deal_id) idx[d.deal_id] = s;
  }

  return { generated_at: new Date().toISOString(), total_deals: deals.length, index: idx };
}

function coords(country) {
  if (COORDS[country]) return { ...COORDS[country], source: "mapped" };
  const h = parseInt(sha(country).slice(0, 6), 16);
  return {
    lat: ((h % 1200) / 10) - 60,
    lng: ((Math.floor(h / 7) % 3600) / 10) - 180,
    source: "fallback_hash"
  };
}

function trancheVolumeMusd(r) {
  const oa = num(r.original_amount);
  const cur = clean(r.original_currency);
  const fx = num(r.fx_rate_to_ils) || USD_ILS;
  if (oa && oa > 0) return !cur || /usd/i.test(cur) ? oa : (oa * fx) / USD_ILS;
  const ils =
    num(r.tranche_size_ils_m) ||
    num(r.original_notional_ils_m) ||
    num(r.current_notional_ils_m) ||
    num(r.outstanding_amount_ils_m) ||
    0;
  return ils / USD_ILS;
}

function splitPerils(v) {
  const t = clean(v);
  if (!t) return [];
  return dedupe(
    String(t)
      .replace(/\band\b/gi, ";")
      .replace(/[|,/]+/g, ";")
      .split(";")
      .map((x) => normalizePeril(x.trim()))
      .filter(Boolean)
  );
}

function splitSemi(v) {
  const t = clean(v);
  if (!t) return [];
  return dedupe(
    String(t)
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

function normalizePeril(v) {
  const x = (clean(v) || "").toLowerCase();
  if (!x) return "Other";
  if (x.includes("multi")) return "Multi-Peril";
  if (x.includes("earthquake") || x.includes("seismic")) return "Earthquake";
  if (
    x.includes("hurricane") ||
    x.includes("named storm") ||
    x.includes("typhoon") ||
    x.includes("cyclone") ||
    x.includes("wind")
  ) {
    return "Hurricane / Wind";
  }
  if (x.includes("flood") || x.includes("rainfall")) return "Flood";
  return title(x);
}

function perilCategory(tags) {
  const u = dedupe((tags || []).map((p) => normalizePeril(p)));
  if (!u.length) return "Other";
  return u.length > 1 ? "Multi-Peril" : u[0];
}

function normalizeTrigger(v) {
  const x = (clean(v) || "").toLowerCase();
  if (!x) return "Unknown";
  if (x.includes("param")) return "Parametric";
  if (x.includes("indemn")) return "Indemnity";
  if (x.includes("industry") || x.includes("index")) return "Industry Loss";
  if (x.includes("model")) return "Modelled Loss";
  if (x.includes("hybrid") || x.includes("multiple")) return "Hybrid";
  return title(x);
}

function normalizeRegion(v) {
  const x = (clean(v) || "").toLowerCase();
  if (!x) return "Not stated";
  if (x.includes("latin")) return "Latin America";
  if (x.includes("caribbean")) return "Caribbean";
  if (x.includes("north america")) return "North America";
  if (x.includes("asia")) return "Asia-Pacific";
  if (x.includes("middle east")) return "Middle East";
  if (x.includes("europe")) return "Europe";
  if (x.includes("africa")) return "Middle East / Africa";
  if (x.includes("global")) return "Global";
  return title(x);
}

function normalizeCountry(v) {
  const t = clean(v) || "Not stated";
  return title(
    t
      .replace(/^usa$/i, "United States")
      .replace(/^u\.s\.a\.?$/i, "United States")
      .replace(/^us$/i, "United States")
      .replace(/^uk$/i, "United Kingdom")
  );
}

function title(v) {
  return String(v || "")
    .toLowerCase()
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ")
    .trim();
}

function readCsv(file) {
  return fs
    .readFile(file, "utf8")
    .then(parseCsv)
    .catch((e) => {
      warnings.push(`CSV read failed: ${file} (${e.message})`);
      return [];
    });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let val = "";
  let q = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];

    if (q) {
      if (c === '"' && n === '"') {
        val += '"';
        i += 1;
      } else if (c === '"') {
        q = false;
      } else {
        val += c;
      }
      continue;
    }

    if (c === '"') {
      q = true;
      continue;
    }
    if (c === ",") {
      row.push(val);
      val = "";
      continue;
    }
    if (c === "\n") {
      row.push(val);
      rows.push(row);
      row = [];
      val = "";
      continue;
    }
    if (c !== "\r") val += c;
  }

  if (val.length || row.length) {
    row.push(val);
    rows.push(row);
  }
  if (!rows.length) return [];

  const h = rows[0].map((x) =>
    String(x || "")
      .trim()
      .replace(/^\uFEFF/, "")
      .replace(/\s+/g, "_")
      .toLowerCase()
  );

  return rows
    .slice(1)
    .filter((r) => r.some((x) => String(x || "").trim()))
    .map((r) =>
      Object.fromEntries(h.map((k, i) => [k, r[i] == null ? "" : String(r[i])]))
    );
}

function writeJson(file, data) {
  return ensure(path.dirname(file)).then(() =>
    fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8")
  );
}

function writeFile(file, txt) {
  return ensure(path.dirname(file)).then(() => fs.writeFile(file, txt, "utf8"));
}

function ensure(dir) {
  return fs.mkdir(dir, { recursive: true });
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function clean(v) {
  if (v == null) return null;
  const x = String(v).trim();
  if (!x || /^(null|none|na|n\/a|nan)$/i.test(x)) return null;
  return x;
}

function num(v) {
  const x = clean(v);
  if (!x) return null;
  const n = Number(x.replace(/[$,%]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function int(v) {
  const n = num(v);
  return n == null ? null : Math.trunc(n);
}

function parseBool(v) {
  const x = clean(v);
  return !!x && /^(true|1|yes|y)$/i.test(x);
}

function normDate(v) {
  const x = clean(v);
  if (!x) return null;
  const m = x.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function inferYear(v) {
  const m = String(v || "").match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

function slug(v) {
  return (
    String(v || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function usdFmt(v) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(v || 0);
}

function dedupe(a) {
  return [...new Set((a || []).filter(Boolean))];
}

function fin(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function pushNum(arr, v) {
  if (fin(v)) arr.push(v);
}

function pushStr(arr, v) {
  const x = clean(v);
  if (x) arr.push(x);
}

function firstNum(...vals) {
  for (const v of vals) if (fin(v)) return v;
  return null;
}

function sum(arr) {
  return (arr || []).reduce((s, v) => s + (fin(v) ? v : 0), 0);
}

function avg(arr) {
  const n = (arr || []).filter(fin);
  return n.length ? sum(n) / n.length : null;
}

function med(arr) {
  const n = (arr || []).filter(fin).sort((a, b) => a - b);
  if (!n.length) return null;
  const m = Math.floor(n.length / 2);
  return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2;
}

function q(arr, p) {
  const n = (arr || []).filter(fin).sort((a, b) => a - b);
  if (!n.length) return null;
  const i = (n.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? n[lo] : n[lo] + (n[hi] - n[lo]) * (i - lo);
}

function max(arr) {
  const n = (arr || []).filter(fin);
  return n.length ? Math.max(...n) : null;
}

function topKey(map) {
  return !map?.size ? null : [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function mode(arr) {
  if (!arr?.length) return null;
  const m = new Map();
  arr.forEach((x) => m.set(x, (m.get(x) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function topAgg(rows, keyFn, valFn) {
  const a = agg(rows, keyFn, valFn).sort((x, y) => y[1].sum - x[1].sum)[0];
  return a ? { key: a[0], sum: a[1].sum } : null;
}

function findCol(row, re) {
  for (const k of Object.keys(row)) {
    if (re.test(k) && clean(row[k])) return clean(row[k]);
  }
  return null;
}

function round(v, d = 2) {
  return fin(v) ? Math.round(v * 10 ** d) / 10 ** d : null;
}
