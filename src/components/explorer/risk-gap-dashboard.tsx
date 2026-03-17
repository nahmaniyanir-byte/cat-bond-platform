"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/utils";

interface RiskGapRow {
  country_name: string;
  slug: string;
  region: string;
  deal_count: number;
  total_volume_usd: number;
  latest_issue_year: number | null;
  sovereign_flag: boolean;
  gap_label: "Low Gap" | "Moderate Gap" | "High Gap" | string;
  gap_score: number;
  rationale: string;
}

interface RiskGapDashboardProps {
  rows: RiskGapRow[];
}

export function RiskGapDashboard({ rows }: RiskGapDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Sovereign & Policy</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Risk Gap Module</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Illustrative policy framing of sovereign risk-transfer presence versus potential protection gaps, based on
          transaction footprint, issuance recency, and sovereign program depth.
        </p>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Country Risk Gap Screening</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
                <th className="px-2 py-2">Country</th>
                <th className="px-2 py-2">Region</th>
                <th className="px-2 py-2">Sovereign</th>
                <th className="px-2 py-2">Deals</th>
                <th className="px-2 py-2">Issuance</th>
                <th className="px-2 py-2">Latest Year</th>
                <th className="px-2 py-2">Gap Label</th>
                <th className="px-2 py-2">Gap Score</th>
                <th className="px-2 py-2">Rationale</th>
                <th className="px-2 py-2">Page</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-b border-white/5 text-slate-100/90">
                  <td className="px-2 py-2">{row.country_name}</td>
                  <td className="px-2 py-2 text-slate-300">{row.region}</td>
                  <td className="px-2 py-2 text-slate-300">{row.sovereign_flag ? "Yes" : "No / Mixed"}</td>
                  <td className="px-2 py-2 text-slate-300">{row.deal_count.toLocaleString("en-US")}</td>
                  <td className="px-2 py-2 text-slate-300">{formatCurrency(row.total_volume_usd)}</td>
                  <td className="px-2 py-2 text-slate-300">{row.latest_issue_year ?? "N/A"}</td>
                  <td className="px-2 py-2">
                    <span className={gapClass(row.gap_label)}>{row.gap_label}</span>
                  </td>
                  <td className="px-2 py-2 text-slate-300">{row.gap_score.toFixed(1)}</td>
                  <td className="px-2 py-2 text-slate-300">{row.rationale}</td>
                  <td className="px-2 py-2">
                    <Link href={`/countries/${row.slug}`} className="btn-secondary">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Interpretation Guidance</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              `Low Gap` indicates consistent issuance presence and recent activity. It does not imply low underlying
              hazard.
            </p>
            <p>
              `Moderate Gap` indicates partial coverage patterns or less frequent access to the capital-markets
              transfer layer.
            </p>
            <p>
              `High Gap` indicates low issuance depth and/or stale issuance recency relative to potential sovereign
              risk-financing needs.
            </p>
          </div>
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Methodological Note</h2>
          <p className="mt-4 text-sm text-slate-300">
            This module is an illustrative policy screen and not a full catastrophe risk model. It is designed to
            highlight potential prioritization areas for sovereign market development and financing strategy dialogue.
          </p>
        </article>
      </section>
    </div>
  );
}

function gapClass(label: RiskGapRow["gap_label"]) {
  if (label === "Low Gap") return "rounded-full border border-emerald-300/50 bg-emerald-500/15 px-2 py-1 text-xs text-emerald-100";
  if (label === "Moderate Gap") return "rounded-full border border-amber-300/50 bg-amber-500/15 px-2 py-1 text-xs text-amber-100";
  return "rounded-full border border-rose-300/50 bg-rose-500/15 px-2 py-1 text-xs text-rose-100";
}
