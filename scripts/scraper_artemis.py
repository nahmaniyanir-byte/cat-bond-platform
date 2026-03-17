"""
scraper_artemis.py
Scrapes the Artemis.bm deal directory to build cat_bond_master.csv from scratch.

Phase 1: Paginate through all listing pages, collect deal URLs + basic metadata.
Phase 2: Fetch each deal detail page, extract all fields.
Phase 3: Normalize sizes to USD millions, EL to decimal %.
Phase 4: Validate against known benchmarks.
"""

import re
import sys
import time
import logging
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

# Fix Windows console encoding (Cloudflare responses may contain non-ASCII)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import requests          # needed for exception classes (cloudscraper raises these)
import cloudscraper
import pandas as pd
from bs4 import BeautifulSoup

# ── Config ──────────────────────────────────────────────────────────────────
BASE_URL = "https://www.artemis.bm/deal-directory/"
DELAY_BETWEEN_REQUESTS = 3   # seconds between detail page fetches
DELAY_BETWEEN_PAGES    = 5   # seconds between listing pages
RETRY_WAIT             = 60  # seconds after 429 / 403
CHECKPOINT_EVERY       = 50  # save checkpoint every N deals

OUTPUT_RAW       = Path("data/raw/artemis_raw.csv")
OUTPUT_CLEAN     = Path("data/master/cat_bond_master.csv")
CHECKPOINT_FILE  = Path("data/raw/scraper_checkpoint.json")
LOG_FILE         = Path("logs/scraper.log")

Path("data/raw").mkdir(parents=True, exist_ok=True)
Path("data/master").mkdir(parents=True, exist_ok=True)
Path("logs").mkdir(parents=True, exist_ok=True)

# ── Logging ──────────────────────────────────────────────────────────────────
_stream_handler = logging.StreamHandler(sys.stdout)
_stream_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        _stream_handler,
    ],
)
log = logging.getLogger(__name__)

# ── HTTP session (cloudscraper handles Cloudflare JS challenges) ─────────────
SESSION = cloudscraper.create_scraper(
    browser={"browser": "chrome", "platform": "windows", "mobile": False}
)


# ══════════════════════════════════════════════════════════════════════════════
# Utilities
# ══════════════════════════════════════════════════════════════════════════════

def safe_get(url: str, retries: int = 2):
    """GET with retry logic for rate-limit / server errors."""
    for attempt in range(retries + 1):
        try:
            resp = SESSION.get(url, timeout=30)
            if resp.status_code == 200:
                return resp
            elif resp.status_code in (429, 403):
                log.warning("Rate-limited (%s) on %s — waiting %ds", resp.status_code, url, RETRY_WAIT)
                time.sleep(RETRY_WAIT)
            elif resp.status_code == 404:
                log.info("404 not found: %s", url)
                return None
            else:
                log.error("HTTP %s on %s (attempt %d)", resp.status_code, url, attempt + 1)
                if attempt < retries:
                    time.sleep(10)
        except (requests.RequestException, ConnectionError, OSError) as exc:
            log.error("Request error on %s: %s (attempt %d)", url, exc, attempt + 1)
            if attempt < retries:
                wait = 30 if "ConnectionReset" in type(exc).__name__ or "10054" in str(exc) else 10
                log.info("Waiting %ds before retry...", wait)
                time.sleep(wait)
    return None


def make_deal_id(name: str, year: str | int) -> str:
    raw = f"{name}-{year}".lower()
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE) as f:
            return json.load(f)
    return {"completed_urls": [], "listing_done": False}


def save_checkpoint(data: dict):
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ══════════════════════════════════════════════════════════════════════════════
# Phase 1 — Scrape listing pages
# ══════════════════════════════════════════════════════════════════════════════

