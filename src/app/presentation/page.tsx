import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catastrophe Bonds Presentation | Global Catastrophe Bond Intelligence Platform",
};

const PRESENTATION_FILE = "/knowledge/cat-bonds/Catastrophe_Bonds_s (2).pptx";
const PREVIEW_IMAGE = "/knowledge/cat-bonds/unnamed (4).png";

export default function PresentationPage() {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-10 lg:px-8">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "monospace", fontSize: 10, fontWeight: 600,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#0ea5e9", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ display: "block", width: 20, height: 1, background: "#0ea5e9" }} />
            Research &amp; Tools
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#f8fafc", margin: "0 0 8px" }}>
            Catastrophe Bonds — Main Presentation
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Comprehensive overview of catastrophe bond mechanisms, sovereign use cases, and market analytics.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <a
            href={PRESENTATION_FILE}
            download
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.25)",
              borderRadius: 8, color: "#38bdf8", fontSize: 13, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Download PPTX
          </a>
          <a
            href="/research-library"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: 8, color: "#64748b", fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← Research Library
          </a>
        </div>

        {/* Preview image */}
        <div style={{
          background: "rgba(10,22,40,0.7)",
          border: "1px solid rgba(148,163,184,0.08)",
          borderRadius: 14, overflow: "hidden", marginBottom: 24,
        }}>
          <div style={{
            padding: "10px 16px",
            borderBottom: "1px solid rgba(148,163,184,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>
              Presentation Overview
            </span>
            <a
              href={PRESENTATION_FILE}
              download
              style={{ fontFamily: "monospace", fontSize: 10, color: "#0ea5e9", textDecoration: "none" }}
            >
              ↓ Download
            </a>
          </div>
          <div style={{ padding: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PREVIEW_IMAGE}
              alt="Presentation preview"
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.1)",
              }}
            />
            <p style={{
              marginTop: 16, fontSize: 13, color: "#64748b", lineHeight: 1.6,
              textAlign: "center",
            }}>
              This is a Microsoft PowerPoint presentation (.pptx). Download it to view all slides.
            </p>
          </div>
        </div>

        {/* Related podcasts */}
        <div style={{
          background: "rgba(10,22,40,0.5)",
          border: "1px solid rgba(148,163,184,0.08)",
          borderRadius: 12, padding: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", margin: "0 0 14px" }}>
            Related Audio — Hebrew Podcast Episode
          </h2>
          <div style={{
            padding: 16, background: "rgba(10,22,40,0.7)",
            border: "1px solid rgba(148,163,184,0.08)", borderRadius: 10,
          }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", margin: "0 0 4px" }}>
              🎙️ Betting on Natural Disasters Through Catastrophe Bonds
            </p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 12px", fontFamily: "monospace" }}>
              הימור על אסונות טבע דרך אגח קטסטרופה
            </p>
            <audio
              controls
              src='/knowledge/cat-bonds/הימור_על_אסונות_טבע_דרך_אג_ח_קטסטרופה.m4a'
              style={{ width: "100%", borderRadius: 6 }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
