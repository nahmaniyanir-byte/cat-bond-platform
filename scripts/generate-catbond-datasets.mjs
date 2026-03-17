#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.resolve(ROOT, "..", "final_outputs_country_fixed", "sql_ready_package");
const MASTER_FILES = ["deals_master_clean.csv", "deals_master_sql_ready.csv"];
const TRANCHE_FILES = ["tranches_core_sql_ready.csv"];

const OUT = {
  master: path.join(ROOT, "data", "master", "cat_bond_master_database.json"),
  dedup: path.join(ROOT, "data", "master", "dedup_audit.json"),
  audit: path.join(ROOT, "data", "master", "data_audit_summary.json"),
  gkpiMaster: path.join(ROOT, "data", "master", "global_kpis.json"),
  gkpi: path.join(ROOT, "data", "chart_data", "global_kpis.json"),
  issuance: path.join(ROOT, "data", "chart_data", "issuance_by_year.json"),
  svp: path.join(ROOT, "data", "chart_data", "sovereign_vs_private.json"),
  peril: path.join(ROOT, "data", "chart_data", "peril_distribution.json"),
  trigger: path.join(ROOT, "data", "chart_data", "trigger_distribution.json"),
  topCountries: path.join(ROOT, "data", "chart_data", "top_countries.json"),
  topSponsors: path.join(ROOT, "data", "chart_data", "top_sponsors.json"),
  svsEl: path.join(ROOT, "data", "chart_data", "spread_vs_expected_loss.json"),
  elHist: path.join(ROOT, "data", "chart_data", "expected_loss_distribution.json"),
  spHist: path.join(ROOT, "data", "chart_data", "spread_distribution.json"),
  topSovCountries: path.join(ROOT, "data", "chart_data", "top_sovereign_countries.json"),
  topBrokers: path.join(ROOT, "data", "chart_data", "top_brokers.json"),
  topBookrunners: path.join(ROOT, "data", "chart_data", "top_bookrunners.json"),
  topPlacement: path.join(ROOT, "data", "chart_data", "top_placement_agents.json"),
  heatPeril: path.join(ROOT, "data", "chart_data", "heatmap_year_peril.json"),
  heatTrigger: path.join(ROOT, "data", "chart_data", "heatmap_year_trigger.json"),
  trig: path.join(ROOT, "data", "chart_data", "triggered_deals_summary.json"),
  trigCompat: path.join(ROOT, "data", "chart_data", "triggered_loss_summary.json"),
  countryIndex: path.join(ROOT, "data", "countries", "country_page_index.json"),
  countryKpis: path.join(ROOT, "data", "countries", "country_kpis.json"),
  countryIndexMaster: path.join(ROOT, "data", "master", "country_page_index_master.json"),
  countryKpisMaster: path.join(ROOT, "data", "master", "country_kpis_master.json"),
  globeSummary: path.join(ROOT, "data", "countries", "globe_country_summary.json"),
  globe: path.join(ROOT, "data", "countries", "country_globe_points.json"),
  globeMaster: path.join(ROOT, "data", "master", "country_globe_points_master.json"),
  coords: path.join(ROOT, "data", "countries", "country_coordinates.json"),
  sovereign: path.join(ROOT, "data", "sovereign_deals", "sovereign_deals_master.json"),
  nonSovereign: path.join(ROOT, "data", "private_deals", "private_deals_master.json"),
  homeKpis: path.join(ROOT, "content", "home", "kpis.json")
};

const COORDS = {
  "United States": { lat: 37.0902, lng: -95.7129, region: "North America" },
  Canada: { lat: 56.1304, lng: -106.3468, region: "North America" },
  Mexico: { lat: 23.6345, lng: -102.5528, region: "Latin America" },
  Chile: { lat: -35.6751, lng: -71.543, region: "Latin America" },
  Colombia: { lat: 4.5709, lng: -74.2973, region: "Latin America" },
  Peru: { lat: -9.19, lng: -75.0152, region: "Latin America" },
  Philippines: { lat: 12.8797, lng: 121.774, region: "Asia" },
  Jamaica: { lat: 18.1096, lng: -77.2975, region: "Caribbean" },
  "Dominican Republic": { lat: 18.7357, lng: -70.1627, region: "Caribbean" },
  Israel: { lat: 31.0461, lng: 34.8516, region: "Middle East" },
  Japan: { lat: 36.2048, lng: 138.2529, region: "Asia" },
  Turkey: { lat: 38.9637, lng: 35.2433, region: "Europe / Middle East" },
  "New Zealand": { lat: -40.9006, lng: 174.886, region: "Oceania" }
};

const RMAP = { APAC: "Asia Pacific", LATAM: "Latin America", EMEA: "Europe / Middle East / Africa" };
const C_ALIAS = { usa: "United States", us: "United States", uk: "United Kingdom", turkiye: "Turkey" };