def extract_listing_deals(soup: BeautifulSoup, page_url: str) -> list[dict]:
    """
    Parse one listing page. Artemis renders deals in article/div elements.
    We try several selectors and fall back gracefully.
    """
    deals = []

    # Primary: table rows or article/div cards
    # Try table first (older Artemis layout used a sortable table)
    rows = soup.select("table.tablesorter tbody tr, table tbody tr")
    if rows:
        log.info("  Listing: found %d table rows", len(rows))
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue
            # Typical columns: Name | Year | Size | Sponsor | Peril | Trigger
            a_tag = cells[0].find("a")
            deal = {
                "deal_name":        cells[0].get_text(strip=True),
                "deal_url":         ("https://www.artemis.bm" + a_tag["href"]) if a_tag and a_tag.get("href", "").startswith("/") else (a_tag["href"] if a_tag else ""),
                "issue_year":       cells[1].get_text(strip=True) if len(cells) > 1 else "",
                "deal_size_raw":    cells[2].get_text(strip=True) if len(cells) > 2 else "",
                "sponsor":          cells[3].get_text(strip=True) if len(cells) > 3 else "",
                "peril":            cells[4].get_text(strip=True) if len(cells) > 4 else "",
                "trigger_type":     cells[5].get_text(strip=True) if len(cells) > 5 else "",
            }
            if deal["deal_url"]:
                deals.append(deal)
        return deals

    # Secondary: article or div cards
    cards = soup.select(
        "article.deal, div.deal, "
        "article[class*='deal'], div[class*='deal'], "
        "li[class*='deal'], "
        "div.cat-bond-listing, div.listing-item, "
        "article.post, div.entry"
    )
    if cards:
        log.info("  Listing: found %d card elements", len(cards))
        for card in cards:
            a_tag = card.find("a", href=True)
            if not a_tag:
                continue
            href = a_tag["href"]
            if not href.startswith("http"):
                href = "https://www.artemis.bm" + href
            deal = {
                "deal_name":    card.get_text(" ", strip=True)[:200],
                "deal_url":     href,
                "issue_year":   "",
                "deal_size_raw": "",
                "sponsor":      "",
                "peril":        "",
                "trigger_type": "",
            }
            # Try to pull structured fields from data-* attrs or nested spans
            for key_label in ["size", "sponsor", "peril", "trigger", "year"]:
                el = card.find(attrs={"data-" + key_label: True})
                if not el:
                    el = card.find(class_=re.compile(key_label, re.I))
                if el:
                    txt = el.get_text(strip=True)
                    if key_label == "size":
                        deal["deal_size_raw"] = txt
                    elif key_label == "sponsor":
                        deal["sponsor"] = txt
                    elif key_label == "peril":
                        deal["peril"] = txt
                    elif key_label == "trigger":
                        deal["trigger_type"] = txt
                    elif key_label == "year":
                        deal["issue_year"] = txt
            deals.append(deal)
        return deals

    # Tertiary fallback: every <a> that looks like a deal URL
    log.warning("  No structured listing found on %s — falling back to link extraction", page_url)
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/deal-directory/" in href and href != "/deal-directory/" and href not in seen:
            seen.add(href)
            if not href.startswith("http"):
                href = "https://www.artemis.bm" + href
            deals.append({
                "deal_name":    a.get_text(strip=True) or href.split("/")[-2],
                "deal_url":     href,
                "issue_year":   "",
                "deal_size_raw": "",
                "sponsor":      "",
                "peril":        "",
                "trigger_type": "",
            })
    return deals


def get_total_pages(soup: BeautifulSoup) -> int:
    """Try to detect total pages from pagination elements."""
    # Look for numbered page links
    page_nums = []
    for a in soup.find_all("a", href=True):
        m = re.search(r"[?&]p=(\d+)", a["href"])
        if m:
            page_nums.append(int(m.group(1)))
    # Also check text of pagination spans/buttons
    for el in soup.select(".page-numbers, .pagination a, nav.pagination"):
        m = re.search(r"\d+", el.get_text())
        if m:
            page_nums.append(int(m.group()))
    return max(page_nums) if page_nums else 1


def scrape_listing() -> list[dict]:
    """Phase 1: walk all listing pages, return list of deal dicts."""
    log.info("=== PHASE 1: Scraping deal listing ===")
    all_deals = []
    seen_urls = set()
    page = 1
    total_pages = None

    while True:
        url = BASE_URL if page == 1 else f"{BASE_URL}?p={page}"
        log.info("Fetching listing page %s — %s", page, url)
        resp = safe_get(url)
        if resp is None:
            log.error("Failed to fetch listing page %d — stopping", page)
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        if total_pages is None:
            total_pages = get_total_pages(soup)
            if total_pages < 2:
                # Try a secondary heuristic: look for "Page X of Y"
                text = soup.get_text()
                m = re.search(r"[Pp]age\s+\d+\s+of\s+(\d+)", text)
                if m:
                    total_pages = int(m.group(1))
                else:
                    total_pages = 999  # unknown — keep going until empty page
            log.info("Total listing pages detected: %s", total_pages)

        deals = extract_listing_deals(soup, url)
        new_deals = [d for d in deals if d["deal_url"] not in seen_urls]
        for d in new_deals:
            seen_urls.add(d["deal_url"])

        if not new_deals and page > 1:
            log.info("No new deals on page %d — pagination complete", page)
            break

        all_deals.extend(new_deals)
        log.info("Page %d/%s — %d new deals (total so far: %d)",
                 page, total_pages, len(new_deals), len(all_deals))

        # Persist partial listing to raw CSV
        df_partial = pd.DataFrame(all_deals)
        df_partial.to_csv(OUTPUT_RAW, index=False)

        if page >= total_pages:
            log.info("Reached last listing page (%d)", page)
            break

        page += 1
        time.sleep(DELAY_BETWEEN_PAGES)

    log.info("Phase 1 complete — %d deals discovered", len(all_deals))
    return all_deals


