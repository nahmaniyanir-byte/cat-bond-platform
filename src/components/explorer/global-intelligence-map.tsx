"use client";

import { useMemo, useState } from "react";

import { HomeGlobeExplorer } from "@/components/home/home-globe-explorer";
import type { CountryGlobePoint } from "@/lib/market-data";
import { cn, formatCurrency } from "@/lib/utils";

type ViewFilter = "all" | "sovereign" | "non_sovereign";
type OverlayMode = "issuance" | "disaster_events" | "risk_gap" | "market_footprint";

interface GlobalIntelligenceMapProps {
  points: CountryGlobePoint[];
}

export function GlobalIntelligenceMap({ points }: GlobalIntelligenceMapProps) {
  const [view, setView] = useState<ViewFilter>("all");
  const [overlay, setOverlay] = useState<OverlayMode>("issuance");

  const topRows = useMemo(
    () =>
      [...points]
        .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
        .slice(0, 8),
    [points]
  );

  const overlayNote = getOverlayNote(overlay);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Global Intelligence Map</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Global Cat Bond Intelligence Map</h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-300">
          Interactive global map engine for catastrophe bond footprint analysis with extensible overlays for issuance,
          disaster events, risk gap framing, and sovereign-vs-private market architecture.
        </p>
      </section>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <ToggleButton active={view === "all"} onClick={() => setView("all")} label="All" accent="cyan" />
            <ToggleButton active={view === "sovereign"} onClick={() => setView("sovereign")} label="Sovereign" accent="blue" />
            <ToggleButton
              active={view === "non_sovereign"}
              onClick={() => setView("non_sovereign")}
              label="Non-Sovereign"
              accent="emerald"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ToggleButton active={overlay === "issuance"} onClick={() => setOverlay("issuance")} label="Issuance" accent="cyan" />
            <ToggleButton
              active={overlay === "disaster_events"}
              onClick={() => setOverlay("disaster_events")}
              label="Disaster Events"
              accent="blue"
            />
            <ToggleButton active={overlay === "risk_gap"} onClick={() => setOverlay("risk_gap")} label="Risk Gap" accent="emerald" />
            <ToggleButton
              active={overlay === "market_footprint"}
              onClick={() => setOverlay("market_footprint")}
              label="Market Footprint"
              accent="cyan"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">{overlayNote}</p>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 border-y border-white/10">
        <div className="relative h-[82vh] min-h-[680px]">
          <HomeGlobeExplorer
            points={points.map((point) => ({
              id: point.id,
              country_name: point.country_name,
              slug: point.slug,
              lat: point.lat,
              lng: point.lng,
              sovereign_flag: point.sovereign_flag,
              market_segment: point.market_segment,
              deal_count: point.deal_count,
              total_volume_usd: point.total_volume_usd,
              main_peril: point.main_peril,
              latest_issue_year: point.latest_issue_year,
              tooltip_title: point.tooltip_title,
              tooltip_text: point.tooltip_text,
              destination_url: point.destination_url
            }))}
            activeView={view}
            className="absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/65 via-transparent to-slate-950/85" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Overlay Architecture</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <OverlayCard
              title="Issuance Layer"
              text="Active now. Country markers are generated from the cleaned master transaction dataset."
            />
            <OverlayCard
              title="Disaster Events Layer"
              text="Planned architecture supports future integration of seismic/hazard event references and impact overlays."
            />
            <OverlayCard
              title="Risk Gap Layer"
              text="Supports future framing of sovereign risk exposure vs catastrophe bond protection presence."
            />
            <OverlayCard
              title="Market Footprint Layer"
              text="Supports segmentation by sovereign/non-sovereign and intermediary market structure analysis."
            />
          </div>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Top Issuance Countries</h2>
          <div className="mt-4 space-y-2">
            {topRows.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-slate-900/55 p-3">
                <p className="text-sm font-medium text-white">{row.country_name}</p>
                <p className="mt-1 text-xs text-slate-300">
                  {row.deal_count.toLocaleString("en-US")} deals | {formatCurrency(row.total_volume_usd)} | Latest{" "}
                  {row.latest_issue_year ?? "N/A"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  accent
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent: "cyan" | "blue" | "emerald";
}) {
  const activeClass =
    accent === "blue"
      ? "border-blue-300/80 bg-blue-500/20 text-blue-100"
      : accent === "emerald"
        ? "border-emerald-300/80 bg-emerald-500/20 text-emerald-100"
        : "border-cyan-300/80 bg-cyan-500/20 text-cyan-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-xs uppercase tracking-[0.14em] transition",
        active ? activeClass : "border-white/15 bg-slate-900/60 text-slate-300 hover:border-cyan-300/40"
      )}
    >
      {label}
    </button>
  );
}

function OverlayCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </article>
  );
}

function getOverlayNote(overlay: OverlayMode): string {
  if (overlay === "issuance") {
    return "Issuance overlay is active and fully data-driven from the cleaned master deal dataset.";
  }
  if (overlay === "disaster_events") {
    return "Disaster events overlay is enabled architecturally and can be connected to event datasets in the next release.";
  }
  if (overlay === "risk_gap") {
    return "Risk gap overlay mode is prepared for exposure-vs-coverage data integration.";
  }
  return "Market footprint overlay mode is prepared for advanced sponsor/intermediary and segment overlays.";
}