const S = (v) => (v == null ? "" : String(v).trim());
const N = (v) => {
  const t = S(v).replace(/[$,%\s,]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const B = (v) => ["true", "1", "yes", "y"].includes(S(v).toLowerCase());
const D = (v) => {
  const t = S(v);
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const slug = (v) => S(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const canonCountry = (v) => {
  const t = S(v);
  if (!t) return null;
  const k = t.toLowerCase().replace(/[().]/g, "").replace(/\s+/g, " ").trim();
  if (C_ALIAS[k]) return C_ALIAS[k];
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase())
    .join(" ");
};
const pYear = (a, b) => {
  const n = N(a);
  if (n != null) return Math.round(n);
  const m = S(b).match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
};
const normTrig = (v) => {
  const t = S(v).toLowerCase();
  if (!t) return "Other";
  if (t.includes("param")) return "Parametric";
  if (t.includes("indemn")) return "Indemnity";
  if (t.includes("industry")) return "Industry Loss";
  if (t.includes("model")) return "Modelled Loss";
  if (t.includes("hybrid")) return "Hybrid";
  if (t.includes("mortality")) return "Mortality Index";
  return S(v);
};
const normPeril = (v) => {
  const t = S(v).toLowerCase();
  if (!t) return "Other";
  if (/earthquake|seismic|tsunami/.test(t)) return "Earthquake";
  if (/hurricane|named storm|cyclone|typhoon|storm/.test(t)) return "Hurricane / Named Storm";
  if (/flood|rain/.test(t)) return "Flood";
  if (/wildfire|fire/.test(t)) return "Wildfire";
  if (/mortality/.test(t)) return "Mortality";
  if (/multi/.test(t)) return "Multi-Peril";
  return S(v);
};
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const pct = (s, p) => (s.length ? s[Math.floor((s.length - 1) * Math.min(1, Math.max(0, p)))] : null);
const compactM = (m) => (m >= 1_000_000 ? `$${(m / 1_000_000).toFixed(2)}T` : m >= 1_000 ? `$${(m / 1_000).toFixed(1)}B` : `$${m.toFixed(1)}M`);

function csv(text) {
  const rows = [];
  let c = "", r = [], q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];
    if (ch === '"') { if (q && nx === '"') { c += '"'; i++; } else q = !q; continue; }
    if (ch === "," && !q) { r.push(c); c = ""; continue; }
    if ((ch === "\n" || ch === "\r") && !q) {
      if (ch === "\r" && nx === "\n") i++;
      r.push(c);
      c = "";
      if (r.some((x) => S(x))) rows.push(r);
      r = [];
      continue;
    }
    c += ch;
  }
  if (c.length || r.length) { r.push(c); if (r.some((x) => S(x))) rows.push(r); }
  if (!rows.length) return [];
  const h = rows[0].map((x) => S(x).replace(/^\uFEFF/, ""));
  return rows.slice(1).map((cells) => Object.fromEntries(h.map((k, i) => [k, cells[i] ?? ""])));
}

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function write(p, o) { await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, `${JSON.stringify(o, null, 2)}\n`, "utf8"); }
async function readJson(p, f) { if (!(await exists(p))) return f; try { return JSON.parse(await fs.readFile(p, "utf8")); } catch { return f; } }

async function readCsv(root, names) {
  for (const n of names) {
    const p = path.join(root, n);
    if (!(await exists(p))) continue;
    const rows = csv(await fs.readFile(p, "utf8"));
    if (rows.length) return { path: p, rows };
  }
  throw new Error(`CSV not found: ${names.join(", ")}`);
}

function hist(vals, size, prec = 2) {
  if (!vals.length) return { bucket_size: size, count: 0, min: null, max: null, mean: null, median: null, p25: null, p75: null, buckets: [] };
  const s = [...vals].sort((a, b) => a - b), m = new Map();
  for (const v of vals) {
    const a = Math.floor(v / size) * size, b = a + size, k = `${a}|${b}`;
    const z = m.get(k) ?? { bin_start: a, bin_end: b, count: 0 };
    z.count++;
    m.set(k, z);
  }
  return {
    bucket_size: size,
    count: vals.length,
    min: +s[0].toFixed(prec),
    max: +s[s.length - 1].toFixed(prec),
    mean: +(avg(vals) ?? 0).toFixed(prec),
    median: +(pct(s, 0.5) ?? 0).toFixed(prec),
    p25: +(pct(s, 0.25) ?? 0).toFixed(prec),
    p75: +(pct(s, 0.75) ?? 0).toFixed(prec),
    buckets: [...m.values()].sort((a, b) => a.bin_start - b.bin_start).map((x) => ({ bin_start: +x.bin_start.toFixed(prec), bin_end: +x.bin_end.toFixed(prec), count: x.count }))
  };
}