# ══════════════════════════════════════════════════════════════════════════════
# Phase 2 — Scrape individual deal detail pages
# ══════════════════════════════════════════════════════════════════════════════

# Regex patterns for raw value extraction
RE_DOLLAR  = re.compile(r"([\$€¥£])\s*([\d,\.]+)\s*(m(?:illion)?|b(?:illion)?|k)?", re.I)
RE_PERCENT = re.compile(r"([\d,\.]+)\s*%")
RE_BPS     = re.compile(r"([\d,\.]+)\s*(?:bps?|basis\s+points?)", re.I)
RE_YEAR    = re.compile(r"\b(19|20)\d{2}\b")

# Body-text patterns — order matters: more specific first
RE_EL = re.compile(
    r"(?:base\s+)?expected\s+loss\s+(?:rate\s+)?of\s+([\d]+(?:\.[\d]+)?)\s*%"
    r"|EL\s+of\s+([\d]+(?:\.[\d]+)?)\s*%"
    r"|expected\s+loss\s+(?:is\s+)?([\d]+(?:\.[\d]+)?)\s*%",
    re.I,
)
# Spread: first look for final priced spread, fall back to guidance
RE_SPREAD_FINAL = re.compile(
    r"(?:risk\s+interest\s+)?spread\s+of\s+([\d]+(?:\.[\d]+)?)\s*%"
    r"|priced\s+(?:at|to\s+pay)[^.]{0,60}?([\d]+(?:\.[\d]+)?)\s*%"
    r"|coupon\s+pricing\s+settled\s+at\s+([\d]+(?:\.[\d]+)?)\s*%"
    r"|coupon\s+(?:of|at)\s+([\d]+(?:\.[\d]+)?)\s*%",
    re.I,
)
RE_SPREAD_GUIDANCE = re.compile(
    r"(?:coupon\s+)?(?:price\s+)?guidance[^.]{0,80}?([\d]+(?:\.[\d]+)?)\s*%",
    re.I,
)
RE_MATURITY_DATE = re.compile(
    r"matur(?:es?|ity)[^.]{0,80}?"
    r"(January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+(\d{1,2}(?:st|nd|rd|th)?,?\s+)?(\d{4})",
    re.I,
)
RE_MATURITY_YEAR_ONLY = re.compile(
    r"matur(?:es?|ity)[^.]{0,60}?(20\d{2})", re.I
)


def parse_info_box(soup: BeautifulSoup) -> dict:
    """
    Artemis stores structured deal data in:
      <div id="info-box"><ul><li><strong>Label:</strong> value</li>...</ul></div>

    Returns a dict keyed by normalised label strings.
    """
    result = {}
    box = soup.find(id="info-box")
    if not box:
        return result
    for li in box.find_all("li"):
        strong = li.find("strong")
        if not strong:
            continue
        label = strong.get_text(strip=True).rstrip(":").lower().strip()
        # Value = full li text minus the <strong> text
        value = li.get_text(" ", strip=True)
        value = value[len(strong.get_text(strip=True)):].strip().lstrip(":").strip()
        result[label] = value
    return result


