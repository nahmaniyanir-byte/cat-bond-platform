"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useEffect } from "react";
import type { MutableRefObject } from "react";
import { useRouter } from "next/navigation";

import type { GlobePoint } from "@/lib/home-content";
import { cn, formatCurrency } from "@/lib/utils";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading globe module...</div>
}) as any;

type GlobeRef = {
  controls: () => {
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableZoom: boolean;
    enablePan: boolean;
    enableDamping: boolean;
    dampingFactor: number;
  };
  pointOfView: (position: { lat: number; lng: number; altitude?: number }, duration?: number) => void;
};

interface HomeGlobeExplorerProps {
  points: GlobePoint[];
  activeView: string;
  className?: string;
}

export function HomeGlobeExplorer({ points, activeView, className }: HomeGlobeExplorerProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1100, height: 620 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeRef | null>(null);

  const filteredPoints = useMemo(() => {
    if (activeView === "sovereign") return points.filter((item) => item.sovereign_flag);
    if (activeView === "non_sovereign") return points.filter((item) => !item.sovereign_flag);
    return points;
  }, [activeView, points]);

  const ringTargets = useMemo(() => {
    if (!selectedId) return filteredPoints;
    return filteredPoints.filter((item) => item.id === selectedId);
  }, [filteredPoints, selectedId]);

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(320, Math.floor(entry.contentRect.width));
      setDimensions({
        width,
        height: Math.max(420, Math.floor(width * 0.56))
      });
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.32;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
  }, []);

  return (
    <div ref={rootRef} className={cn("relative h-full w-full min-h-[520px] overflow-hidden", className)}>
      <Globe
        ref={globeRef as unknown as MutableRefObject<object>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.2}
        pointsData={filteredPoints}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(datum: object) => {
          const point = datum as GlobePoint;
          const active = point.id === hoveredId || point.id === selectedId;
          return active ? 0.15 : 0.105;
        }}
        pointRadius={(datum: object) => {
          const point = datum as GlobePoint;
          const active = point.id === hoveredId || point.id === selectedId;
          return active ? 0.27 : 0.22;
        }}
        pointColor={(datum: object) => {
          const point = datum as GlobePoint;
          const active = point.id === hoveredId || point.id === selectedId;
          if (point.sovereign_flag) {
            return active ? "#dbeafe" : "#60a5fa";
          }
          return active ? "#dcfce7" : "#34d399";
        }}
        pointLabel={(datum: object) => {
          const point = datum as GlobePoint;
          return `<div style="max-width:280px;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.18);background:rgba(2,6,23,0.95);color:#e2e8f0;font-size:12px;">
            <div style="font-weight:600;margin-bottom:4px;">${point.tooltip_title}</div>
            <div style="margin-bottom:6px;color:#cbd5e1;">${point.tooltip_text}</div>
            <div style="display:flex;justify-content:space-between;gap:10px;color:#94a3b8;"><span>Segment</span><span>${point.market_segment}</span></div>
            <div style="display:flex;justify-content:space-between;gap:10px;color:#94a3b8;"><span>Deals</span><span>${point.deal_count}</span></div>
            <div style="display:flex;justify-content:space-between;gap:10px;color:#94a3b8;"><span>Volume</span><span>${formatCurrency(point.total_volume_usd)}</span></div>
          </div>`;
        }}
        onPointHover={(datum: object | null) => setHoveredId((datum as GlobePoint | null)?.id ?? null)}
        onPointClick={(datum: object) => {
          const point = datum as GlobePoint;
          setSelectedId(point.id);
          globeRef.current?.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.32 }, 760);
          window.setTimeout(() => router.push(resolvePointDestination(point)), 260);
        }}
        ringsData={ringTargets}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius={4.1}
        ringPropagationSpeed={0.72}
        ringRepeatPeriod={1700}
        ringColor={(datum: object) => {
          const point = datum as GlobePoint;
          return (progress: number) =>
            point.sovereign_flag
              ? `rgba(96,165,250,${1 - progress})`
              : `rgba(52,211,153,${1 - progress})`;
        }}
      />

      {!filteredPoints.length ? (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/15 bg-slate-950/85 text-sm text-slate-400">
          No globe points available for the selected view.
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_160px_rgba(56,189,248,0.13)]" />
    </div>
  );
}

function resolvePointDestination(point: GlobePoint): string {
  const configured = point.destination_url?.trim();
  if (!configured) {
    return `/countries/${point.slug}`;
  }

  if (configured === "/country/israel") {
    return "/countries/israel";
  }

  if (configured.startsWith("/countries/")) {
    const slug = configured.split("/").filter(Boolean).pop();
    if (slug) {
      return `/countries/${slug}`;
    }
  }

  if (configured.startsWith("/country/")) {
    const slug = configured.split("/").filter(Boolean).pop();
    if (slug) {
      return `/countries/${slug}`;
    }
  }

  return configured;
}