function makeTrancheMap(rows) {
  const m = new Map();
  for (const r of rows) {
    const id = S(r.deal_id);
    if (!id) continue;
    const z = m.get(id) ?? { o: new Set(), per: new Map(), tri: new Map(), el: [], sp: [], rm: [], c: new Map() };
    const o = N(r.original_amount);
    if (o != null) z.o.add(o);
    const p = S(r.peril_group || r.covered_perils);
    if (p) z.per.set(p, (z.per.get(p) ?? 0) + 1);
    const t = S(r.trigger_type_canonical || r.trigger_type);
    if (t) z.tri.set(t, (z.tri.get(t) ?? 0) + 1);
    const el = N(r.expected_loss_percent);
    if (el != null) z.el.push(el);
    const sp = N(r.final_spread_bps);
    if (sp != null) z.sp.push(sp);
    const rm = N(r.risk_multiple);
    if (rm != null) z.rm.push(rm);
    const c = canonCountry(r.country_of_sponsor || r.covered_country);
    if (c) z.c.set(c, (z.c.get(c) ?? 0) + 1);
    m.set(id, z);
  }
  const out = new Map();
  for (const [id, z] of m) {
    out.set(id, {
      original_amount: [...z.o][0] ?? null,
      original_amount_multi: z.o.size > 1,
      peril_type: [...z.per.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      trigger_type: [...z.tri.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      expected_loss: avg(z.el),
      spread: avg(z.sp),
      risk_multiple: avg(z.rm),
      country_name: [...z.c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    });
  }
  return out;
}

function dedup(rows) {
  const ids = new Set(), fb = new Set(), out = [];
  let dId = 0, dFb = 0, miss = 0;
  for (const r of rows) {
    const id = S(r.deal_id);
    if (id) {
      const k = id.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (ids.has(k)) { dId++; continue; }
      ids.add(k);
      out.push(r);
      continue;
    }
    miss++;
    const k = [r.deal_name, r.series_name, r.issue_date, r.country_of_sponsor]
      .map((x) => S(x).toLowerCase().replace(/[^a-z0-9]/g, ""))
      .join("|");
    if (fb.has(k)) { dFb++; continue; }
    fb.add(k);
    out.push(r);
  }
  return {
    rows: out,
    audit: {
      raw_row_count: rows.length,
      deduplicated_row_count: out.length,
      removed_duplicate_rows: rows.length - out.length,
      duplicates_by_deal_id: dId,
      duplicates_by_fallback_key: dFb,
      missing_deal_id_rows: miss,
      primary_key: "deal_id"
    }
  };
}

function agg(rows, keyFn, label) {
  const m = new Map();
  for (const d of rows) {
    const k = keyFn(d);
    const z = m.get(k) ?? { [label]: k, deal_count: 0, total_volume_musd: 0 };
    z.deal_count++;
    z.total_volume_musd += d.original_amount_musd ?? 0;
    m.set(k, z);
  }
  return [...m.values()]
    .sort((a, b) => b.total_volume_musd - a.total_volume_musd)
    .map((x) => ({ ...x, total_volume_musd: +x.total_volume_musd.toFixed(3), total_volume_usd: Math.round(x.total_volume_musd * 1_000_000) }));
}

async function main() {
  const argRoot = process.argv.includes("--source-root")
    ? process.argv[process.argv.indexOf("--source-root") + 1]
    : null;
  const sourceRoot = argRoot ? path.resolve(argRoot) : SRC_ROOT;
  const master = await readCsv(sourceRoot, MASTER_FILES);
  const tranches = await readCsv(sourceRoot, TRANCHE_FILES);
  const tMap = makeTrancheMap(tranches.rows);
  const { rows: dRows, audit: dedupAudit } = dedup(master.rows);
  const ex = await readJson(OUT.countryIndex, { countries: [] });
  const existing = Array.isArray(ex) ? ex : Array.isArray(ex.countries) ? ex.countries : [];

  const srcCount = {
    master_original_amount: 0,
    tranche_original_amount: 0,
    fallback_total_deal_size_ils_m: 0,
    missing: 0
  };

  const deals = dRows.map((r, i) => {
    const id = S(r.deal_id) || `deal-${i + 1}`;
    const tr = tMap.get(S(r.deal_id));
    const om = N(r.original_amount), ot = tr?.original_amount ?? null, of = N(r.total_deal_size_ils_m);
    let o = null, src = "missing";
    if (om != null) {
      o = om;
      src = "master_original_amount";
    } else if (ot != null) {
      o = ot;
      src = "tranche_original_amount";
    } else if (of != null) {
      o = of;
      src = "fallback_total_deal_size_ils_m";
    }
    srcCount[src] = (srcCount[src] ?? 0) + 1;

    const country = canonCountry(r.country_of_sponsor || r.issuing_country_canonical) ?? tr?.country_name ?? null;
    const issue = D(r.issue_date), pricing = D(r.pricing_date), ann = D(r.announcement_date);
    const year = pYear(r.deal_year, issue || pricing || ann || "");
    const el = N(r.expected_loss) ?? N(r.average_expected_loss_percent) ?? tr?.expected_loss ?? null;
    const sp = N(r.spread) ?? N(r.average_final_spread_bps) ?? tr?.spread ?? null;
    const rm = N(r.risk_multiple) ?? N(r.average_risk_multiple) ?? tr?.risk_multiple ?? null;
    const peril = normPeril(r.peril_type || tr?.peril_type || r.covered_perils || "Other");
    const trig = normTrig(r.trigger_type || tr?.trigger_type || "Other");
    const gov = B(r.government_program_flag), musd = o == null ? 0 : o, usd = Math.round(musd * 1_000_000);

    return {
      id,
      deal_id: S(r.deal_id) || null,
      deal_name: S(r.deal_name) || null,
      series_name: S(r.series_name) || null,
      status: S(r.status) || null,
      announcement_date: ann,
      pricing_date: pricing,
      issue_date: issue,
      maturity_date: D(r.maturity_date),
      deal_year: year,
      issue_quarter: S(r.issue_quarter) || null,
      sponsor_name: S(r.sponsor_name) || null,
      issuer_name: S(r.issuer_name) || null,
      cedent_name: S(r.cedent_name) || null,
      country_of_sponsor: S(r.country_of_sponsor) || null,
      country_name: country,
      country_slug: country ? slug(country) : null,
      region_of_sponsor: S(r.region_of_sponsor) || null,
      region_normalized: RMAP[S(r.region_of_sponsor)] || S(r.region_of_sponsor) || COORDS[country]?.region || "Global",
      sovereign_or_corporate: S(r.sovereign_or_corporate) || null,
      government_program_flag: gov,
      sovereign_flag: gov,
      market_segment: gov ? "Sovereign" : "Non-Sovereign",
      original_amount_musd: o,
      original_amount_usd: o == null ? null : usd,
      amount_source: src,
      total_deal_size_ils_m: musd,
      total_deal_size_musd: musd,
      total_deal_size_usd: usd,
      program_size_ils_m: N(r.program_size_ils_m),
      covered_perils: S(r.covered_perils) || peril,
      peril_type: peril,
      peril_tags: [peril],
      peril_category: peril,
      covered_region: S(r.covered_region) || null,
      trigger_type: trig,
      trigger_type_normalized: trig,
      trigger_category: trig,
      expected_loss: el,
      average_expected_loss_percent: el,
      spread: sp,
      average_final_spread_bps: sp,
      risk_multiple: rm,
      average_risk_multiple: rm,
      tranche_count: N(r.tranche_count),
      triggered_deal_flag: B(r.triggered_deal_flag),
      total_principal_loss_ils_m: N(r.total_principal_loss_ils_m) ?? 0,
      total_principal_loss_musd: N(r.total_principal_loss_ils_m) ?? 0,
      total_principal_loss_usd: Math.round((N(r.total_principal_loss_ils_m) ?? 0) * 1_000_000),
      primary_source_url: S(r.primary_source_url) || null,
      extraction_status: S(r.extraction_status) || null,
      data_quality_score: N(r.data_quality_score),
      issuing_country_canonical: S(r.issuing_country_canonical) || null
    };
  });

  const now = new Date().toISOString();
  const withAmt = deals.filter((d) => d.original_amount_musd != null);
  const byGov = [deals.filter((d) => d.government_program_flag), deals.filter((d) => !d.government_program_flag)];
  const volM = withAmt.reduce((s, d) => s + (d.original_amount_musd ?? 0), 0);
  const volU = Math.round(volM * 1_000_000);
  const total = deals.length;
  const countries = new Set(deals.map((d) => d.country_name).filter(Boolean)).size;
  const latest = deals.reduce((m, d) => Math.max(m, d.deal_year ?? 0), 0) || null;
  const inRange = volM >= 180_000 && volM <= 220_000;
  const sovIssuer =
    [...withAmt
      .filter((d) => d.government_program_flag)
      .reduce((m, d) => m.set(d.sponsor_name || d.country_name || "Unknown", (m.get(d.sponsor_name || d.country_name || "Unknown") ?? 0) + (d.original_amount_usd ?? 0)), new Map())
      .entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Not Available";

  const gkpi = {
    generated_at: now,
    source_dataset: path.basename(master.path),
    definitions: {
      total_deals: "COUNT(DISTINCT deal_id)",
      total_market_volume: "SUM(original_amount)",
      sovereign_deal_count: "COUNT(deal_id WHERE government_program_flag = TRUE)",
      non_sovereign_deal_count: "COUNT(deal_id WHERE government_program_flag = FALSE)",
      countries_covered: "COUNT(DISTINCT country_of_sponsor)",
      latest_market_year: "MAX(deal_year)"
    },
    total_deals: total,
    total_market_volume_musd: +volM.toFixed(3),
    total_market_volume_usd: volU,
    sovereign_deal_count: byGov[0].length,
    non_sovereign_deal_count: byGov[1].length,
    countries_covered: countries,
    latest_market_year: latest,
    largest_sovereign_issuer: sovIssuer,
    validation: {
      expected_total_volume_busd_range: [180, 220],
      actual_total_volume_busd: +(volM / 1000).toFixed(3),
      within_expected_range: inRange
    }
  };

  const homeKpis = { enabled: true, section_title: "Market Snapshot", section_subtitle: "Auto-generated from SQL-ready cleaned datasets.", items: [
    { id: "total_deals", label: "Total Deals in Dataset", value: total.toLocaleString("en-US"), note: "COUNT(DISTINCT deal_id)" },
    { id: "total_market_volume", label: "Total Market Volume", value: compactM(volM), note: "SUM(original_amount) only" },
    { id: "sovereign_deals", label: "Sovereign Deal Count", value: byGov[0].length.toLocaleString("en-US"), note: "government_program_flag = TRUE" },
    { id: "non_sovereign_deals", label: "Non-Sovereign Deal Count", value: byGov[1].length.toLocaleString("en-US"), note: "government_program_flag = FALSE" },
    { id: "countries_covered", label: "Countries Covered", value: countries.toLocaleString("en-US"), note: "COUNT(DISTINCT country_of_sponsor)" },
    { id: "latest_market_year", label: "Latest Market Year", value: latest ? String(latest) : "N/A", note: "MAX(deal_year)" }
  ] };

  const issue = (() => {
    const m = new Map();
    for (const d of withAmt) {
      if (!d.deal_year) continue;
      for (const seg of [{ n: "All", k: "all" }, { n: d.government_program_flag ? "Sovereign" : "Non-Sovereign", k: d.government_program_flag ? "sovereign" : "non_sovereign" }]) {
        const kk = `${d.deal_year}|${seg.k}`, z = m.get(kk) ?? { year: d.deal_year, segment: seg.n, segment_key: seg.k, deal_count: 0, total_volume_musd: 0 };
        z.deal_count++;
        z.total_volume_musd += d.original_amount_musd ?? 0;
        m.set(kk, z);
      }
    }
    return [...m.values()].sort((a, b) => a.year - b.year || a.segment.localeCompare(b.segment)).map((x) => ({ ...x, total_volume_musd: +x.total_volume_musd.toFixed(3), total_volume_usd: Math.round(x.total_volume_musd * 1_000_000) }));
  })();

  const peril = agg(withAmt, (d) => d.peril_type || "Other", "peril");
  const trigger = agg(withAmt, (d) => d.trigger_type_normalized || "Other", "trigger_type");
  const topCountries = agg(withAmt, (d) => d.country_name || "Unspecified", "country_name").slice(0, 30).map((x, i) => ({ rank: i + 1, country_name: x.country_name, country_slug: slug(x.country_name), deal_count: x.deal_count, total_volume_musd: x.total_volume_musd, total_volume_usd: x.total_volume_usd, sovereign_flag: false, latest_issue_year: null }));
  const topSponsors = agg(withAmt, (d) => d.sponsor_name || d.issuer_name || d.cedent_name || "Unknown", "sponsor_name").slice(0, 30).map((x, i) => ({ rank: i + 1, sponsor_name: x.sponsor_name, deal_count: x.deal_count, sovereign_deal_count: withAmt.filter((d) => (d.sponsor_name || d.issuer_name || d.cedent_name || "Unknown") === x.sponsor_name && d.government_program_flag).length, total_volume_musd: x.total_volume_musd, total_volume_usd: x.total_volume_usd }));
  const svsEl = deals.filter((d) => d.expected_loss != null && d.spread != null).map((d) => ({ id: d.id, deal_id: d.deal_id, deal_name: d.deal_name, country_name: d.country_name, country_slug: d.country_slug, sovereign_flag: d.government_program_flag, market_segment: d.market_segment, deal_year: d.deal_year, expected_loss_percent: d.expected_loss, final_spread_bps: d.spread, risk_multiple: d.risk_multiple, original_amount_musd: d.original_amount_musd, total_deal_size_ils_m: d.total_deal_size_ils_m }));

  const svp = {
    summary_by_sovereign_flag: [{ segment: "Sovereign", sovereign_flag: true, deal_count: byGov[0].length, total_volume_musd: +byGov[0].reduce((s, d) => s + (d.original_amount_musd ?? 0), 0).toFixed(3), total_volume_usd: Math.round(byGov[0].reduce((s, d) => s + (d.original_amount_usd ?? 0), 0)) }, { segment: "Non-Sovereign", sovereign_flag: false, deal_count: byGov[1].length, total_volume_musd: +byGov[1].reduce((s, d) => s + (d.original_amount_musd ?? 0), 0).toFixed(3), total_volume_usd: Math.round(byGov[1].reduce((s, d) => s + (d.original_amount_usd ?? 0), 0)) }],
    summary_by_market_segment: [{ market_segment: "Sovereign", deal_count: byGov[0].length, total_volume_musd: +byGov[0].reduce((s, d) => s + (d.original_amount_musd ?? 0), 0).toFixed(3), total_volume_usd: Math.round(byGov[0].reduce((s, d) => s + (d.original_amount_usd ?? 0), 0)) }, { market_segment: "Non-Sovereign", deal_count: byGov[1].length, total_volume_musd: +byGov[1].reduce((s, d) => s + (d.original_amount_musd ?? 0), 0).toFixed(3), total_volume_usd: Math.round(byGov[1].reduce((s, d) => s + (d.original_amount_usd ?? 0), 0)) }],
    trigger_by_market_segment: agg(withAmt, (d) => `${d.government_program_flag ? "Sovereign" : "Non-Sovereign"}|${d.trigger_type_normalized || "Other"}`, "key").map((x) => { const [m, t] = x.key.split("|"); return { market_segment: m, trigger_type: t, deal_count: x.deal_count, total_volume_musd: x.total_volume_musd, total_volume_usd: x.total_volume_usd }; }),
    peril_by_market_segment: agg(withAmt, (d) => `${d.government_program_flag ? "Sovereign" : "Non-Sovereign"}|${d.peril_type || "Other"}`, "key").map((x) => { const [m, p] = x.key.split("|"); return { market_segment: m, peril: p, deal_count: x.deal_count, total_volume_musd: x.total_volume_musd, total_volume_usd: x.total_volume_usd }; })
  };

  const cMap = new Map();
  for (const d of deals.filter((x) => x.country_name && x.country_slug)) {
    const k = d.country_slug, z = cMap.get(k) ?? { id: k, country_name: d.country_name, slug: k, region: RMAP[S(d.region_of_sponsor)] || S(d.region_of_sponsor) || COORDS[d.country_name]?.region || "Global", deal_count: 0, total_volume_musd: 0, latest_issue_year: null, perils: [], triggers: [], models: [], sd: 0, nd: 0, el: [], sp: [], rm: [] };
    z.deal_count++; z.total_volume_musd += d.original_amount_musd ?? 0; z.latest_issue_year = Math.max(z.latest_issue_year ?? 0, d.deal_year ?? 0) || null;
    z.perils.push(d.peril_type || "Other"); z.triggers.push(d.trigger_type_normalized || "Other"); z.models.push(d.market_segment || "Non-Sovereign");
    if (d.government_program_flag) z.sd++; else z.nd++;
    if (typeof d.expected_loss === "number") z.el.push(d.expected_loss);
    if (typeof d.spread === "number") z.sp.push(d.spread);
    if (typeof d.risk_multiple === "number") z.rm.push(d.risk_multiple);
    cMap.set(k, z);
  }

  const countriesArr = [...cMap.values()].map((c) => {
    const trig = [...c.triggers.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([x]) => x);
    const model = [...c.models.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([x]) => x);
    const pMain = [...c.perils.reduce((m, x) => m.set(normPeril(x), (m.get(normPeril(x)) ?? 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Other";
    const sov = c.sd > 0, seg = c.sd > 0 && c.nd > 0 ? "Mixed (Sovereign / Non-Sovereign)" : sov ? "Sovereign" : "Non-Sovereign";
    const coord = COORDS[c.country_name] ?? null;
    return { id: c.id, country_name: c.country_name, slug: c.slug, region: c.region, sovereign_flag: sov, market_segment_summary: seg, deal_count: c.deal_count, total_deals: c.deal_count, sovereign_deal_count: c.sd, non_sovereign_deal_count: c.nd, total_volume_musd: +c.total_volume_musd.toFixed(3), total_volume_usd: Math.round(c.total_volume_musd * 1_000_000), total_volume: Math.round(c.total_volume_musd * 1_000_000), latest_issue_year: c.latest_issue_year, main_peril: pMain, trigger_types: trig, model_types: model, avg_expected_loss: avg(c.el), avg_spread: avg(c.sp), avg_risk_multiple: avg(c.rm), sovereign_activity_summary: sov ? `${c.sd} sovereign deal(s) identified.` : "No sovereign-issued transactions identified.", summary: `${c.deal_count} deal(s) totaling ${compactM(c.total_volume_musd)}.`, latitude: coord?.lat ?? null, longitude: coord?.lng ?? null, destination_url: `/countries/${c.slug}` };
  }).sort((a, b) => b.total_volume_usd - a.total_volume_usd || a.country_name.localeCompare(b.country_name));

  const exMap = new Map(existing.map((e) => [slug(e.slug ?? e.country_name), e]));
  const countryIndex = { generated_at: now, source_root: sourceRoot, countries: countriesArr.map((c) => ({ ...c, folder_name: S(exMap.get(c.slug)?.folder_name) || null, available_sections: Array.isArray(exMap.get(c.slug)?.available_sections) ? exMap.get(c.slug).available_sections : ["transaction_details"], has_investor_data: !!exMap.get(c.slug)?.has_investor_data, has_investor_geography: !!exMap.get(c.slug)?.has_investor_geography, has_policy_lessons: !!exMap.get(c.slug)?.has_policy_lessons, has_documents: !!exMap.get(c.slug)?.has_documents, has_transactions: exMap.get(c.slug)?.has_transactions ?? true, timeline_count: Number(exMap.get(c.slug)?.timeline_count ?? 0) })) };
  const countryKpis = { generated_at: now, source_dataset: path.basename(master.path), countries: countriesArr.map((c) => ({ slug: c.slug, country_name: c.country_name, region: c.region, deal_count: c.deal_count, total_deals: c.deal_count, total_volume_musd: c.total_volume_musd, total_volume_usd: c.total_volume_usd, latest_issue_year: c.latest_issue_year, main_peril: c.main_peril, sovereign_flag: c.sovereign_flag, sovereign_activity_summary: c.sovereign_activity_summary, avg_expected_loss: c.avg_expected_loss, avg_spread: c.avg_spread, avg_risk_multiple: c.avg_risk_multiple, market_segment_breakdown: [...deals.filter((d) => d.country_slug === c.slug).reduce((m, d) => m.set(d.market_segment || "Non-Sovereign", (m.get(d.market_segment || "Non-Sovereign") ?? 0) + 1), new Map()).entries()].map(([segment, count]) => ({ segment, count })), trigger_breakdown: [...deals.filter((d) => d.country_slug === c.slug).reduce((m, d) => m.set(d.trigger_type_normalized || "Other", (m.get(d.trigger_type_normalized || "Other") ?? 0) + 1), new Map()).entries()].map(([trigger, count]) => ({ trigger, count })), yearly_issuance: [...deals.filter((d) => d.country_slug === c.slug && d.deal_year).reduce((m, d) => { const z = m.get(d.deal_year) ?? { year: d.deal_year, count: 0, total_volume_musd: 0 }; z.count++; z.total_volume_musd += d.original_amount_musd ?? 0; m.set(d.deal_year, z); return m; }, new Map()).values()].sort((a, b) => a.year - b.year).map((x) => ({ year: x.year, count: x.count, total_volume_musd: +x.total_volume_musd.toFixed(3), total_volume_usd: Math.round(x.total_volume_musd * 1_000_000) })) })) };

  const globeSummary = countriesArr.map((c) => ({ country_name: c.country_name, slug: c.slug, deal_count: c.deal_count, issuance_volume_musd: c.total_volume_musd, issuance_volume_usd: c.total_volume_usd, latest_deal_year: c.latest_issue_year, main_peril: c.main_peril, sovereign_deal_count: c.sovereign_deal_count, non_sovereign_deal_count: c.non_sovereign_deal_count, sovereign_flag: c.sovereign_flag, destination_url: `/countries/${c.slug}` }));
  const globe = countriesArr.filter((c) => c.latitude != null && c.longitude != null).map((c) => ({ id: c.slug, country_name: c.country_name, slug: c.slug, lat: c.latitude, lng: c.longitude, sovereign_flag: c.sovereign_flag, market_segment: c.market_segment_summary, market_segment_summary: c.market_segment_summary, deal_count: c.deal_count, total_volume_musd: c.total_volume_musd, total_volume_usd: c.total_volume_usd, latest_issue_year: c.latest_issue_year, main_peril: c.main_peril, sovereign_deal_count: c.sovereign_deal_count, non_sovereign_deal_count: c.non_sovereign_deal_count, tooltip_title: c.country_name, tooltip_text: `${c.deal_count} deals | ${c.sovereign_deal_count} sovereign / ${c.non_sovereign_deal_count} non-sovereign | ${c.main_peril} | Latest ${c.latest_issue_year ?? "N/A"}`, destination_url: `/countries/${c.slug}` }));

  const trigDeals = deals.filter((d) => d.triggered_deal_flag || (d.total_principal_loss_musd ?? 0) > 0);
  const trig = { generated_at: now, source_dataset: path.basename(master.path), total_triggered_deals: trigDeals.length, total_principal_loss_musd: +trigDeals.reduce((s, d) => s + (d.total_principal_loss_musd ?? 0), 0).toFixed(3), total_principal_loss_usd: Math.round(trigDeals.reduce((s, d) => s + (d.total_principal_loss_usd ?? 0), 0)), by_year: [...trigDeals.reduce((m, d) => { if (!d.deal_year) return m; const z = m.get(d.deal_year) ?? { year: d.deal_year, deal_count: 0, principal_loss_musd: 0 }; z.deal_count++; z.principal_loss_musd += d.total_principal_loss_musd ?? 0; m.set(d.deal_year, z); return m; }, new Map()).values()].sort((a, b) => a.year - b.year).map((x) => ({ year: x.year, deal_count: x.deal_count, principal_loss_musd: +x.principal_loss_musd.toFixed(3), principal_loss_usd: Math.round(x.principal_loss_musd * 1_000_000) })), by_country: [...trigDeals.reduce((m, d) => { const k = d.country_name || "Unspecified", z = m.get(k) ?? { country_name: k, deal_count: 0, principal_loss_musd: 0 }; z.deal_count++; z.principal_loss_musd += d.total_principal_loss_musd ?? 0; m.set(k, z); return m; }, new Map()).values()].sort((a, b) => b.principal_loss_musd - a.principal_loss_musd).slice(0, 30).map((x) => ({ country_name: x.country_name, deal_count: x.deal_count, principal_loss_musd: +x.principal_loss_musd.toFixed(3), principal_loss_usd: Math.round(x.principal_loss_musd * 1_000_000) })) };

  const audit = { generated_at: now, source_root: sourceRoot, source_files: { master: path.basename(master.path), tranche: path.basename(tranches.path) }, row_counts: { raw_rows: dedupAudit.raw_row_count, duplicate_rows_removed: dedupAudit.removed_duplicate_rows, cleaned_rows: dedupAudit.deduplicated_row_count }, deduplication: { primary_key: "deal_id", duplicates_by_deal_id: dedupAudit.duplicates_by_deal_id, duplicates_by_fallback_key: dedupAudit.duplicates_by_fallback_key, missing_deal_id_rows: dedupAudit.missing_deal_id_rows }, amount_methodology: { required_column: "original_amount", rule: "SUM(original_amount) after DISTINCT deal_id deduplication.", amount_source_counts: srcCount, total_market_volume_musd: +volM.toFixed(3), total_market_volume_usd: volU }, validation: gkpi.validation, warning: inRange ? null : "Total market volume outside expected ~180B-220B range." };

  const topSov = countriesArr.filter((c) => c.sovereign_flag).sort((a, b) => b.total_volume_usd - a.total_volume_usd).slice(0, 20).map((c, i) => ({ rank: i + 1, country_name: c.country_name, country_slug: c.slug, deal_count: c.sovereign_deal_count, sovereign_flag: true, total_volume_musd: c.total_volume_musd, total_volume_usd: c.total_volume_usd, latest_issue_year: c.latest_issue_year }));
  const empty = { generated_at: now, field_available: false, field_used: null, rows: [] };

  await Promise.all([
    write(OUT.master, { generated_at: now, source_root: sourceRoot, source_master_file: path.basename(master.path), source_tranche_file: path.basename(tranches.path), total_records: deals.length, raw_rows_before_dedup: dedupAudit.raw_row_count, removed_duplicates: dedupAudit.removed_duplicate_rows, deals }),
    write(OUT.dedup, { ...dedupAudit, generated_at: now, source_dataset: path.basename(master.path) }),
    write(OUT.audit, audit),
    write(OUT.gkpiMaster, gkpi),
    write(OUT.gkpi, gkpi),
    write(OUT.homeKpis, homeKpis),
    write(OUT.issuance, issue),
    write(OUT.svp, svp),
    write(OUT.peril, peril),
    write(OUT.trigger, trigger),
    write(OUT.topCountries, topCountries),
    write(OUT.topSponsors, topSponsors),
    write(OUT.svsEl, svsEl),
    write(OUT.elHist, { generated_at: now, metric: "expected_loss", source: "deal_level_master", ...hist(deals.map((d) => d.expected_loss).filter((x) => typeof x === "number"), 0.25, 3) }),
    write(OUT.spHist, { generated_at: now, metric: "spread", source: "deal_level_master", ...hist(deals.map((d) => d.spread).filter((x) => typeof x === "number"), 50, 2) }),
    write(OUT.topSovCountries, topSov),
    write(OUT.topBrokers, { label: "Top Brokers", ...empty }),
    write(OUT.topBookrunners, { label: "Top Bookrunners", ...empty }),
    write(OUT.topPlacement, { label: "Top Placement Agents", ...empty }),
    write(OUT.heatPeril, agg(withAmt.filter((d) => d.deal_year), (d) => `${d.deal_year}|${d.peril_type || "Other"}`, "key").map((x) => { const [y, p] = x.key.split("|"); return { year: Number(y), peril: p, deal_count: x.deal_count, total_volume_musd: x.total_volume_musd, total_volume_usd: x.total_volume_usd }; })),
    write(OUT.heatTrigger, agg(withAmt.filter((d) => d.deal_year), (d) => `${d.deal_year}|${d.trigger_type_normalized || "Other"}`, "key").map((x) => { const [y, t] = x.key.split("|"); return { year: Number(y), trigger_type: t, deal_count: x.deal_count, total_volume_musd: x.total_volume_musd, total_volume_usd: x.total_volume_usd }; })),
    write(OUT.trig, trig),
    write(OUT.trigCompat, trig),
    write(OUT.globeSummary, globeSummary),
    write(OUT.globe, globe),
    write(OUT.globeMaster, globe),
    write(OUT.coords, COORDS),
    write(OUT.countryIndex, countryIndex),
    write(OUT.countryKpis, countryKpis),
    write(OUT.countryIndexMaster, countriesArr),
    write(OUT.countryKpisMaster, { generated_at: now, source_dataset: path.basename(master.path), countries: countryKpis.countries }),
    write(OUT.sovereign, { generated_at: now, source_dataset: path.basename(master.path), total_records: byGov[0].length, deals: byGov[0] }),
    write(OUT.nonSovereign, { generated_at: now, source_dataset: path.basename(master.path), total_records: byGov[1].length, deals: byGov[1] })
  ]);

  console.log(`Source root: ${sourceRoot}`);
  console.log(`Master file: ${path.basename(master.path)}`);
  console.log(`Tranche file: ${path.basename(tranches.path)}`);
  console.log(`Rows after dedup: ${deals.length}`);
  console.log(`Total deals: ${total}`);
  console.log(`Total market volume (B USD): ${(volM / 1000).toFixed(3)}`);
  console.log(`Countries covered: ${countries}`);
  if (!inRange) console.log("WARNING: total market volume outside expected range.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