def parse_deal_detail(soup: BeautifulSoup, url: str) -> dict:
    """
    Extract all fields from an Artemis deal detail page.

    Structured fields come from:
        <div id="info-box"><ul><li><strong>Label:</strong> value</li></ul></div>

    EL, spread, and maturity come from regex on the free-text .pf-content body.
    """
    d = {
        "deal_name":          "",
        "issuer_spv":         "",
        "sponsor":            "",
        "issue_date":         "",
        "maturity_date":      "",
        "size_as_displayed":  "",
        "deal_size_usd":      None,
        "original_currency":  "",
        "expected_loss":      None,
        "spread_bps":         None,
        "coupon_pct":         None,
        "trigger_type":       "",
        "peril":              "",
        "region":             "",
        "country_of_risk":    "",
        "country_of_sponsor": "",
        "sovereign_flag":     False,
        "rating":             "",
        "triggered":          None,
        "principal_loss_pct": None,
        "notes":              "",
        "source_url":         url,
        "scraped_at":         datetime.now(timezone.utc).isoformat(),
    }

    # ── Deal name ────────────────────────────────────────────────────────────
    h1 = soup.find("h1")
    if h1:
        d["deal_name"] = h1.get_text(strip=True)

    # ── Structured fields from #info-box ────────────────────────────────────
    ib = parse_info_box(soup)

    # Map info-box keys → our fields (labels vary slightly across deals)
    def ib_get(*keys):
        for k in keys:
            for ib_key, val in ib.items():
                if k in ib_key:
                    return val
        return ""

    d["issuer_spv"]  = ib_get("issuer")[:200]
    d["sponsor"]     = ib_get("cedent", "sponsor", "cedant")[:200]
    d["trigger_type"]= ib_get("trigger")[:100]
    d["peril"]       = ib_get("risks", "perils", "peril")[:300]
    d["rating"]      = ib_get("rating")[:100]
    d["issue_date"]  = ib_get("date of issue", "issue date", "issuance date")[:100]
    d["maturity_date"] = ib_get("maturity", "expiry", "final maturity")[:100]

    size_raw = ib_get("size", "volume", "amount")
    d["size_as_displayed"] = size_raw

    # ── Parse deal size from info-box value ──────────────────────────────────
    if size_raw:
        m = RE_DOLLAR.search(size_raw)
        if m:
            ccy_sym = m.group(1)
            num_str = m.group(2).replace(",", "")
            unit    = (m.group(3) or "").lower()
            try:
                num = float(num_str)
                if unit.startswith("b"):
                    num *= 1000     # billions → millions
                elif unit == "k":
                    num /= 1000    # thousands → millions
                # else treat as millions already
                d["deal_size_usd"] = round(num, 2)
                d["original_currency"] = {
                    "$": "USD", "€": "EUR", "¥": "JPY", "£": "GBP"
                }.get(ccy_sym, "USD")
                log.info("Size parsed: '%s' → %.2f %s M (url=%s)",
                         size_raw, num, d["original_currency"], url)
            except ValueError:
                log.warning("Could not parse size '%s' on %s", size_raw, url)

    # ── EL and spread from body text ─────────────────────────────────────────
    body_el = soup.find(class_="pf-content")
    body_text = body_el.get_text(" ", strip=True) if body_el else ""

    # Expected loss — take the LAST occurrence (usually the final/priced value)
    el_val = None
    for m in RE_EL.finditer(body_text):
        raw_num = next((g for g in m.groups() if g is not None), None)
        if raw_num:
            try:
                el_val = float(raw_num)
            except ValueError:
                pass
    if el_val is not None:
        d["expected_loss"] = round(el_val, 4)
        if el_val > 20:
            log.warning("EL > 20%% on %s: %.4f", url, el_val)
        elif el_val < 0.05:
            log.warning("EL < 0.05%% on %s: %.4f", url, el_val)

    # Spread — prefer final priced spread over guidance
    spread_pct = None
    m_final = RE_SPREAD_FINAL.search(body_text)
    if m_final:
        raw_num = next((g for g in m_final.groups() if g is not None), None)
        if raw_num:
            try:
                spread_pct = float(raw_num)
            except ValueError:
                pass
    if spread_pct is None:
        m_guid = RE_SPREAD_GUIDANCE.search(body_text)
        if m_guid:
            try:
                spread_pct = float(m_guid.group(1))
            except ValueError:
                pass

    # Also check info-box for explicit bps spread
    spread_ib = ib_get("spread", "coupon", "premium", "rate on line")
    if spread_ib:
        m_bps = RE_BPS.search(spread_ib)
        m_pct2 = RE_PERCENT.search(spread_ib)
        if m_bps:
            try:
                d["spread_bps"] = round(float(m_bps.group(1).replace(",", "")), 2)
                d["coupon_pct"] = round(d["spread_bps"] / 100, 4)
                spread_pct = None  # already set
            except ValueError:
                pass
        elif m_pct2 and spread_pct is None:
            try:
                spread_pct = float(m_pct2.group(1))
            except ValueError:
                pass

    if spread_pct is not None and d["spread_bps"] is None:
        d["spread_bps"] = round(spread_pct * 100, 2)
        d["coupon_pct"] = round(spread_pct, 4)

    # ── Maturity from body text (if not in info-box) ──────────────────────────
    if not d["maturity_date"]:
        m_mat = RE_MATURITY_DATE.search(body_text)
        if m_mat:
            month, day, year = m_mat.group(1), m_mat.group(2) or "", m_mat.group(3)
            d["maturity_date"] = f"{month.strip()} {day.strip()} {year}".strip()
        else:
            m_yr = RE_MATURITY_YEAR_ONLY.search(body_text)
            if m_yr:
                d["maturity_date"] = m_yr.group(1)

    # ── Sovereign flag ────────────────────────────────────────────────────────
    sovereign_keywords = [
        "government", "sovereign", "ministry", "world bank", "ibrd", "miga",
        "fonden", "treasury", "national disaster", "pacific catastrophe",
        "caribbean catastrophe", "african risk capacity", "turkish catastrophe",
        "tcip", "shcp", "ica", "disaster risk",
    ]
    page_text_lower = soup.get_text(" ").lower()
    if any(kw in page_text_lower for kw in sovereign_keywords):
        d["sovereign_flag"] = True

    # ── Triggered ─────────────────────────────────────────────────────────────
    trigger_kws = ["triggered", "total loss", "partial loss", "placed at-risk",
                   "extended maturity", "principal loss"]
    if any(kw in page_text_lower for kw in trigger_kws):
        d["triggered"] = True
        m_pl = re.search(r"principal\s+loss\s+of\s+([\d.]+)\s*%", body_text, re.I)
        if m_pl:
            try:
                d["principal_loss_pct"] = float(m_pl.group(1))
            except ValueError:
                pass

    # ── Size anomaly warnings ──────────────────────────────────────────────────
    if d["deal_size_usd"] is None:
        log.info("Missing deal_size on %s", url)
    elif d["deal_size_usd"] > 2000:
        log.warning("Deal size > $2B on %s: '%s' → %.1f M",
                    url, size_raw, d["deal_size_usd"])

    return d


