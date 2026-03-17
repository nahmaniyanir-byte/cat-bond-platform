"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

interface CountriesBrowserProps {
  countries: CountryBrowserItem[];
}

export interface CountryBrowserItem {
  name: string;
  slug: string;
  region: string;
  modelType?: string;
  summary?: string;
  peril: string[];
  trigger: string;
  year: number;
  amountUSD: number;
  dealCount?: number;
  sovereignFlag?: boolean;
}

export function CountriesBrowser({ countries }: CountriesBrowserProps) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [trigger, setTrigger] = useState("");
  const [peril, setPeril] = useState("");

  const regionOptions = useMemo(
    () => Array.from(new Set(countries.map((entry) => entry.region))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const triggerOptions = useMemo(
    () => Array.from(new Set(countries.map((entry) => entry.trigger))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const perilOptions = useMemo(
    () => Array.from(new Set(countries.flatMap((entry) => entry.peril))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return countries
      .filter((entry) => {
        const matchSearch =
          !normalized ||
          entry.name.toLowerCase().includes(normalized) ||
          (entry.summary ?? "").toLowerCase().includes(normalized);
        const matchRegion = !region || entry.region === region;
        const matchTrigger = !trigger || entry.trigger === trigger;
        const matchPeril = !peril || entry.peril.includes(peril);
        return matchSearch && matchRegion && matchTrigger && matchPeril;
      })
      .sort((a, b) => b.year - a.year || b.amountUSD - a.amountUSD);
  }, [countries, peril, region, search, trigger]);

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Country Explorer</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sovereign Case Studies</h1>
        <p className="mt-2 text-sm text-slate-300">Search and filter sovereign catastrophe bond and policy relevance cases.</p>
      </section>

      <section className="glass-panel p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-300">Search Country</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 pl-9 pr-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
                placeholder="Mexico, Israel, Philippines..."
              />
            </span>
          </label>

          <SelectField label="Region" value={region} onChange={setRegion} options={regionOptions} />
          <SelectField label="Trigger" value={trigger} onChange={setTrigger} options={triggerOptions} />
          <SelectField label="Peril" value={peril} onChange={setPeril} options={perilOptions} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry) => (
          <article key={entry.slug} className="glass-panel flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">{entry.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{entry.region}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {entry.peril.map((item) => (
                <span key={`${entry.slug}-${item}`} className="chip">
                  {item}
                </span>
              ))}
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              {typeof entry.dealCount === "number" ? (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-400">Deals</dt>
                  <dd className="text-slate-100">{entry.dealCount.toLocaleString("en-US")}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-400">Trigger</dt>
                <dd className="text-slate-100">{entry.trigger}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-400">Year</dt>
                <dd className="text-slate-100">{entry.year > 0 ? entry.year : "Policy Case"}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-400">Amount</dt>
                <dd className="text-slate-100">{entry.amountUSD > 0 ? formatCurrency(entry.amountUSD) : "N/A"}</dd>
              </div>
            </dl>

            <p className="mt-3 line-clamp-3 text-sm text-slate-300">{entry.summary ?? "Content will be added soon."}</p>

            <div className="mt-4">
              <Link href={`/countries/${entry.slug}`} className="btn-primary inline-flex">
                View Case
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
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
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
