"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Search, X } from "lucide-react";

import type { MasterDealRecord } from "@/lib/market-data";
import { cn, formatCurrency } from "@/lib/utils";

type SegmentFilter = "all" | "sovereign" | "non_sovereign";
type TriggeredFilter = "all" | "triggered" | "not_triggered";
type SortDirection = "asc" | "desc";
type SortColumn =
  | "deal_name"
  | "country_name"
  | "deal_year"
  | "sponsor_name"
  | "market_segment"
  | "total_deal_size_usd"
  | "average_expected_loss_percent"
  | "average_final_spread_bps"
  | "average_risk_multiple";

interface TransactionDatabaseProps {
  deals: MasterDealRecord[];
  variant?: "database" | "deal_explorer";
  showDealLinks?: boolean;
  enableCompare?: boolean;
  dealHrefById?: Record<string, string>;
}

const PAGE_SIZE = 25;
const MAX_COMPARE = 3;

export function TransactionDatabase({
  deals,
  variant = "database",
  showDealLinks = false,
  enableCompare = false,
  dealHrefById = {}
}: TransactionDatabaseProps) {
  const router = useRouter();
  const isDealExplorer = variant === "deal_explorer";

  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [country, setCountry] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [peril, setPeril] = useState("");
  const [trigger, setTrigger] = useState("");
  const [year, setYear] = useState("");
  const [region, setRegion] = useState("");
  const [bookrunner, setBookrunner] = useState("");
  const [broker, setBroker] = useState("");
  const [triggered, setTriggered] = useState<TriggeredFilter>("all");

  const [dealSizeMin, setDealSizeMin] = useState("");
  const [dealSizeMax, setDealSizeMax] = useState("");
  const [expectedLossMin, setExpectedLossMin] = useState("");
  const [expectedLossMax, setExpectedLossMax] = useState("");
  const [spreadMin, setSpreadMin] = useState("");
  const [spreadMax, setSpreadMax] = useState("");

  const [sortColumn, setSortColumn] = useState<SortColumn>("deal_year");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const options = useMemo(() => buildOptions(deals), [deals]);

  const filteredDeals = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const minSize = parseNumber(dealSizeMin);
    const maxSize = parseNumber(dealSizeMax);
    const minEl = parseNumber(expectedLossMin);
    const maxEl = parseNumber(expectedLossMax);
    const minSpread = parseNumber(spreadMin);
    const maxSpread = parseNumber(spreadMax);

    const rows = deals.filter((deal) => {
      const matchSearch =
        !normalized ||
        (deal.deal_name ?? "").toLowerCase().includes(normalized) ||
        (deal.sponsor_name ?? "").toLowerCase().includes(normalized) ||
        (deal.issuer_name ?? "").toLowerCase().includes(normalized) ||
        (deal.country_name ?? "").toLowerCase().includes(normalized);
      const matchSegment =
        segment === "all" || (segment === "sovereign" ? deal.sovereign_flag : !deal.sovereign_flag);
      const matchCountry = !country || deal.country_name === country;
      const matchSponsor = !sponsor || deal.sponsor_name === sponsor;
      const matchPeril = !peril || deal.peril_tags.includes(peril);
      const matchTrigger = !trigger || deal.trigger_type_normalized === trigger;
      const matchYear = !year || String(deal.deal_year ?? "") === year;
      const matchRegion = !region || deal.region_normalized === region;
      const matchBookrunner = !bookrunner || (deal.bookrunner_name ?? "") === bookrunner;
      const matchBroker =
        !broker ||
        (deal.broker_name ?? "") === broker ||
        (deal.placement_agent_name ?? "") === broker;
      const matchTriggered =
        triggered === "all" ||
        (triggered === "triggered" ? deal.triggered_deal_flag : !deal.triggered_deal_flag);

      const matchSizeMin = minSize == null || deal.total_deal_size_usd >= minSize;
      const matchSizeMax = maxSize == null || deal.total_deal_size_usd <= maxSize;
      const matchElMin = minEl == null || toNumberOrNegativeInfinity(deal.average_expected_loss_percent) >= minEl;
      const matchElMax = maxEl == null || toNumberOrNegativeInfinity(deal.average_expected_loss_percent) <= maxEl;
      const matchSpreadMin = minSpread == null || toNumberOrNegativeInfinity(deal.average_final_spread_bps) >= minSpread;
      const matchSpreadMax = maxSpread == null || toNumberOrNegativeInfinity(deal.average_final_spread_bps) <= maxSpread;

      return (
        matchSearch &&
        matchSegment &&
        matchCountry &&
        matchSponsor &&
        matchPeril &&
        matchTrigger &&
        matchYear &&
        matchRegion &&
        matchBookrunner &&
        matchBroker &&
        matchTriggered &&
        matchSizeMin &&
        matchSizeMax &&
        matchElMin &&
        matchElMax &&
        matchSpreadMin &&
        matchSpreadMax
      );
    });

    return rows.sort((a, b) => compareDeals(a, b, sortColumn, sortDirection));
  }, [
    bookrunner,
    broker,
    country,
    dealSizeMax,
    dealSizeMin,
    deals,
    expectedLossMax,
    expectedLossMin,
    peril,
    region,
    search,
    segment,
    sortColumn,
    sortDirection,
    sponsor,
    spreadMax,
    spreadMin,
    trigger,
    triggered,
    year
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    segment,
    country,
    sponsor,
    peril,
    trigger,
    year,
    region,
    bookrunner,
    broker,
    triggered,
    dealSizeMin,
    dealSizeMax,
    expectedLossMin,
    expectedLossMax,
    spreadMin,
    spreadMax,
    sortColumn,
    sortDirection
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filteredDeals.slice(pageStart, pageStart + PAGE_SIZE);

  const summary = useMemo(() => {
    const totalVolume = filteredDeals.reduce((sum, deal) => sum + deal.total_deal_size_usd, 0);
    const sovereign = filteredDeals.filter((deal) => deal.sovereign_flag).length;
    return {
      dealsShown: filteredDeals.length,
      totalVolume,
      sovereignDeals: sovereign,
      nonSovereignDeals: Math.max(0, filteredDeals.length - sovereign)
    };
  }, [filteredDeals]);

  const comparedDeals = useMemo(
    () =>
      compareIds
        .map((id) => deals.find((deal) => deal.id === id))
        .filter((deal): deal is MasterDealRecord => Boolean(deal)),
    [compareIds, deals]
  );

  function clearAllFilters() {
    setSearch("");
    setSegment("all");
    setCountry("");
    setSponsor("");
    setPeril("");
    setTrigger("");
    setYear("");
    setRegion("");
    setBookrunner("");
    setBroker("");
    setTriggered("all");
    setDealSizeMin("");
    setDealSizeMax("");
    setExpectedLossMin("");
    setExpectedLossMax("");
    setSpreadMin("");
    setSpreadMax("");
  }

  function onSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection(defaultDirection(column));
  }

  function toggleCompare(dealId: string) {
    setCompareIds((current) => {
      if (current.includes(dealId)) return current.filter((item) => item !== dealId);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, dealId];
    });
  }

  function removeFromCompare(dealId: string) {
    setCompareIds((current) => current.filter((item) => item !== dealId));
  }

  function openDeal(deal: MasterDealRecord) {
    if (!isDealExplorer) return;
    router.push(resolveDealHref(deal, dealHrefById));
  }

  function exportJson() {
    downloadFile(
      JSON.stringify(filteredDeals, null, 2),
      isDealExplorer ? "cat_bond_deal_explorer_filtered.json" : "cat_bond_transactions_filtered.json",
      "application/json;charset=utf-8"
    );
  }

  function exportCsv() {
    const csv = toCsv(filteredDeals);
    downloadFile(
      csv,
      isDealExplorer ? "cat_bond_deal_explorer_filtered.csv" : "cat_bond_transactions_filtered.csv",
      "text/csv;charset=utf-8"
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">
          {isDealExplorer ? "Deal Explorer" : "Global Transaction Database"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {isDealExplorer ? "Catastrophe Bond Deal Explorer" : "Catastrophe Bond Master Database"}
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-300">
          {isDealExplorer
            ? "Explore the global catastrophe bond market at transaction level with terminal-grade search, filters, and comparative deal analytics."
            : "CSV-backed searchable dataset with sovereign and non-sovereign transactions, trigger structure, peril coverage, and pricing signals."}
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Deals Shown" value={summary.dealsShown.toLocaleString("en-US")} />
        <SummaryCard label="Total Volume Shown" value={formatCurrency(summary.totalVolume)} />
        <SummaryCard label="Sovereign Deals" value={summary.sovereignDeals.toLocaleString("en-US")} />
        <SummaryCard label="Non-Sovereign Deals" value={summary.nonSovereignDeals.toLocaleString("en-US")} />
      </section>

      <section className="glass-panel p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1.5 md:col-span-2 xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-300">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 pl-9 pr-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
                placeholder="Deal, sponsor, issuer, country..."
              />
            </span>
          </label>
          <SelectField
            label="Segment"
            value={segment}
            onChange={(value) => setSegment(value as SegmentFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "sovereign", label: "Sovereign" },
              { value: "non_sovereign", label: "Non-Sovereign" }
            ]}
          />
          <SelectField label="Country" value={country} onChange={setCountry} options={withAll(options.countries)} />
          <SelectField label="Sponsor" value={sponsor} onChange={setSponsor} options={withAll(options.sponsors)} />
          <SelectField label="Peril" value={peril} onChange={setPeril} options={withAll(options.perils)} />
          <SelectField label="Trigger Type" value={trigger} onChange={setTrigger} options={withAll(options.triggers)} />
          <SelectField label="Year" value={year} onChange={setYear} options={withAll(options.years.map(String))} />
          <SelectField label="Region" value={region} onChange={setRegion} options={withAll(options.regions)} />
          {options.bookrunners.length ? (
            <SelectField
              label="Bookrunner"
              value={bookrunner}
              onChange={setBookrunner}
              options={withAll(options.bookrunners)}
            />
          ) : null}
          {options.brokers.length ? (
            <SelectField label="Broker / Placement" value={broker} onChange={setBroker} options={withAll(options.brokers)} />
          ) : null}
          <SelectField
            label="Triggered Deal"
            value={triggered}
            onChange={(value) => setTriggered(value as TriggeredFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "triggered", label: "Triggered" },
              { value: "not_triggered", label: "Not Triggered" }
            ]}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <RangeField
            label="Deal Size Range (USD)"
            minValue={dealSizeMin}
            maxValue={dealSizeMax}
            onChangeMin={setDealSizeMin}
            onChangeMax={setDealSizeMax}
          />
          <RangeField
            label="Expected Loss Range (%)"
            minValue={expectedLossMin}
            maxValue={expectedLossMax}
            onChangeMin={setExpectedLossMin}
            onChangeMax={setExpectedLossMax}
          />
          <RangeField
            label="Spread Range (bps)"
            minValue={spreadMin}
            maxValue={spreadMax}
            onChangeMin={setSpreadMin}
            onChangeMax={setSpreadMax}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <button type="button" onClick={clearAllFilters} className="btn-secondary">
            Clear All Filters
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportJson} className="btn-secondary">
              <Download className="mr-2 h-3.5 w-3.5" />
              Export JSON
            </button>
            <button type="button" onClick={exportCsv} className="btn-secondary">
              <Download className="mr-2 h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <section className={cn(enableCompare ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]" : "space-y-0")}>
        <div className="glass-panel overflow-x-auto p-4 md:p-5">
          <table className="w-full min-w-[1700px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
                {enableCompare ? (
                  <th className="sticky left-0 top-0 z-20 bg-slate-950/95 px-2 py-3 text-center">Compare</th>
                ) : null}
                <SortableHeader
                  label="Deal Name"
                  column="deal_name"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                {showDealLinks || isDealExplorer ? <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Deal Page</th> : null}
                <SortableHeader
                  label="Country"
                  column="country_name"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Year"
                  column="deal_year"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Sponsor"
                  column="sponsor_name"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Issuer</th>
                <SortableHeader
                  label="Market Segment"
                  column="market_segment"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Deal Size"
                  column="total_deal_size_usd"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Peril</th>
                <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Trigger Type</th>
                <SortableHeader
                  label="Expected Loss"
                  column="average_expected_loss_percent"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Spread"
                  column="average_final_spread_bps"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <SortableHeader
                  label="Risk Multiple"
                  column="average_risk_multiple"
                  currentColumn={sortColumn}
                  direction={sortDirection}
                  onSort={onSort}
                />
                <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Maturity</th>
                <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Triggered</th>
                <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((deal) => {
                const href = resolveDealHref(deal, dealHrefById);
                const checked = compareIds.includes(deal.id);
                return (
                  <tr
                    key={deal.id}
                    className={cn(
                      "border-b border-white/5 text-slate-100/90 transition",
                      isDealExplorer ? "cursor-pointer hover:bg-cyan-500/8" : ""
                    )}
                    onClick={() => openDeal(deal)}
                  >
                    {enableCompare ? (
                      <td
                        className="sticky left-0 z-10 bg-slate-950/96 px-2 py-3 text-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && compareIds.length >= MAX_COMPARE}
                          onChange={() => toggleCompare(deal.id)}
                          className="accent-cyan-400"
                        />
                      </td>
                    ) : null}
                    <td className="px-3 py-3 font-medium">{deal.deal_name ?? "Unnamed Deal"}</td>
                    {showDealLinks || isDealExplorer ? (
                      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                        <Link href={href} className="btn-secondary">
                          Open
                        </Link>
                      </td>
                    ) : null}
                    <td className="px-3 py-3 text-slate-300">{deal.country_name ?? "N/A"}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.deal_year ?? "N/A"}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.sponsor_name ?? "N/A"}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.issuer_name ?? "N/A"}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.sovereign_flag ? "Sovereign" : "Non-Sovereign"}</td>
                    <td className="px-3 py-3 text-slate-200">{formatCurrency(deal.total_deal_size_usd)}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.peril_tags.join(", ") || "N/A"}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.trigger_type_normalized}</td>
                    <td className="px-3 py-3 text-slate-300">
                      {deal.average_expected_loss_percent != null
                        ? `${deal.average_expected_loss_percent.toFixed(3)}%`
                        : "N/A"}
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {deal.average_final_spread_bps != null ? Math.round(deal.average_final_spread_bps) : "N/A"}
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {deal.average_risk_multiple != null ? `${deal.average_risk_multiple.toFixed(2)}x` : "N/A"}
                    </td>
                    <td className="px-3 py-3 text-slate-300">{deal.maturity_date ?? "N/A"}</td>
                    <td className="px-3 py-3 text-slate-300">{deal.triggered_deal_flag ? "Yes" : "No"}</td>
                    <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      {deal.primary_source_url ? (
                        <a href={deal.primary_source_url} target="_blank" rel="noreferrer" className="btn-secondary">
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Source
                        </a>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredDeals.length ? (
            <div className="mt-4 rounded-lg border border-dashed border-white/15 bg-slate-900/60 px-4 py-8 text-center text-sm text-slate-400">
              No deals matched the current filters. Try clearing filters to broaden the search universe.
              <div className="mt-3">
                <button type="button" onClick={clearAllFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-slate-400">
              <p>
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filteredDeals.length)} of{" "}
                {filteredDeals.length.toLocaleString("en-US")} deals
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={safePage === 1}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={safePage === totalPages}
                  className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {enableCompare ? (
          <aside className="glass-panel h-fit p-4 xl:sticky xl:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Compare Deals</h2>
              <span className="text-xs text-slate-400">
                {compareIds.length}/{MAX_COMPARE}
              </span>
            </div>
            {comparedDeals.length ? (
              <>
                <div className="mt-3 space-y-2">
                  {comparedDeals.map((deal) => (
                    <div
                      key={`compare-chip-${deal.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/55 px-3 py-2"
                    >
                      <p className="line-clamp-1 text-xs text-slate-200">{deal.deal_name ?? "Unnamed Deal"}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCompare(deal.id)}
                        className="rounded-md border border-white/15 p-1 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[320px] text-left text-xs">
                    <tbody>
                      {COMPARE_FIELDS.map((field) => (
                        <tr key={field.label} className="border-b border-white/10 align-top">
                          <th className="w-[122px] px-2 py-2 font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {field.label}
                          </th>
                          <td className="px-2 py-2">
                            <div className="space-y-2">
                              {comparedDeals.map((deal) => (
                                <div
                                  key={`${field.label}-${deal.id}`}
                                  className="rounded-md border border-white/10 bg-slate-900/55 p-2 text-slate-200"
                                >
                                  {field.value(deal)}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-white/15 bg-slate-900/60 p-3 text-sm text-slate-400">
                Select up to 3 deals to compare key metrics side-by-side.
              </div>
            )}
          </aside>
        ) : null}
      </section>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || "all"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeField({
  label,
  minValue,
  maxValue,
  onChangeMin,
  onChangeMax
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          step="any"
          value={minValue}
          onChange={(event) => onChangeMin(event.target.value)}
          placeholder="Min"
          className="h-10 rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        />
        <input
          type="number"
          min={0}
          step="any"
          value={maxValue}
          onChange={(event) => onChangeMax(event.target.value)}
          placeholder="Max"
          className="h-10 rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
        />
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  column,
  currentColumn,
  direction,
  onSort
}: {
  label: string;
  column: SortColumn;
  currentColumn: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
}) {
  const active = currentColumn === column;
  return (
    <th className="sticky top-0 z-10 bg-slate-950/95 px-3 py-3">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-[0.14em] transition",
          active ? "text-cyan-100" : "text-slate-300 hover:text-slate-100"
        )}
      >
        {label}
        {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
      </button>
    </th>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-cyan-100">{value}</p>
    </article>
  );
}

function withAll(values: string[]): Array<{ value: string; label: string }> {
  return [{ value: "", label: "All" }, ...values.map((value) => ({ value, label: value }))];
}

function buildOptions(deals: MasterDealRecord[]) {
  const collect = (items: Array<string | null | undefined>) =>
    Array.from(new Set(items.filter((value): value is string => Boolean(value && value.trim())))).sort((a, b) =>
      a.localeCompare(b)
    );

  return {
    countries: collect(deals.map((deal) => deal.country_name)),
    sponsors: collect(deals.map((deal) => deal.sponsor_name)),
    perils: collect(deals.flatMap((deal) => deal.peril_tags)),
    triggers: collect(deals.map((deal) => deal.trigger_type_normalized)),
    years: Array.from(new Set(deals.map((deal) => deal.deal_year).filter((value): value is number => value != null))).sort(
      (a, b) => b - a
    ),
    regions: collect(deals.map((deal) => deal.region_normalized)),
    bookrunners: collect(deals.map((deal) => deal.bookrunner_name)),
    brokers: collect([...deals.map((deal) => deal.broker_name), ...deals.map((deal) => deal.placement_agent_name)])
  };
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNumberOrNegativeInfinity(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return Number.NEGATIVE_INFINITY;
}

function compareDeals(a: MasterDealRecord, b: MasterDealRecord, column: SortColumn, direction: SortDirection): number {
  const aValue = getSortValue(a, column);
  const bValue = getSortValue(b, column);
  let cmp = 0;

  if (typeof aValue === "number" || typeof bValue === "number") {
    const left = typeof aValue === "number" ? aValue : Number.NEGATIVE_INFINITY;
    const right = typeof bValue === "number" ? bValue : Number.NEGATIVE_INFINITY;
    cmp = left - right;
  } else {
    cmp = String(aValue ?? "").localeCompare(String(bValue ?? ""));
  }

  return direction === "asc" ? cmp : -cmp;
}

function getSortValue(deal: MasterDealRecord, column: SortColumn): string | number | null {
  if (column === "deal_name") return deal.deal_name ?? "";
  if (column === "country_name") return deal.country_name ?? "";
  if (column === "deal_year") return deal.deal_year ?? Number.NEGATIVE_INFINITY;
  if (column === "sponsor_name") return deal.sponsor_name ?? "";
  if (column === "market_segment") return deal.market_segment ?? "";
  if (column === "total_deal_size_usd") return deal.total_deal_size_usd ?? Number.NEGATIVE_INFINITY;
  if (column === "average_expected_loss_percent")
    return deal.average_expected_loss_percent ?? Number.NEGATIVE_INFINITY;
  if (column === "average_final_spread_bps")
    return deal.average_final_spread_bps ?? Number.NEGATIVE_INFINITY;
  return deal.average_risk_multiple ?? Number.NEGATIVE_INFINITY;
}

function defaultDirection(column: SortColumn): SortDirection {
  if (column === "deal_name" || column === "country_name" || column === "sponsor_name" || column === "market_segment") {
    return "asc";
  }
  return "desc";
}

function resolveDealHref(deal: MasterDealRecord, dealHrefById: Record<string, string>): string {
  const candidates = [deal.id, deal.deal_id].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (dealHrefById[candidate]) return `/deals/${dealHrefById[candidate]}`;
  }
  return `/deals/${encodeURIComponent(deal.deal_id ?? deal.id)}`;
}

const COMPARE_FIELDS: Array<{ label: string; value: (deal: MasterDealRecord) => string }> = [
  { label: "Deal", value: (deal) => deal.deal_name ?? "N/A" },
  { label: "Country", value: (deal) => deal.country_name ?? "N/A" },
  { label: "Sponsor", value: (deal) => deal.sponsor_name ?? "N/A" },
  { label: "Year", value: (deal) => String(deal.deal_year ?? "N/A") },
  { label: "Deal Size", value: (deal) => formatCurrency(deal.total_deal_size_usd) },
  { label: "Peril", value: (deal) => deal.peril_tags.join(", ") || "N/A" },
  { label: "Trigger", value: (deal) => deal.trigger_type_normalized },
  {
    label: "Expected Loss",
    value: (deal) => (deal.average_expected_loss_percent != null ? `${deal.average_expected_loss_percent.toFixed(3)}%` : "N/A")
  },
  {
    label: "Spread",
    value: (deal) => (deal.average_final_spread_bps != null ? `${Math.round(deal.average_final_spread_bps)} bps` : "N/A")
  },
  {
    label: "Risk Multiple",
    value: (deal) => (deal.average_risk_multiple != null ? `${deal.average_risk_multiple.toFixed(2)}x` : "N/A")
  },
  { label: "Segment", value: (deal) => (deal.sovereign_flag ? "Sovereign" : "Non-Sovereign") }
];

function toCsv(rows: MasterDealRecord[]): string {
  const headers = [
    "deal_id",
    "deal_name",
    "series_name",
    "sponsor_name",
    "issuer_name",
    "country_name",
    "region_normalized",
    "sovereign_flag",
    "market_segment",
    "covered_perils",
    "trigger_type_normalized",
    "deal_year",
    "total_deal_size_usd",
    "average_expected_loss_percent",
    "average_final_spread_bps",
    "average_risk_multiple",
    "maturity_date",
    "triggered_deal_flag",
    "primary_source_url"
  ];

  const lines = rows.map((row) =>
    headers
      .map((header) => {
        const raw = row[header as keyof MasterDealRecord];
        const value = Array.isArray(raw) ? raw.join("; ") : raw == null ? "" : String(raw);
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return `${headers.join(",")}\n${lines.join("\n")}`;
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