def scrape_details(listing_deals: list[dict], checkpoint: dict) -> list[dict]:
    """Phase 2: fetch each deal URL and extract detail fields."""
    log.info("=== PHASE 2: Scraping %d deal detail pages ===", len(listing_deals))
    completed = set(checkpoint.get("completed_urls", []))
    detail_rows = []

    for i, deal in enumerate(listing_deals, 1):
        url = deal.get("deal_url", "").strip()
        if not url or not url.startswith("http"):
            log.warning("Skipping deal with invalid URL: %s", deal)
            continue

        if url in completed:
            log.info("[%d/%d] Skipping (already scraped): %s", i, len(listing_deals), url)
            continue

        log.info("[%d/%d] Fetching: %s", i, len(listing_deals), url)
        resp = safe_get(url)
        if resp is None:
            log.error("Failed to fetch detail: %s", url)
            detail_rows.append({
                "deal_name": deal["deal_name"],
                "source_url": url,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            })
            completed.add(url)
            time.sleep(DELAY_BETWEEN_REQUESTS)
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        detail = parse_deal_detail(soup, url)

        # Merge listing metadata into detail (don't overwrite detail values)
        for k in ["issue_year", "deal_size_raw", "sponsor", "peril", "trigger_type"]:
            if not detail.get(k) and deal.get(k):
                if k == "issue_year":
                    detail["issue_year"] = deal["issue_year"]
                elif k == "deal_size_raw" and not detail["size_as_displayed"]:
                    detail["size_as_displayed"] = deal["deal_size_raw"]
                elif k == "sponsor" and not detail["sponsor"]:
                    detail["sponsor"] = deal["sponsor"]
                elif k == "peril" and not detail["peril"]:
                    detail["peril"] = deal["peril"]
                elif k == "trigger_type" and not detail["trigger_type"]:
                    detail["trigger_type"] = deal["trigger_type"]

        detail_rows.append(detail)
        completed.add(url)

        # Checkpoint every N deals
        if i % CHECKPOINT_EVERY == 0:
            checkpoint["completed_urls"] = list(completed)
            save_checkpoint(checkpoint)
            # Save partial results
            df_partial = pd.DataFrame(detail_rows)
            df_partial.to_csv(OUTPUT_RAW.parent / "artemis_details_partial.csv", index=False)
            log.info("Checkpoint saved at deal %d", i)

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Final checkpoint
    checkpoint["completed_urls"] = list(completed)
    save_checkpoint(checkpoint)
    log.info("Phase 2 complete — %d detail records collected", len(detail_rows))
    return detail_rows


