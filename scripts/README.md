# Data Pipeline Scripts

> **Important:** Always run scripts from the **project root**, not from this folder.
> Relative paths (`data/`, `logs/`) resolve relative to the working directory.

```bash
# Correct
python scripts/scraper_artemis.py

# Wrong (paths will break)
cd scripts && python scraper_artemis.py
```

---

## scraper_artemis.py

Scrapes the complete [Artemis.bm deal directory](https://www.artemis.bm/deal-directory/)
and builds `data/master/cat_bond_master.csv` from scratch.

### Runtime
60–90 minutes (1,252 deals × 3s polite delay)

### Output
| File | Description |
|------|-------------|
| `data/master/cat_bond_master.csv` | Final clean dataset (25 columns) |
| `data/raw/artemis_raw.csv` | Raw listing data from Phase 1 |
| `data/raw/artemis_details_partial.csv` | Partial detail data (checkpoint) |
| `data/raw/scraper_checkpoint.json` | Progress checkpoint — enables resume |
| `logs/scraper.log` | Full run log with anomaly warnings |

### Run
```bash
pip install cloudscraper beautifulsoup4 pandas requests
python scripts/scraper_artemis.py
```

### Resume after crash
The scraper saves a checkpoint every 50 deals. If it crashes, just re-run —
it reads `data/raw/scraper_checkpoint.json` and skips already-completed URLs.

```bash
python scripts/scraper_artemis.py   # automatically resumes
```

To force a full re-scrape from scratch:
```bash
rm data/raw/scraper_checkpoint.json data/raw/artemis_raw.csv
python scripts/scraper_artemis.py
```

### Pipeline phases

| Phase | Description |
|-------|-------------|
| 1 — Listing | Paginates deal directory, collects 1,252 deal URLs |
| 2 — Details | Fetches each deal page, extracts fields from `#info-box` + body regex |
| 3 — Normalize | Converts sizes to USD millions, EL to %, applies FX rates |
| 4 — Validate | Checks totals against market benchmarks, prints pass/fail report |

### Rate limiting
- 3s delay between detail pages
- 5s delay between listing pages
- 60s automatic backoff on HTTP 429/403
- 30s wait on connection reset, then retry

---

## generate-catbond-datasets.mjs

Reads `data/master/cat_bond_master.csv` and regenerates all derived
JSON files used by the Next.js frontend.

```bash
node scripts/generate-catbond-datasets.mjs
# or via npm:
npm run data:refresh
```

---

## import_seismic_package.mjs / import_sql_ready_package.mjs

One-time import utilities for loading external data packages.
Run only when ingesting new data packages.
