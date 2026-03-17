"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { cn } from "@/lib/utils";

export interface GlobeCountryPoint {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

interface InteractiveGlobeProps {
  points: GlobeCountryPoint[];
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
  onHover?: (slug: string | null) => void;
  className?: string;
}

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading 3D globe...</div>
}) as any;

type GlobeRef = {
  controls: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
  pointOfView: (position: { lat: number; lng: number; altitude?: number }, duration?: number) => void;
};

export function InteractiveGlobe({ points, selectedSlug, onSelect, onHover, className }: InteractiveGlobeProps) {
  const globeRef = useRef<GlobeRef | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 880, height: 540 });

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setDimensions({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(430, Math.floor(entry.contentRect.height))
      });
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;
    controls.enableZoom = true;
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    const country = points.find((item) => item.slug === selectedSlug);
    if (!country) return;
    globeRef.current?.pointOfView(
      {
        lat: country.latitude,
        lng: country.longitude,
        altitude: 1.35
      },
      900
    );
  }, [selectedSlug, points]);

  const ringData = useMemo(() => {
    if (!selectedSlug) return points;
    return points.filter((point) => point.slug === selectedSlug);
  }, [points, selectedSlug]);

  return (
    <div ref={rootRef} className={cn("relative h-full min-h-[460px] overflow-hidden rounded-xl", className)}>
      <Globe
        ref={globeRef as unknown as MutableRefObject<object>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.16}
        pointsData={points}
        pointLat="latitude"
        pointLng="longitude"
        pointColor={(datum: object) => {
          const point = datum as GlobeCountryPoint;
          return point.slug === selectedSlug ? "#a5f3fc" : "#22d3ee";
        }}
        pointAltitude={(datum: object) => {
          const point = datum as GlobeCountryPoint;
          return point.slug === selectedSlug ? 0.14 : 0.095;
        }}
        pointRadius={0.23}
        pointLabel={(datum: object) => {
          const point = datum as GlobeCountryPoint;
          return `<div style="padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(2,6,23,0.95);color:#e2e8f0;font-size:12px">${point.name}</div>`;
        }}
        onPointHover={(datum: object | null) => onHover?.((datum as GlobeCountryPoint | null)?.slug ?? null)}
        onPointClick={(datum: object) => {
          const point = datum as GlobeCountryPoint;
          globeRef.current?.pointOfView({ lat: point.latitude, lng: point.longitude, altitude: 1.3 }, 700);
          onSelect?.(point.slug);
        }}
        ringsData={ringData}
        ringLat="latitude"
        ringLng="longitude"
        ringMaxRadius={3.4}
        ringPropagationSpeed={0.8}
        ringRepeatPeriod={1600}
        ringColor={() => (t: number) => `rgba(34,211,238, ${1 - t})`}
      />

      {!points.length ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-sm text-slate-400">
          No countries available for this view.
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/10" />
    </div>
  );
}
