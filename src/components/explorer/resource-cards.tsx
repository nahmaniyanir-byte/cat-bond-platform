import { Download, ExternalLink, FileText } from "lucide-react";

import type { ContentFile } from "@/lib/content";
import { EmptyStateCard } from "@/components/ui/empty-state-card";

interface ResourceCardsProps {
  title: string;
  items: ContentFile[];
}

export function ResourceCards({ title, items }: ResourceCardsProps) {
  return (
    <section className="glass-panel p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={`${item.id}-${item.downloadUrl}`} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{item.fileName}</p>
                </div>
                <FileText className="h-4 w-4 text-cyan-200" />
              </div>
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
          <EmptyStateCard />
        )}
      </div>
    </section>
  );
}
