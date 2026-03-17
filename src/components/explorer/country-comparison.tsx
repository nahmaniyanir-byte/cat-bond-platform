"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { CountryMetadata } from "@/lib/content";
import { formatCurrency } from "@/lib/utils";
import { EmptyStateCard } from "@/components/ui/empty-state-card";

interface CountryComparisonProps {
  countries: CountryMetadata[];
}

export function CountryComparison({ countries }: CountryComparisonProps) {
  const [region, setRegion] = useState("");
  const [trigger, setTrigger] = useState("");
  const [modelType, setModelType] = useState("");
  const [peril, setPeril] = useState("");
  const [year, setYear] = useState("");

  const regionOptions = useMemo(
    () => Array.from(new Set(countries.map((item) => item.region))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const triggerOptions = useMemo(
    () => Array.from(new Set(countries.map((item) => item.trigger))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const modelOptions = useMemo(
    () => Array.from(new Set(countries.map((item) => item.modelType).filter((value): value is string => Boolean(value)))).sort(
      (a, b) => a.localeCompare(b)
    ),
    [countries]
  );
  const perilOptions = useMemo(
    () => Array.from(new Set(countries.flatMap((item) => item.peril))).sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(countries.map((item) => item.year).filter((value) => value > 0))).sort((a, b) => b - a),
    [countries]
  );

  const filtered = useMemo(() => {
    return countries.filter((entry) => {
      const matchRegion = !region || entry.region === region;
      const matchTrigger = !trigger || entry.trigger === trigger;
      const matchModel = !modelType || entry.modelType === modelType;
      const matchPeril = !peril || entry.peril.includes(peril);
      const matchYear = !year || String(entry.year) === year;
      return matchRegion && matchTrigger && matchModel && matchPeril && matchYear;
    });
  }, [countries, modelType, peril, region, trigger, year]);

  const chartData = useMemo(
    () =>
      filtered
        .filter((entry) => entry.amountUSD > 0)
        .map((entry) => ({
          name: entry.name,
          amountM: Math.round(entry.amountUSD / 1_000_000)
        })),
    [filtered]
  );

  return (
    <div className="space-y-5">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Comparison Tool</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Country Comparison</h1>
        <p className="mt-2 text-sm text-slate-300">
          Compare countries by peril, trigger type, issuance year, model structure, and region.
        </p>
      </section>

      <section className="glass-panel p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Filter label="Region" value={region} onChange={setRegion} options={regionOptions} />
          <Filter label="Trigger" value={trigger} onChange={setTrigger} options={triggerOptions} />
          <Filter label="Model Type" value={modelType} onChange={setModelType} options={modelOptions} />
          <Filter label="Peril" value={peril} onChange={setPeril} options={perilOptions} />
          <Filter label="Year" value={year} onChange={setYear} options={yearOptions.map(String)} />
        </div>
      </section>

      <section className="glass-panel overflow-x-auto p-4 md:p-5">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
              <th className="px-3 py-3">Country</th>
              <th className="px-3 py-3">Region</th>
              <th className="px-3 py-3">Peril</th>
              <th className="px-3 py-3">Trigger</th>
              <th className="px-3 py-3">Model Type</th>
              <th className="px-3 py-3">Year</th>
              <th className="px-3 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.slug} className="border-b border-white/5 text-slate-100/90">
                <td className="px-3 py-3 font-medium">{entry.name}</td>
                <td className="px-3 py-3 text-slate-300">{entry.region}</td>
                <td className="px-3 py-3 text-slate-300">{entry.peril.join(", ")}</td>
                <td className="px-3 py-3 text-slate-300">{entry.trigger}</td>
                <td className="px-3 py-3 text-slate-300">{entry.modelType ?? "N/A"}</td>
                <td className="px-3 py-3 text-slate-300">{entry.year > 0 ? entry.year : "Policy Case"}</td>
                <td className="px-3 py-3 text-slate-100">{entry.amountUSD > 0 ? formatCurrency(entry.amountUSD) : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="glass-panel p-4 md:p-5">
        <h2 className="text-xl font-semibold text-white">Issuance Amount Comparison</h2>
        {chartData.length ? (
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -18, right: 10, top: 10, bottom: 15 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(value) => `$${value}M`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(34,211,238,0.08)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(148,163,184,0.2)",
                    background: "rgba(2,6,23,0.95)"
                  }}
                  formatter={(value: number) => [`$${value}M`, "Amount"]}
                />
                <Bar dataKey="amountM" fill="rgba(34,211,238,0.78)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyStateCard />
          </div>
        )}
      </section>
    </div>
  );
}

interface FilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function Filter({ label, value, onChange, options }: FilterProps) {
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
