import type { Metadata } from "next";
import { ArrowRight, ExternalLink } from "lucide-react";

import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { getGlobalFiles, getGlobalMetadata } from "@/lib/content";

export const metadata: Metadata = {
  title: "Global Overview | Global Sovereign Catastrophe Bond Explorer"
};

function toContentApiUrlSafe(filePath: string): string {
  if (filePath.startsWith("http")) return filePath;
  const normalized = filePath.replace(/^\/+/, "");
  const contentRelative = normalized.toLowerCase().startsWith("content/") ? normalized.slice("content/".length) : normalized;
  return `/api/content/${contentRelative
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export default async function GlobalOverviewPage() {
  const [globalMeta, globalFiles] = await Promise.all([getGlobalMetadata(), getGlobalFiles()]);
  const flow = ["Government", "SPV", "Investors", "Trigger Event", "Payout"];

  const generalPresentationUrl = globalMeta.generalPresentation?.file
    ? toContentApiUrlSafe(globalMeta.generalPresentation.file)
    : globalFiles.presentations[0]?.downloadUrl;
  const generalDocumentUrl = globalMeta.generalDocument?.file
    ? toContentApiUrlSafe(globalMeta.generalDocument.file)
    : globalFiles.documents[0]?.downloadUrl;
  const generalVideoUrl = globalFiles.videos[0]?.downloadUrl;

  return (
    <div className="space-y-6">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Global Overview</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sovereign Catastrophe Bonds</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{globalMeta.generalSummary}</p>
      </section>

      <section className="glass-panel p-5 md:p-6">
        <h2 className="text-xl font-semibold text-white">What are Catastrophe Bonds</h2>
        <p className="mt-2 text-sm text-slate-300">
          Catastrophe bonds are risk transfer instruments where investors provide principal that is at risk if predefined
          trigger conditions are met following natural disasters.
        </p>
        <h2 className="mt-5 text-xl font-semibold text-white">Why Governments Use Them</h2>
        <p className="mt-2 text-sm text-slate-300">
          Governments use them to secure pre-arranged liquidity, protect fiscal stability, and diversify disaster risk
          financing beyond budget reallocations and contingent borrowing.
        </p>
        <h2 className="mt-5 text-xl font-semibold text-white">Structure of a Sovereign Cat Bond</h2>
        <div className="mt-4 grid gap-3 xl:grid-cols-5">
          {flow.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-white/10 bg-slate-900/55 px-4 py-3 text-sm font-medium text-slate-100">
                {step}
              </div>
              {index < flow.length - 1 ? <ArrowRight className="hidden h-4 w-4 text-cyan-200 xl:block" /> : null}
            </div>
          ))}
        </div>
        <h2 className="mt-5 text-xl font-semibold text-white">Advantages</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Rapid post-disaster liquidity through predefined trigger design.</li>
          <li>Multi-year risk transfer with transparent contractual conditions.</li>
          <li>Capital market diversification for sovereign disaster risk financing.</li>
        </ul>
        <h2 className="mt-5 text-xl font-semibold text-white">Limitations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>Potential basis risk between fiscal loss and parametric payout.</li>
          <li>Complex structuring, legal preparation, and transaction execution demands.</li>
          <li>Market pricing volatility during global stress periods.</li>
        </ul>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">General Presentation</h3>
          {generalPresentationUrl ? (
            <a href={generalPresentationUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-3 inline-flex">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open Presentation
            </a>
          ) : (
            <div className="mt-3">
              <EmptyStateCard />
            </div>
          )}
        </article>
        <article className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">General Documents</h3>
          {generalDocumentUrl ? (
            <a href={generalDocumentUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-3 inline-flex">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Open Document
            </a>
          ) : (
            <div className="mt-3">
              <EmptyStateCard />
            </div>
          )}
        </article>
        <article className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white">Global Video</h3>
          {generalVideoUrl ? (
            <video controls className="mt-3 w-full rounded-lg border border-white/10 bg-black">
              <source src={generalVideoUrl} />
            </video>
          ) : (
            <div className="mt-3">
              <EmptyStateCard />
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
