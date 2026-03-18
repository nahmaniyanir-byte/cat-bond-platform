import type { Metadata } from "next";
import Link from "next/link";

import { getLibraryIndex } from "@/lib/content";
import { getGlobalKpisData } from "@/lib/market-data";

const DOCUMENTS = [
  { id: 1, title: "Artemis Cat Bond Deal Directory",       type: "Database",      desc: "Complete transaction-level database of all cat bond deals since 1997.",                                     url: "https://www.artemis.bm/deal-directory/",                                  date: "Updated daily" },
  { id: 2, title: "Aon ILS Annual Report 2024",            type: "Market Report", desc: "$17.9B issuance in 2024. 76 transactions. Comprehensive ILS market review.",                              url: "https://www.aon.com",                                                     date: "September 2024" },
  { id: 3, title: "Swiss Re ILS Market Insights H1 2025",  type: "Market Report", desc: "Outstanding market reaches $56B, 13.4% CAGR since 2020.",                                                url: "https://www.swissre.com",                                                  date: "July 2025" },
  { id: 4, title: "AM Best ILS Market Report 2025",        type: "Rating Report", desc: "Outstanding volume $52.7B. Small insurer participation 35%.",                                             url: "https://www.ambest.com",                                                   date: "September 2025" },
  { id: 5, title: "World Bank DRFI Sovereign Cat Bond Guide", type: "Policy",     desc: "Implementation guide for sovereign governments issuing parametric instruments.",                          url: "https://www.worldbank.org/en/topic/disasterriskmanagement",                 date: "2024" },
  { id: 6, title: "IBRD Cat Bond Prospectuses",            type: "Legal",         desc: "Official prospectus documents for IBRD-intermediated sovereign cat bonds.",                               url: "https://www.worldbank.org/en/programs/financial-solutions",                 date: "Various" },
];

export const metadata: Metadata = {
  title: "Investor Data Room | Global Catastrophe Bond Intelligence Platform"
};

export default async function InvestorDataRoomPage() {
  const [library, kpis] = await Promise.all([getLibraryIndex(), getGlobalKpisData()]);

  const totals = {
    documents: library.documents.length + library.pdfs.length,
    presentations: library.presentations.length,
    videos: library.videos.length,
    podcasts: library.podcasts.length
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Research & Tools</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Investor Data Room</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Structured investor-facing package architecture for market data, sovereign case material, and Israel Lab
          technical modules.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Deals in Platform" value={kpis.total_deals.toLocaleString("en-US")} />
        <MetricCard
          label="Cumulative Issuance"
          value={`$${(kpis.cumulative_issuance_usd / 1_000_000_000).toFixed(3)}B`}
        />
        <MetricCard label="Documents" value={totals.documents.toLocaleString("en-US")} />
        <MetricCard label="Presentations" value={totals.presentations.toLocaleString("en-US")} />
        <MetricCard label="Videos" value={totals.videos.toLocaleString("en-US")} />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white mb-1">Reference Documents &amp; Reports</h2>
        <p className="text-xs text-slate-400 mb-4">Key industry sources and policy documents referenced by this platform.</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DOCUMENTS.map((doc) => (
            <article key={doc.id} className="rounded-xl border border-white/10 bg-slate-900/55 p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white leading-snug">{doc.title}</p>
                <span className="cb-badge cb-badge-blue shrink-0">{doc.type}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed flex-1">{doc.desc}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-500">{doc.date}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[11px] px-2 py-1"
                >
                  Open →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <RoomCard
          title="Global Market Package"
          description="Global dashboard analytics, top sponsor rankings, market distributions, and trigger/peril intelligence."
          links={[
            { href: "/global-market", label: "Open Global Market Dashboard" },
            { href: "/pricing-intelligence", label: "Open Pricing Intelligence" },
            { href: "/global-map", label: "Open Global Map" }
          ]}
        />
        <RoomCard
          title="Sovereign Case Package"
          description="Country intelligence pages, sovereign KPI framing, and policy-oriented risk-transfer comparisons."
          links={[
            { href: "/countries", label: "Open Country Intelligence" },
            { href: "/sovereign-dashboard", label: "Open Sovereign Dashboard" },
            { href: "/risk-gap", label: "Open Risk Gap Module" }
          ]}
        />
        <RoomCard
          title="Israel Innovation Package"
          description="ISRAEL LAB trigger simulations, payout analytics, and reliability-labeled policy prototyping."
          links={[
            { href: "/israel-lab", label: "Open ISRAEL LAB" },
            { href: "/calculator", label: "Open Pricing Calculator" },
            { href: "/methodology", label: "Open Methodology" }
          ]}
        />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass-panel p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-cyan-100">{value}</p>
    </article>
  );
}

function RoomCard({
  title,
  description,
  links
}: {
  title: string;
  description: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <article className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
      <div className="mt-4 space-y-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="btn-secondary inline-flex">
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  );
}
