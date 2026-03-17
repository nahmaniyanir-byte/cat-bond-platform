"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import type { CountryMetadata, LibraryItem } from "@/lib/content";

interface ResearchDatabaseProps {
  countries: CountryMetadata[];
  libraryItems: LibraryItem[];
}

export function ResearchDatabase({ countries, libraryItems }: ResearchDatabaseProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const rows = useMemo(() => {
    const countryRows = countries.map((country) => ({
      id: `country-${country.slug}`,
      rowType: "country",
      title: country.name,
      type: "country-case",
      country: country.name,
      region: country.region,
      link: `/countries/${country.slug}`
    }));

    const libraryRows = libraryItems.map((item) => ({
      id: `lib-${item.id}-${item.downloadUrl}`,
      rowType: "library",
      title: item.title,
      type: item.type,
      country: item.countryName ?? "Global",
      region: "-",
      link: item.downloadUrl
    }));

    const allRows = [...countryRows, ...libraryRows];
    const normalized = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchSearch =
        !normalized ||
        row.title.toLowerCase().includes(normalized) ||
        row.country.toLowerCase().includes(normalized) ||
        row.type.toLowerCase().includes(normalized);
      const matchType = !type || row.type === type;
      return matchSearch && matchType;
    });
  }, [countries, libraryItems, search, type]);

  const typeOptions = useMemo(
    () => Array.from(new Set(["country-case", ...libraryItems.map((item) => item.type)])).sort((a, b) => a.localeCompare(b)),
    [libraryItems]
  );

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Research Database</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Searchable Research Database</h1>
        <p className="mt-2 text-sm text-slate-300">Unified searchable index for countries, documents, presentations, videos, and policy resources.</p>
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
                placeholder="Search title, type, country..."
              />
            </span>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-300">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
            >
              <option value="">All</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="glass-panel overflow-x-auto p-4 md:p-5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Country</th>
              <th className="px-3 py-3">Region</th>
              <th className="px-3 py-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 text-slate-100/90">
                <td className="px-3 py-3">{row.title}</td>
                <td className="px-3 py-3 text-slate-300">{row.type}</td>
                <td className="px-3 py-3 text-slate-300">{row.country}</td>
                <td className="px-3 py-3 text-slate-300">{row.region}</td>
                <td className="px-3 py-3">
                  <a href={row.link} target={row.rowType === "library" ? "_blank" : undefined} rel="noreferrer" className="btn-secondary">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