# ══════════════════════════════════════════════════════════════════════════════
# Phase 3 — Normalization
# ══════════════════════════════════════════════════════════════════════════════

# Rough annual average FX rates (non-USD → USD) for common currencies
FX_RATES = {
    "EUR": 1.10,
    "GBP": 1.27,
    "JPY": 0.0067,
    "CHF": 1.13,
    "AUD": 0.65,
    "CAD": 0.74,
}


def normalize_deal_size(row: pd.Series) -> float | None:
    """Return deal_size in USD millions, or None if cannot determine."""
    raw = str(row.get("size_as_displayed", ""))
    already_parsed = row.get("deal_size_usd")
    ccy = str(row.get("original_currency", "USD"))

    if already_parsed is not None and str(already_parsed) not in ("", "nan"):
        size_m = float(already_parsed)
    else:
        # Re-parse raw string
        m = RE_DOLLAR.search(raw)
        if not m:
            return None
        ccy_sym = m.group(1)
        num_str = m.group(2).replace(",", "")
        unit    = (m.group(3) or "").lower()
        try:
            size_m = float(num_str)
            if unit.startswith("b"):
                size_m *= 1000
            elif unit == "k":
                size_m /= 1000
            ccy = {"$": "USD", "€": "EUR", "¥": "JPY", "£": "GBP"}.get(ccy_sym, "USD")
        except ValueError:
            return None

    # Convert non-USD → USD
    if ccy != "USD" and ccy in FX_RATES:
        original = size_m
        size_m = round(size_m * FX_RATES[ccy], 2)
        log.info("FX: Deal '%s' %s %.2f M → USD %.2f M (rate %.4f)",
                 row.get("deal_name", "?"), ccy, original, size_m, FX_RATES[ccy])

    log.info("Size: '%s' → %.2f USD M", raw, size_m)
    return round(size_m, 2)


def normalize_expected_loss(row: pd.Series) -> float | None:
    """Return EL as decimal percentage (e.g. 2.34), or None."""
    val = row.get("expected_loss")
    if val is None or str(val) in ("", "nan"):
        return None
    try:
        el = float(val)
    except (ValueError, TypeError):
        return None
    # If someone stored it as a decimal fraction (e.g. 0.0234 instead of 2.34)
    if 0 < el < 0.20:
        log.warning("EL looks like a fraction (%s) — multiplying by 100", el)
        el = round(el * 100, 4)
    if el > 20 or el < 0.05:
        log.warning("EL outside normal range for deal '%s': %.4f%%",
                    row.get("deal_name", "?"), el)
    return round(el, 4)


def compute_data_quality(row: pd.Series) -> int:
    """Score 1–5 based on field completeness."""
    score = 1
    if row.get("deal_size_usd"):
        score += 1
    if row.get("expected_loss"):
        score += 1
    if row.get("spread_bps"):
        score += 0.5
    if row.get("trigger_type"):
        score += 0.5
    if row.get("peril"):
        score += 0.5
    if row.get("maturity_date"):
        score += 0.5
    if row.get("rating"):
        score += 0.25
    if row.get("sponsor"):
        score += 0.25
    return min(5, int(score))


TRIGGER_MAP = {
    "indemnity":       "Indemnity",
    "parametric":      "Parametric",
    "industry loss":   "Industry Loss",
    "industry index":  "Industry Loss",
    "modelled":        "Modelled Loss",
    "model":           "Modelled Loss",
    "hybrid":          "Hybrid",
}

PERIL_MAP = {
    "hurricane":   "Hurricane/Wind",
    "wind":        "Hurricane/Wind",
    "typhoon":     "Hurricane/Wind",
    "cyclone":     "Hurricane/Wind",
    "earthquake":  "Earthquake",
    "quake":       "Earthquake",
    "seismic":     "Earthquake",
    "flood":       "Flood",
    "multi":       "Multi-Peril",
    "mortality":   "Mortality",
    "pandemic":    "Pandemic",
    "wildfire":    "Wildfire",
    "fire":        "Wildfire",
    "storm surge": "Storm Surge",
}


