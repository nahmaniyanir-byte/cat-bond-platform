"use client";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  note?: string;
  definition?: string;
  interpretation?: string;
  dataType?: "historical" | "derived" | "illustrative" | string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  note,
  definition,
  interpretation,
  dataType,
  className
}: KpiCardProps) {
  const hasTooltip = Boolean(definition || interpretation || dataType);

  return (
    <article className={cn("glass-panel p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">{label}</p>
        {hasTooltip ? (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <div className="pointer-events-none absolute right-0 top-6 z-20 w-72 rounded-lg border border-white/15 bg-slate-950/96 p-3 text-[11px] opacity-0 shadow-[0_12px_30px_rgba(2,6,23,0.55)] transition group-hover:opacity-100">
              {definition ? <p className="text-slate-100">{definition}</p> : null}
              {interpretation ? <p className="mt-1 text-slate-300">{interpretation}</p> : null}
              {dataType ? (
                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-cyan-200/90">Data Type: {dataType}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold text-cyan-100">{value}</p>
      {note ? <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{note}</p> : null}
    </article>
  );
}
