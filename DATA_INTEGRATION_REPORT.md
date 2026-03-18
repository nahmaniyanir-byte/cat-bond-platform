# DATA_INTEGRATION_REPORT

Generated at: 2026-03-18T07:02:10.269Z

## Old Sources Replaced
- Legacy local master/mock/static deal datasets are bypassed by generated JSON from SQL-ready packages.
- Home KPIs are regenerated from canonical SQL-ready outputs.

## Canonical Sources Used
- ../final_outputs_country_fixed/sql_ready_package/deals_master_sql_ready.csv
- ../final_outputs_country_fixed/sql_ready_package/tranches_core_sql_ready.csv
- ../final_outputs_country_fixed/sql_ready_package/pricing_and_returns_sql_ready.csv
- ../final_outputs_country_fixed/sql_ready_package/issuers_entities_sql_ready.csv
- ../final_outputs_country_fixed/sql_ready_package/calculated_metrics_sql_ready.csv
- ../final_sql_ready_seismic_catbond_package/seismic_high_risk_countries_cat_bonds_summary.csv
- ../final_sql_ready_seismic_catbond_package/seismic_high_risk_countries_cat_bonds_detailed.csv

## Data Mapping
- deals_master_sql_ready.csv -> deal-level base records + top-level summaries
- tranches_core_sql_ready.csv -> tranche enrichment, perils/triggers, maturity status, volume fallback
- pricing_and_returns_sql_ready.csv -> spread/expected-loss/risk enrichment
- issuers_entities_sql_ready.csv -> sponsor/issuer metadata enrichment
- calculated_metrics_sql_ready.csv -> reserved as derived-metrics source in pipeline context
- seismic package -> high-seismic-risk cards/charts/map datasets

## Pages/Components Powered By Generated Datasets
- Homepage KPI strip and globe
- Global Market Dashboard
- Sovereign Dashboard
- Pricing Intelligence
- Risk Gap Module
- Deal Explorer / Deal Pages
- Country list and country pages
- High Seismic Risk Countries page

## Deduplication
- Primary key: deal_id
- Fallback key: deterministic hash(deal_name|series|issue/pricing date|sponsor|country|size)
- Tranches are preserved for tranche analytics and aggregated once to enrich deal-level records.

## Cleaning Applied
- trim/null normalization, numeric parsing, boolean normalization
- date normalization to YYYY-MM-DD when possible
- peril/trigger category normalization
- coordinate fallback for unmapped countries

## Dedup Audit Summary
- raw_rows: 830
- duplicates_removed: 0
- cleaned_rows: 830