def canonicalize(raw: str, mapping: dict) -> str:
    raw_l = raw.lower()
    for k, v in mapping.items():
        if k in raw_l:
            return v
    return raw.strip()[:100]


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    log.info("=== PHASE 3: Normalizing %d records ===", len(df))

    df["deal_size_usd"] = df.apply(normalize_deal_size, axis=1)
    df["expected_loss"] = df.apply(normalize_expected_loss, axis=1)

    # Canonical trigger / peril
    df["trigger_type"] = df["trigger_type"].fillna("").apply(
        lambda x: canonicalize(x, TRIGGER_MAP) if x else ""
    )
    df["peril"] = df["peril"].fillna("").apply(
        lambda x: canonicalize(x, PERIL_MAP) if x else ""
    )

    # Risk multiple
    def safe_rm(row):
        try:
            if row["spread_bps"] and row["expected_loss"]:
                return round(row["spread_bps"] / (row["expected_loss"] * 100), 2)
        except Exception:
            pass
        return None

    df["risk_multiple"] = df.apply(safe_rm, axis=1)

    # Issue year from date if missing
    def extract_year(row):
        y = row.get("issue_year", "")
        if str(y).strip().isdigit() and 1996 <= int(y) <= 2030:
            return int(y)
        raw = str(row.get("issue_date", ""))
        m = RE_YEAR.search(raw)
        if m:
            return int(m.group())
        m2 = RE_YEAR.search(str(row.get("deal_name", "")))
        if m2:
            return int(m2.group())
        return None

    if "issue_year" not in df.columns:
        df["issue_year"] = None
    df["issue_year"] = df.apply(extract_year, axis=1)

    def extract_maturity_year(row):
        raw = str(row.get("maturity_date", ""))
        m = RE_YEAR.search(raw)
        return int(m.group()) if m else None

    df["maturity_year"] = df.apply(extract_maturity_year, axis=1)

    # Deal ID
    df["deal_id"] = df.apply(
        lambda r: make_deal_id(r.get("deal_name", ""), r.get("issue_year", "")), axis=1
    )

    # sovereign_flag
    df["sovereign_flag"] = df["sovereign_flag"].fillna(False).astype(bool)

    # coupon_pct from spread_bps if missing
    df["coupon_pct"] = df.apply(
        lambda r: round(r["spread_bps"] / 100, 4)
        if (r.get("spread_bps") and not r.get("coupon_pct"))
        else r.get("coupon_pct"),
        axis=1,
    )

    # Data quality score
    df["data_quality_score"] = df.apply(compute_data_quality, axis=1)

    # Final column order
    FINAL_COLS = [
        "deal_id", "deal_name", "sponsor", "issuer_spv",
        "issue_year", "maturity_year",
        "deal_size_usd", "original_currency", "size_as_displayed",
        "trigger_type", "peril", "region", "country_of_risk", "country_of_sponsor",
        "sovereign_flag", "rating",
        "expected_loss", "spread_bps", "coupon_pct", "risk_multiple",
        "triggered", "principal_loss_pct",
        "source_url", "data_quality_score", "scraped_at",
    ]
    for col in FINAL_COLS:
        if col not in df.columns:
            df[col] = None

    return df[FINAL_COLS]


# ══════════════════════════════════════════════════════════════════════════════
# Phase 4 — Validation
# ══════════════════════════════════════════════════════════════════════════════

VALIDATION_BENCHMARKS = {
    "cumulative_issuance_usd_billions": (150, 280),
    "annual_2024_usd_billions":         (14,  22),
    "annual_2023_usd_billions":         (14,  20),
    "avg_deal_size_usd_millions":       (100, 500),
    "max_single_deal_usd_billions":     (0,   2.0),
    "el_mean_pct":                      (1.0, 5.0),
    "el_median_pct":                    (0.5, 3.0),
    "spread_mean_bps":                  (200, 1500),
}

KNOWN_DEALS = [
    ("Migdal",                   2017, 300,  0.25),
    ("FONDEN",                   2017, 360,  0.30),
    ("Residential Reinsurance",  2024, 375,  0.35),
]


