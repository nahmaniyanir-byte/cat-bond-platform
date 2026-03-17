import type { Metadata } from "next";
import Link from "next/link";

import { getLibraryIndex } from "@/lib/content";
import { getGlobalKpisData } from "@/lib/market-data";

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
