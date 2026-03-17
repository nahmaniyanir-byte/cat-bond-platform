import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ISRAEL LAB | Global Catastrophe Bond Intelligence Platform"
};

export default function IsraelLabPage() {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Sovereign & Policy</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">ISRAEL LAB</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Policy-oriented workspace for sovereign earthquake risk financing concepts, parametric structure framing, and
          fiscal resilience analysis.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white">Structuring Inputs</h2>
          <p className="mt-2 text-sm text-slate-300">
            Trigger architecture, peril profile, and payout logic can be assessed through the calculator and market diagnostics modules.
          </p>
          <Link href="/calculator" className="btn-hero-primary mt-4 inline-flex">
            Open Calculator
          </Link>
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white">Peer Comparisons</h2>
          <p className="mt-2 text-sm text-slate-300">
            Review sovereign case studies and seismic-risk issuance patterns across comparable countries.
          </p>
          <Link href="/seismic-countries" className="btn-hero-primary mt-4 inline-flex">
            Open Seismic Countries
          </Link>
        </article>
        <article className="glass-panel p-5">
          <h2 className="text-lg font-semibold text-white">Methodology</h2>
          <p className="mt-2 text-sm text-slate-300">
            Data governance and formula references are documented for transparent policy interpretation.
          </p>
          <Link href="/methodology" className="btn-hero-primary mt-4 inline-flex">
            Open Methodology
          </Link>
        </article>
      </section>
    </div>
  );
}
