import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ResourceCards } from "@/components/explorer/resource-cards";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { getCountryBundleBySlug, readTextFromFile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Israel Policy Page | Global Sovereign Catastrophe Bond Explorer"
};

const ISRAEL_SECTIONS = [
  {
    title: "Israel Disaster Risk Profile",
    body: "Israel faces material exposure to low-frequency, high-severity natural hazards, especially seismic events, with direct and indirect public finance implications."
  },
  {
    title: "Earthquake Risk",
    body: "Seismic exposure in and around the Dead Sea Transform fault system creates potential tail-risk events that could produce concentrated infrastructure and housing losses."
  },
  {
    title: "Fiscal Risk Exposure",
    body: "Extreme disaster scenarios can generate significant contingent liabilities for government budgets through emergency response, reconstruction, and economic recovery spending."
  },
  {
    title: "Potential Role of Cat Bonds",
    body: "A sovereign or public-sector catastrophe bond could complement existing financial protection tools by securing pre-arranged capital market liquidity under transparent trigger rules."
  },
  {
    title: "International Comparisons",
    body: "Comparators such as Chile, Mexico, and the Philippines demonstrate different pathways to integrate catastrophe bonds into broader sovereign disaster risk financing frameworks."
  },
  {
    title: "Policy Recommendations",
    body: "Priority actions include exposure analytics refinement, trigger feasibility analysis, legal structuring assessment, and phased market engagement with development partner support."
  }
];

export default async function IsraelPage() {
  const israel = await getCountryBundleBySlug("israel");
  if (!israel) {
    notFound();
  }

  const noteTexts = (
    await Promise.all(israel.noteFiles.map(async (file) => ({ file, text: await readTextFromFile(file) })))
  ).filter((entry) => Boolean(entry.text));

  return (
    <div className="space-y-6">
      <section className="glass-panel p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Israel Policy Page</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{israel.meta.heroTitle ?? "Israel"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          {israel.meta.summary ??
            "Policy analysis of catastrophe bond relevance for Israel, focused on disaster risk, fiscal resilience, and potential sovereign risk transfer design."}
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {ISRAEL_SECTIONS.map((section) => (
          <article key={section.title} className="glass-panel p-5">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-3 text-sm text-slate-300">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Research Notes</h2>
        <div className="mt-4 space-y-3">
          {noteTexts.map((entry) => (
            <article key={entry.file.id} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-sm font-semibold text-slate-100">{entry.file.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{entry.text}</p>
            </article>
          ))}
          {(israel.meta.notes ?? []).map((note) => (
            <article key={note} className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
              {note}
            </article>
          ))}
          {!noteTexts.length && !(israel.meta.notes ?? []).length ? <EmptyStateCard /> : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ResourceCards title="Israel Presentations" items={israel.presentationFiles} />
        <ResourceCards title="Israel PDF Documents" items={israel.pdfFiles} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ResourceCards title="Israel Data Files" items={israel.dataFiles} />
        <ResourceCards title="Israel Sources" items={israel.sourceFiles} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ResourceCards title="Israel Videos" items={israel.videoFiles} />
        <ResourceCards title="Israel Podcasts" items={israel.podcastFiles} />
      </section>
    </div>
  );
}