def validate(df: pd.DataFrame):
    log.info("=== PHASE 4: Validation ===")
    print("\n" + "=" * 60)
    print("VALIDATION REPORT")
    print("=" * 60)
    print(f"Total deals scraped:   {len(df)}")

    def chk(label, value, lo, hi, unit=""):
        status = "PASS" if lo <= value <= hi else "FAIL"
        print(f"  {label}: {value:.2f}{unit}  [{status} — expected {lo}–{hi}{unit}]")
        return status == "PASS"

    print("\n-- Market-level checks --")
    sized = df[df["deal_size_usd"].notna() & (df["deal_size_usd"] > 0)]
    cumulative_b = sized["deal_size_usd"].sum() / 1000
    chk("Cumulative issuance", cumulative_b, *VALIDATION_BENCHMARKS["cumulative_issuance_usd_billions"], "B USD")

    for yr, key in [(2024, "annual_2024_usd_billions"), (2023, "annual_2023_usd_billions")]:
        yr_total = sized[sized["issue_year"] == yr]["deal_size_usd"].sum() / 1000
        chk(f"Annual {yr}", yr_total, *VALIDATION_BENCHMARKS[key], "B USD")

    avg_size = sized["deal_size_usd"].mean()
    chk("Avg deal size", avg_size, *VALIDATION_BENCHMARKS["avg_deal_size_usd_millions"], "M USD")

    max_deal_b = sized["deal_size_usd"].max() / 1000
    chk("Max single deal", max_deal_b, *VALIDATION_BENCHMARKS["max_single_deal_usd_billions"], "B USD")

    print("\n-- Pricing checks --")
    el = df[df["expected_loss"].notna() & (df["expected_loss"] > 0)]["expected_loss"]
    if len(el) > 0:
        chk("Mean EL", el.mean(), *VALIDATION_BENCHMARKS["el_mean_pct"], "%")
        chk("Median EL", el.median(), *VALIDATION_BENCHMARKS["el_median_pct"], "%")

    sp = df[df["spread_bps"].notna() & (df["spread_bps"] > 0)]["spread_bps"]
    if len(sp) > 0:
        chk("Mean spread", sp.mean(), *VALIDATION_BENCHMARKS["spread_mean_bps"], " bps")

    print("\n-- Known deal spot-checks --")
    for name_frag, year, expected_m, tol in KNOWN_DEALS:
        matches = sized[
            sized["deal_name"].str.contains(name_frag, case=False, na=False) &
            (sized["issue_year"] == year)
        ]
        if matches.empty:
            print(f"  {name_frag} {year}: NOT FOUND [FAIL]")
        else:
            actual = matches["deal_size_usd"].iloc[0]
            lo, hi = expected_m * (1 - tol), expected_m * (1 + tol)
            status = "PASS" if lo <= actual <= hi else "FAIL"
            print(f"  {name_frag} {year}: ${actual:.1f}M  [{status} — expected ~${expected_m}M]")

    print("\n-- Field coverage --")
    for col in ["deal_size_usd", "expected_loss", "spread_bps", "maturity_year", "rating", "trigger_type", "peril"]:
        pct = df[col].notna().mean() * 100
        print(f"  {col}: {pct:.1f}% populated")

    print("=" * 60 + "\n")


# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    log.info("Artemis cat-bond scraper starting — %s", datetime.now(timezone.utc).isoformat())
    checkpoint = load_checkpoint()

    # Phase 1 — listing
    if checkpoint.get("listing_done") and OUTPUT_RAW.exists():
        log.info("Loading listing from checkpoint: %s", OUTPUT_RAW)
        listing_df = pd.read_csv(OUTPUT_RAW)
        listing_deals = listing_df.to_dict("records")
    else:
        listing_deals = scrape_listing()
        checkpoint["listing_done"] = True
        save_checkpoint(checkpoint)

    if not listing_deals:
        log.error("No deals found in listing — aborting")
        return

    # Phase 2 — details
    detail_rows = scrape_details(listing_deals, checkpoint)

    if not detail_rows:
        log.error("No detail records collected — aborting")
        return

    df_raw = pd.DataFrame(detail_rows)
    df_raw.to_csv(OUTPUT_RAW, index=False)
    log.info("Raw data saved: %s (%d rows)", OUTPUT_RAW, len(df_raw))

    # Phase 3 — normalize
    df_clean = normalize_dataframe(df_raw)

    # Phase 4 — validate
    validate(df_clean)

    # Save final output
    df_clean.to_csv(OUTPUT_CLEAN, index=False)
    log.info("Clean master CSV saved: %s (%d rows)", OUTPUT_CLEAN, len(df_clean))
    print(f"\nDone. Output → {OUTPUT_CLEAN}")
    print(f"Log  → {LOG_FILE}")


if __name__ == "__main__":
    main()
