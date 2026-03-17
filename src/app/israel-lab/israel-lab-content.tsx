"use client";

import React from "react";
import Link from "next/link";

/* ── Israeli flag SVG background ───────────────────────────────── */
function IsraeliFlag() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: 0.09,
      }}
    >
      <svg
        viewBox="0 0 220 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          animation: "flagWave 4s ease-in-out infinite",
          transformOrigin: "left center",
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* White background */}
        <rect width="220" height="160" fill="white" />
        {/* Blue stripes */}
        <rect y="22" width="220" height="22" fill="#0038b8" />
        <rect y="116" width="220" height="22" fill="#0038b8" />
        {/* Star of David */}
        <g transform="translate(110,80)" fill="none" stroke="#0038b8" strokeWidth="4">
          <polygon points="0,-28 24,14 -24,14" />
          <polygon points="0,28 24,-14 -24,-14" />
        </g>
      </svg>
    </div>
  );
}

/* ── Video intro overlay ─────────────────────────────────────────── */
function VideoIntroOverlay({ onDone }: { onDone: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Attempt unmuted autoplay; fall back to muted if browser blocks it.
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {
        // If playback fails entirely, dismiss the overlay automatically.
        onDone();
      });
    });
  }, [onDone]);

  function handleEnableSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    video.play().catch(() => undefined);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        src="/video/israel-lab-intro.mp4"
        playsInline
        onEnded={onDone}
        onError={onDone}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 32,
          display: "flex",
          gap: 10,
        }}
      >
        {muted && (
          <button
            onClick={handleEnableSound}
            style={{
              background: "rgba(34,211,238,0.18)",
              color: "white",
              border: "1px solid rgba(34,211,238,0.5)",
              borderRadius: 6,
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: 14,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            🔊 Enable Sound
          </button>
        )}
        <button
          onClick={onDone}
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6,
            padding: "8px 20px",
            cursor: "pointer",
            fontSize: 14,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          Skip →
        </button>
      </div>
    </div>
  );
}

/* ── Severity badge ──────────────────────────────────────────────── */
function SeverityBadge({ magnitude }: { magnitude: number }) {
  if (magnitude >= 7.5) {
    return <span className="cb-badge cb-badge-red">Severe</span>;
  }
  if (magnitude >= 7.0) {
    return <span className="cb-badge cb-badge-orange">Major</span>;
  }
  return <span className="cb-badge cb-badge-gold">Moderate</span>;
}

/* ── Tier progress bar ───────────────────────────────────────────── */
function TierBar({ tier, pct, color }: { tier: number; pct: number; color: string }) {
  const label = tier === 1 ? "Tier 1 — 25% payout" : tier === 2 ? "Tier 2 — 50% payout" : "Tier 3 — 100% payout";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color }} />
      </div>
    </div>
  );
}

const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  "Parametric": "Triggered by measured seismic intensity (PGA/MMI grid). Fastest payout (~72h), lowest basis risk for seismic events. Recommended for sovereign use.",
  "Modelled Loss": "Triggered by catastrophe model output (AIR/RMS). Higher basis risk but better correlation to actual economic loss. Payout in 30–90 days.",
  "Indemnity": "Triggered by actual verified sovereign losses. No basis risk but slow payout (6–18 months) — not recommended for sovereign liquidity use.",
  "Hybrid": "Combines parametric threshold with modelled loss verification. Balances payout speed and loss accuracy. Emerging structure for sovereigns.",
};

const SIZE_OPTIONS = [250, 500, 750, 1000] as const;

