"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, Search } from "lucide-react";

import type { LibraryItem } from "@/lib/content";
import { EmptyStateCard } from "@/components/ui/empty-state-card";

interface LibraryBrowserProps {
  title: string;
  subtitle: string;
  items: LibraryItem[];
}

export function LibraryBrowser({ title, subtitle, items }: LibraryBrowserProps) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const countries = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.countryName).filter((value): value is string => Boolean(value)))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.fileName.toLowerCase().includes(normalized) ||
        (item.countryName ?? "").toLowerCase().includes(normalized);
      const matchesCountry = !countryFilter || item.countryName === countryFilter;
      return matchesSearch && matchesCountry;
    });
  }, [countryFilter, items, search]);

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Library</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      </section>

      <section className="glass-panel p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-300">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 pl-9 pr-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
                placeholder="Search by title or country"
              />
            </span>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-300">Country</span>
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
            >
              <option value="">All</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <article key={`${item.id}-${item.downloadUrl}`} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.countryName ?? "Global"}</p>
                </div>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">{item.fileName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Preview
                </a>
                <a href={`${item.downloadUrl}?download=1`} className="btn-secondary">
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyStateCard />
          </div>
        )}
      </section>
    </div>
  );
}
