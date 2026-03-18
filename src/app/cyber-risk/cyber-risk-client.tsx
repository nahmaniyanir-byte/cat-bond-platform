"use client";

const STATS = [
  { label: "Outstanding Cyber Cat Bonds", value: "$785M", note: "End of 2024", color: "#0ea5e9" },
  { label: "Market Share (Gallagher)", value: "60%+", note: "Of cyber ILS placements", color: "#f59e0b" },
  { label: "First Cyber Cat Bond", value: "2023", note: "Landmark 144A transaction", color: "#10b981" },
];

const EXTERNAL_LINKS = [
  ["Artemis — Cyber Cat Bond Tracker", "https://www.artemis.bm/tag/cyber-catastrophe-bond/"],
  ["Gallagher Re — Cyber ILS Report", "https://www.ajg.com/reinsurance/"],
  ["AM Best — Cyber Cat Bond Analysis", "https://www.ambest.com"],
];

export interface CyberFiles {
  pdfs: string[];
  audio: string[];
  images: string[];
}

export default function CyberRiskClient({ files }: { files: CyberFiles }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontFamily: "monospace", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#0ea5e9", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ display: "block", width: 20, height: 1, background: "#0ea5e9" }} />
          Research &amp; Tools
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#f8fafc", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Cyber Risk Cat Bonds
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
          The emerging frontier of cyber catastrophe bonds — market development,
          structuring approaches, and risk transfer frameworks for systemic cyber events.
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36 }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(10,22,40,0.7)",
            border: "1px solid rgba(148,163,184,0.08)",
            borderLeft: `3px solid ${stat.color}`,
            borderRadius: 10, padding: "16px 20px",
          }}>
            <p style={{
              fontFamily: "monospace", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#64748b", margin: "0 0 8px",
            }}>{stat.label}</p>
            <p style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: stat.color, margin: "0 0 4px" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Market overview */}
      <div style={{
        background: "rgba(10,22,40,0.7)",
        border: "1px solid rgba(148,163,184,0.08)",
        borderRadius: 12, padding: 24, marginBottom: 28,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#f8fafc", margin: "0 0 16px" }}>Market Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0ea5e9", margin: "0 0 10px" }}>Why Cyber Cat Bonds?</h3>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }}>
              <li>Systemic cyber events can exceed traditional insurance capacity</li>
              <li>Capital markets provide uncorrelated, scalable protection</li>
              <li>Parametric triggers enable rapid payouts post-event</li>
              <li>Diversification for cat bond investors beyond natural catastrophe</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b", margin: "0 0 10px" }}>Key Market Players</h3>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }}>
              <li><strong style={{ color: "#e2e8f0" }}>Gallagher Securities</strong> — 60%+ market share</li>
              <li><strong style={{ color: "#e2e8f0" }}>Beazley</strong> — first 144A cyber sponsor</li>
              <li><strong style={{ color: "#e2e8f0" }}>Zurich, AXA</strong> — early sponsors</li>
              <li><strong style={{ color: "#e2e8f0" }}>AIR, RMS</strong> — risk modellers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Images */}
      {files.images.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc", margin: "0 0 14px" }}>Visual Overviews</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {files.images.map((img) => (
              <a key={img} href={img} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={img.split("/").pop() ?? ""} style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(148,163,184,0.1)" }} />
                <p style={{ fontSize: 11, color: "#64748b", margin: "6px 0 0", textAlign: "center", fontFamily: "monospace" }}>
                  {img.split("/").pop()}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* PDFs */}
      {files.pdfs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc", margin: "0 0 14px" }}>PDF Documents</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.pdfs.map((pdf) => (
              <a
                key={pdf}
                href={pdf}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  background: "rgba(10,22,40,0.7)",
                  border: "1px solid rgba(148,163,184,0.08)",
                  borderRadius: 8, textDecoration: "none", transition: "border-color 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.08)"; }}
              >
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ fontSize: 13, color: "#e2e8f0" }}>
                  {pdf.split("/").pop()?.replace(/\.pdf$/i, "")}
                </span>
                <span style={{ marginLeft: "auto", color: "#0ea5e9", fontSize: 12 }}>Open →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {files.audio.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc", margin: "0 0 14px" }}>
            Audio — Podcasts &amp; Discussions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {files.audio.map((src) => (
              <div key={src} style={{
                padding: 16, background: "rgba(10,22,40,0.7)",
                border: "1px solid rgba(148,163,184,0.08)", borderRadius: 10,
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", margin: "0 0 10px" }}>
                  🎙️ {src.split("/").pop()?.replace(/\.(mp3|wav|m4a|aac)$/i, "")}
                </p>
                <audio controls src={src} style={{ width: "100%", borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External links */}
      <div style={{
        background: "rgba(10,22,40,0.5)",
        border: "1px solid rgba(148,163,184,0.08)",
        borderRadius: 12, padding: 20,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", margin: "0 0 14px" }}>External Resources</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXTERNAL_LINKS.map(([label, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13, textDecoration: "none", padding: "6px 0", transition: "color 150ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#38bdf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
            >
              <span style={{ color: "#0ea5e9" }}>→</span> {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