/* ── Main content ────────────────────────────────────────────────── */
export function IsraelLabContent() {
  const [showIntro, setShowIntro] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("israelLabIntroDone");
  });
  const [selectedTrigger, setSelectedTrigger] = React.useState("Parametric");
  const [selectedSize, setSelectedSize] = React.useState(300);

  const handleIntroEnd = () => {
    sessionStorage.setItem("israelLabIntroDone", "true");
    setShowIntro(false);
  };

  // Derived output numbers based on selected size
  const tier3Payout = Math.round(selectedSize * 0.25);
  const premiumLow = Math.round(selectedSize * 0.03);
  const premiumHigh = Math.round(selectedSize * 0.04);

  return (
    <>
      {/* Video intro overlay — plays once per session */}
      {showIntro && <VideoIntroOverlay onDone={handleIntroEnd} />}

      {/* Israeli flag waving background */}
      <IsraeliFlag />

      {/* Page content — sits above the flag (z-index: 1) */}
      <div style={{ position: "relative", zIndex: 1 }} className="space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <section className="glass-panel p-6 md:p-8">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Sovereign & Policy</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">ISRAEL LAB</h1>
              <p className="mt-3 max-w-4xl text-sm text-slate-300">
                Policy-oriented workspace for sovereign earthquake risk financing concepts, parametric structure
                framing, and fiscal resilience analysis tailored for Ministry of Finance decision-makers.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="cb-badge cb-badge-blue">Parametric Trigger</span>
                <span className="cb-badge cb-badge-gold">Seismic Risk</span>
                <span className="cb-badge cb-badge-green">Sovereign Finance</span>
              </div>
            </div>
            {/* PDF Export button */}
            <button
              className="no-print cb-btn-primary"
              onClick={() => window.print()}
              style={{ flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 9v3h10V9M7 1v7M4 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export Executive Brief
            </button>
          </div>
        </section>

        {/* ── Two-column layout ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 24 }} className="il-grid">

          {/* LEFT — Inputs ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Trigger parameters */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-4">Trigger Parameters</h2>
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <label className="block mb-1 text-xs uppercase tracking-wide text-slate-400">Trigger Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(TRIGGER_DESCRIPTIONS) as string[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTrigger(t)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: selectedTrigger === t ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                          background: selectedTrigger === t ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.03)",
                          color: selectedTrigger === t ? "#93c5fd" : "#94a3b8",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: selectedTrigger === t ? 600 : 400,
                          textAlign: "left",
                          transition: "all 150ms ease",
                        }}
                      >
                        {selectedTrigger === t ? "✓ " : ""}{t}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>
                    {TRIGGER_DESCRIPTIONS[selectedTrigger]}
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-xs uppercase tracking-wide text-slate-400">Trigger Magnitude Thresholds</label>
                  <div className="space-y-2">
                    {[{ mw: 6.7, label: "Tier 1 Trigger (25% payout)" }, { mw: 7.1, label: "Tier 2 Trigger (50% payout)" }, { mw: 7.5, label: "Tier 3 Trigger (100% payout)" }].map((t) => (
                      <div key={t.mw} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="text-xs text-slate-400">{t.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="text-white font-mono text-sm">Mw {t.mw}</span>
                          <SeverityBadge magnitude={t.mw} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bond parameters */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-4">Bond Parameters</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Bond Size</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: selectedSize === size ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                          background: selectedSize === size ? "rgba(245,158,11,0.15)" : "transparent",
                          color: selectedSize === size ? "#fbbf24" : "#94a3b8",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: selectedSize === size ? 600 : 400,
                          transition: "all 150ms ease",
                        }}
                      >
                        ${size}M
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { label: "Tenor", value: "3 years", note: "Standard" },
                  { label: "Coverage Zone", value: "Dead Sea Transform Fault", note: "Primary" },
                  { label: "Peril", value: "Earthquake", note: "M ≥ 6.5" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(30,45,69,0.5)", paddingBottom: 8 }}>
                    <span className="text-slate-400 text-xs">{item.label}</span>
                    <div style={{ textAlign: "right" }}>
                      <span className="text-white text-xs font-medium">{item.value}</span>
                      <span className="text-slate-500 text-xs ml-2">({item.note})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout tiers */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-4">Payout Tier Structure</h2>
              <TierBar tier={1} pct={25} color="#3b82f6" />
              <TierBar tier={2} pct={50} color="#f59e0b" />
              <TierBar tier={3} pct={100} color="#ef4444" />
              <p className="text-xs text-slate-400 mt-3">
                Payout is trigger-conditional and automatic upon verified seismic event.
              </p>
            </div>

            {/* Links */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-3">Related Tools</h2>
              <div className="space-y-2">
                <Link href="/calculator" className="btn-hero-primary w-full justify-center">
                  Open Pricing Calculator
                </Link>
                <Link href="/seismic-countries" className="btn-hero-secondary w-full justify-center">
                  Peer Country Analysis
                </Link>
                <Link href="/sovereign-dashboard" className="btn-hero-secondary w-full justify-center">
                  Sovereign Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT — Outputs ───────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Key output numbers — reactive to selectedSize */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="cb-stat cb-stat-blue">
                <div className="cb-stat-value" style={{ color: "#60a5fa" }}>${tier3Payout}M</div>
                <div className="cb-stat-label">Max Payout (Tier 3)</div>
              </div>
              <div className="cb-stat cb-stat-gold">
                <div className="cb-stat-value" style={{ color: "#fbbf24" }}>${premiumLow}–{premiumHigh}M</div>
                <div className="cb-stat-label">Annual Premium Est.</div>
              </div>
              <div className="cb-stat cb-stat-green">
                <div className="cb-stat-value" style={{ color: "#34d399" }}>~72h</div>
                <div className="cb-stat-label">Liquidity Injection</div>
              </div>
            </div>

            {/* Executive comparison */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-4">Executive Scenario Comparison</h2>
              <div style={{ overflowX: "auto" }}>
                <table className="cb-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th style={{ color: "#93c5fd" }}>Conservative</th>
                      <th style={{ color: "#fcd34d" }}>
                        Base Case{" "}
                        <span className="cb-badge cb-badge-green" style={{ marginLeft: 4 }}>Recommended</span>
                      </th>
                      <th style={{ color: "#fca5a5" }}>Aggressive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Bond Size", "$200M", "$300M", "$500M"],
                      ["Annual Premium", "$6–8M", "$9–12M", "$15–20M"],
                      ["Tier 3 Payout", "$50M", "$75M", "$125M"],
                      ["Expected Loss", "1.5%", "2.2%", "3.1%"],
                      ["Risk Multiple", "3.2×", "3.5×", "3.8×"],
                      ["Tenor", "3 years", "3 years", "5 years"],
                    ].map(([label, conservative, base, aggressive]) => (
                      <tr key={label}>
                        <td className="text-slate-400 text-xs">{label}</td>
                        <td className="num text-slate-200">{conservative}</td>
                        <td className="num font-medium" style={{ color: "#fcd34d" }}>{base}</td>
                        <td className="num text-slate-200">{aggressive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk context */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-4">Israel Seismic Risk Context</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Dead Sea Transform", value: "Primary Fault", color: "#ef4444" },
                  { label: "Historical M7+", value: "~1 / 100 yrs", color: "#f59e0b" },
                  { label: "Urban Exposure", value: "Very High", color: "#ef4444" },
                  { label: "Existing DRF Instrument", value: "None", color: "#94a3b8" },
                ].map((item) => (
                  <div key={item.label} className="glass-panel p-3">
                    <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                    <div className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer comparison */}
            <div className="glass-panel p-5">
              <h2 className="text-base font-semibold text-white mb-4">Peer Sovereign Precedents</h2>
              <table className="cb-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Size</th>
                    <th>Trigger</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Mexico (FONDEN)", "$360M", "Parametric", "5 issuances"],
                    ["Chile", "$630M", "Parametric", "Active"],
                    ["Philippines", "$500M", "Parametric", "Active"],
                    ["Jamaica", "$185M", "Parametric", "Active"],
                    ["Israel", "$300M*", "Parametric", "Proposed"],
                  ].map(([country, size, trigger, status]) => (
                    <tr key={country}>
                      <td className="font-medium text-xs">{country}</td>
                      <td className="num text-xs">{size}</td>
                      <td className="text-xs"><span className="cb-badge cb-badge-blue">{trigger}</span></td>
                      <td className="text-xs">
                        <span className={status === "Proposed" ? "cb-badge cb-badge-gold" : status === "Active" ? "cb-badge cb-badge-green" : "cb-badge cb-badge-blue"}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-500 mt-2">* Indicative sizing — Base Case scenario</p>
            </div>

          </div>
        </div>

        {/* ── Methodology link ─────────────────────────────────────── */}
        <div className="glass-panel p-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="text-base font-semibold text-white">Methodology & Data Governance</h2>
              <p className="text-sm text-slate-300 mt-1">
                All parameters sourced from Artemis.bm deal directory. Pricing estimates based on
                comparable sovereign seismic transactions 2014–2025.
              </p>
            </div>
            <Link href="/methodology" className="btn-hero-secondary">
              View Methodology
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive grid fix for mobile */}
      <style>{`
        @media (max-width: 900px) {
          .il-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
