# Global Catastrophe Bond Intelligence Platform

A professional intelligence platform for catastrophe bonds,
insurance-linked securities, and sovereign disaster risk financing.
Built for institutional analysis and government policy support.

**Live Platform:** https://cat-bond-platform.vercel.app

---

## Overview

This platform provides structured analytics on the global catastrophe
bond market, with a dedicated module for sovereign disaster risk
financing and a specialized Israel Policy Lab for Ministry of Finance use.

The underlying dataset covers ~1,200+ cat bond transactions sourced from
[Artemis.bm](https://www.artemis.bm/deal-directory/) — the authoritative
industry deal directory — and spans issuances from 1997 to present.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Charts | Recharts |
| Data pipeline | Python 3.10+, BeautifulSoup4, pandas, cloudscraper |
| Deployment | Vercel |
| Data source | Artemis.bm deal directory |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Refresh derived JSON datasets from master CSV
```bash
npm run data:refresh
```

### Run the data scraper (takes 60–90 minutes)
```bash
# Always run from project root so relative paths resolve correctly
python scripts/scraper_artemis.py
```

---

## Platform Modules

| Module | Route | Description |
|--------|-------|-------------|
| Global Market | `/global-market` | Issuance trends, rankings, market cycle analytics |
| Deal Explorer | `/deals` | Full transaction-level searchable database |
| Pricing Intelligence | `/pricing-intelligence` | Spread vs EL scatter, risk multiple analysis |
| Sovereign Dashboard | `/sovereign-dashboard` | Government-backed and sovereign-linked deals |
| Country Profiles | `/countries` | Per-country issuance history and risk exposure |
| Israel Lab | `/israel-lab` | Trigger design and fiscal simulation engine |
| Calculator | `/calculator` | Bond structuring and fiscal cost tools |
| Database | `/database` | Raw data browser and export |

---

## Data Pipeline

Raw data is scraped from the Artemis.bm deal directory and processed
through a 4-phase pipeline (`scripts/scraper_artemis.py`):

1. **Listing crawl** — paginate the deal directory, collect all 1,200+ URLs
2. **Detail scraping** — fetch each deal page, extract structured fields from `#info-box`
3. **Normalization** — standardize sizes to USD millions, EL to %, currencies via FX
4. **Validation** — benchmark totals against known market figures

Output: `data/master/cat_bond_master.csv`

See [`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md) for full column definitions.

---

## Project Structure

```
project-root/
├── src/                  Next.js app — pages, components, API routes
├── public/               Static assets
├── data/
│   ├── master/           cat_bond_master.csv — canonical dataset
│   ├── chart_data/       Pre-computed JSON for charts (generated)
│   ├── countries/        Per-country data files (generated)
│   └── deals/            Per-deal JSON files (generated)
├── scripts/              Python data pipeline
│   ├── scraper_artemis.py
│   └── README.md
├── docs/                 Documentation
│   ├── DATA_SCHEMA.md
│   └── DATA_INTEGRATION_REPORT.md
├── .gitignore
├── package.json
└── README.md
```

---

## Key Data Facts

- **Universe:** ~1,200+ cat bond transactions (1997–present)
- **Total market size:** ~$200–260B cumulative issuance
- **Coverage:** deal_size populated for ~80%+ of deals; EL for ~60%+
- **Currencies:** USD primary; EUR, JPY, GBP deals converted to USD millions

---

## License

Private research project. Not for public redistribution.
