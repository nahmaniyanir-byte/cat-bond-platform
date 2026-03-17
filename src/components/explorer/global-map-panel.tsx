"use client";

import { useMemo, useState } from "react";

import { HomeGlobeExplorer } from "@/components/home/home-globe-explorer";
import type { CountryGlobePoint } from "@/lib/market-data";
import { formatCurrency } from "@/lib/utils";

type View = "all" | "sovereign" | "non_sovereign";

interface GlobalMapPanelProps {
  points: CountryGlobePoint[];
}

export function GlobalMapPanel({ points }: GlobalMapPanelProps) {
  const [view, setView] = useState<View>("all");

  const filtered = useMemo(() => {
    if (view === "sovereign") return points.filter((p) => p.sovereign_flag);
    if (view === "non_sovereign") return points.filter((p) => !p.sovereign_flag);
    return points;
  }, [points, view]);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Market</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Global Cat Bond Intelligence Map</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Interactive global map derived from the cleaned SQL-ready dataset. Click markers to open country intelligence pages.
        </p>
      </section>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass(view === "all")} onClick={() => setView("all")}>
            All
          </button>
          <button type="button" className={buttonClass(view === "sovereign")} onClick={() => setView("sovereign")}>
            Sovereign
          </button>
          <button
            type="button"
            className={buttonClass(view === "non_sovereign")}
            onClick={() => setView("non_sovereign")}
          >
            Non-Sovereign
          </button>
        </div>

        <div className="mt-4 h-[70vh] min-h-[560px]">
          <HomeGlobeExplorer points={filtered as any} activeView={view} className="h-full w-full rounded-xl" />
        </div>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Top Countries in Current View</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
                <th className="px-2 py-2">Country</th>
                <th className="px-2 py-2">Deals</th>
                <th className="px-2 py-2">Issuance</th>
                <th className="px-2 py-2">Main Peril</th>
                <th className="px-2 py-2">Latest Year</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered]
                .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
                .slice(0, 20)
                .map((row) => (
                  <tr key={row.id} className="border-b border-white/5 text-slate-100/90">
                    <td className="px-2 py-2">{row.country_name}</td>
                    <td className="px-2 py-2 text-slate-300">{row.deal_count.toLocaleString("en-US")}</td>
                    <td className="px-2 py-2 text-slate-300">{formatCurrency(row.total_volume_usd)}</td>
                    <td className="px-2 py-2 text-slate-300">{row.main_peril}</td>
                    <td className="px-2 py-2 text-slate-300">{row.latest_issue_year ?? "N/A"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function buttonClass(active: boolean) {
  return active
    ? "btn-hero-secondary border-cyan-300/80 bg-cyan-500/20 text-cyan-100"
    : "btn-hero-secondary";
}
