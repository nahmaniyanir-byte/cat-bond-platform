"use client";

import { useState } from "react";

/* ── Official documents catalogue ──────────────────────────────── */
const OFFICIAL_DOCS = [
  {
    id: "wb-mexico",
    title: "Mexico Cat Bond 2024 — World Bank Case Study",
    description:
      "Official World Bank case study on Mexico's 2024 sovereign parametric earthquake catastrophe bond.",
    url: "/knowledge/pdfs/worldbank-mexico-catbond-2024.pdf",
    external:
      "https://thedocs.worldbank.org/en/doc/8f7222d60ec54d0b6571131b754319c1-0340012025/original/Case-Study-Mexico-2024-Cat-Bond.pdf",
    category: "World Bank",
    tags: ["Sovereign", "Mexico", "Parametric", "Earthquake"],
    date: "2025",
    type: "PDF",
  },
  {
    id: "wb-jamaica",
    title: "Jamaica Cat Bond 2024 — World Bank Case Study",
    description:
      "World Bank case study on Jamaica's $150M parametric hurricane catastrophe bond.",
    url: "/knowledge/pdfs/worldbank-jamaica-catbond-2024.pdf",
    external:
      "https://thedocs.worldbank.org/en/doc/401877c87631461af8ad227793affc5f-0340012025/original/Case-Study-Jamaica-2024-Cat-Bond.pdf",
    category: "World Bank",
    tags: ["Sovereign", "Jamaica", "Hurricane", "Parametric"],
    date: "December 2025",
    type: "PDF",
  },
  {
    id: "oecd-asia",
    title: "Fostering Cat Bond Markets — OECD Asia Pacific",
    description:
      "Comprehensive OECD study covering Philippines, Mexico, Jamaica, Indonesia. Policy recommendations for sovereign DRF.",
    url: "/knowledge/pdfs/oecd-catbond-asia-pacific-2024.pdf",
    external:
      "https://www.oecd.org/content/dam/oecd/en/publications/reports/2024/02/fostering-catastrophe-bond-markets-in-asia-and-the-pacific_d1e98dc7/ab1e49ef-en.pdf",
    category: "OECD",
    tags: ["OECD", "Policy", "Sovereign", "Asia"],
    date: "February 2024",
    type: "PDF",
  },
  {
    id: "sovereign-policy",
    title: "Financing the Unpredictable — Sovereign Cat Bonds",
    description:
      "Policy report on sovereign catastrophe bonds and disaster risk management. Covers structuring, triggers, and fiscal implications.",
    url: "/knowledge/pdfs/financing-unpredictable-sovereign-catbonds-2025.pdf",
    external:
      "https://cetex.org/wp-content/uploads/2025/02/Financing-the-unpredicatable_sovereign-catastrophe-bonds_disaster-risk-management.pdf",
    category: "Policy Research",
    tags: ["Policy", "Sovereign", "Disaster Risk", "2025"],
    date: "February 2025",
    type: "PDF",
  },
];

/* ── Country documents from knowledge folder ────────────────────── */
const COUNTRY_DOCS = [
  {
    id: "chile",
    country: "Chile",
    title: "Chile Cat Bond 2023",
    description: "Analysis of Chile's catastrophe bond strategy for seismic risk transfer.",
    localFile: "/knowledge/countries/Chile/Chile_Cat_Bond_2023 (1).pdf",
    tags: ["Sovereign", "Chile", "Earthquake", "Seismic"],
    date: "2023",
    type: "PDF",
  },
  {
    id: "mexico-local",
    country: "Mexico",
    title: "Mexico's Architecture of Resilience",
    description: "Comprehensive review of Mexico's sovereign DRF architecture and cat bond issuance history.",
    localFile: "/knowledge/countries/Mexico/Mexico_s_Architecture_of_Resilience.pdf",
    tags: ["Sovereign", "Mexico", "Parametric", "FONDEN"],
    date: "2024",
    type: "PDF",
  },
  {
    id: "peru",
    country: "Peru",
    title: "Peru Catastrophe Bond Strategy",
    description: "Blueprint for Peru's sovereign catastrophe bond program targeting earthquake and flood risk.",
    localFile: "/knowledge/countries/Peru/Peru_Catastrophe_Bond_Strategy (1).pdf",
    tags: ["Sovereign", "Peru", "Earthquake", "Flood"],
    date: "2024",
    type: "PDF",
  },
  {
    id: "philippines",
    country: "Philippines",
    title: "Philippine Catastrophe Bond Blueprint",
    description: "Detailed structuring blueprint for the Philippines sovereign cat bond program covering typhoon and earthquake.",
    localFile: "/knowledge/countries/Philippines/Philippine_Catastrophe_Bond_Blueprint (1).pdf",
    tags: ["Sovereign", "Philippines", "Typhoon", "OECD"],
    date: "2024",
    type: "PDF",
  },
  {
    id: "colombia",
    country: "Colombia",
    title: "Colombia Catastrophe Bonds",
    description: "Colombia's catastrophe bond framework within the Pacific Alliance earthquake risk context.",
    localFile: "/knowledge/countries/colombia/Colombia_Catastrophe_Bonds (1).pdf",
    tags: ["Sovereign", "Colombia", "Earthquake", "Pacific Alliance"],
    date: "2024",
    type: "PDF",
  },
  {
    id: "jamaica-local",
    country: "Jamaica",
    title: "Jamaica Catastrophe Bond Strategy",
    description: "Strategy paper for Jamaica's hurricane and storm-surge catastrophe bond program.",
    localFile: "/knowledge/countries/jamaica/Jamaica_Catastrophe_Bond_Strategy (2).pdf",
    tags: ["Sovereign", "Jamaica", "Hurricane", "Caribbean"],
    date: "2024",
    type: "PDF",
  },
];

/* ── Podcast data ────────────────────────────────────────────────── */
const LOCAL_PODCASTS = [
  {
    id: "pod-catbond-general",
    title: 'הימור על אסונות טבע דרך אגח קטסטרופה',
    titleEn: "Betting on Natural Disasters Through Catastrophe Bonds",
    description: "Hebrew podcast episode on catastrophe bonds as a mechanism for natural disaster risk transfer.",
    src: '/knowledge/cat-bonds/הימור_על_אסונות_טבע_דרך_אג_ח_קטסטרופה.m4a',
    country: "General",
  },
  {
    id: "pod-mexico",
    title: "אגח הקטסטרופה של מקסיקו נגד הטבע",
    titleEn: "Mexico's Catastrophe Bond Against Nature",
    description: "Hebrew podcast episode covering Mexico's catastrophe bond issuance and sovereign resilience strategy.",
    src: '/knowledge/countries/Mexico/אג_ח_הקטסטרופה_של_מקסיקו_נגד_הטבע.m4a',
    country: "Mexico",
  },
  {
    id: "pod-philippines",
    title: "הימור המיליארדים של וול סטריט באגח אסונות",
    titleEn: "Wall Street's Billion-Dollar Bet on Disaster Bonds",
    description: "Hebrew podcast on Wall Street's growing role in catastrophe bond markets and the Philippines case.",
    src: '/knowledge/countries/Philippines/הימור_המיליארדים_של_וול_סטריט_באג_ח_אסונות.m4a',
    country: "Philippines",
  },
  {
    id: "pod-colombia",
    title: "אגח קטסטרופה נגד רעידות אדמה בברית הפסיפית",
    titleEn: "Catastrophe Bonds Against Earthquakes in the Pacific Alliance",
    description: "Hebrew podcast on the Pacific Alliance earthquake catastrophe bond framework covering Colombia.",
    src: '/knowledge/countries/colombia/אג_ח_קטסטרופה_נגד_רעידות_אדמה_בברית_הפסיפית.m4a',
    country: "Colombia",
  },
  {
    id: "pod-jamaica",
    title: "איגרת החוב שמצילה את גמייקה מהוריקנים",
    titleEn: "The Bond Saving Jamaica from Hurricanes",
    description: "Hebrew podcast on Jamaica's hurricane catastrophe bond and its role in sovereign disaster risk financing.",
    src: '/knowledge/countries/jamaica/איגרת_החוב_שמצילה_את_ג_מייקה_מהוריקנים.m4a',
    country: "Jamaica",
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
const TAG_COLORS: Record<string, string> = {
  Sovereign: "rgba(14,165,233,0.15)",
  Parametric: "rgba(16,185,129,0.15)",
  "Market Report": "rgba(245,158,11,0.15)",
  Policy: "rgba(129,140,248,0.15)",
  OECD: "rgba(249,115,22,0.15)",
  "World Bank": "rgba(6,182,212,0.15)",
};
function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? "rgba(148,163,184,0.1)";
}

type Tab = "pdfs" | "countries" | "podcasts" | "presentations";

/* ── FileCard ─────────────────────────────────────────────────────── */
function FileCard({
  title,
  description,
  url,
  external,
  tags,
  date,
  type,
  category,
}: {
  title: string;
  description: string;
  url: string;
  external?: string;
  tags: string[];
  date: string;
  type: string;
  category: string;
}) {
  return (
    <div
      style={{
        background: "rgba(10,22,40,0.7)",
        border: "1px solid rgba(148,163,184,0.08)",
        borderRadius: 12,
        padding: 20,
        transition: "all 200ms ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(148,163,184,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <span style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase" as const,
            color: "#0ea5e9",
          }}>{category}</span>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", margin: "4px 0 0", lineHeight: 1.4 }}>
            {title}
          </h3>
        </div>
        <span style={{
          fontFamily: "monospace", fontSize: 10, color: "#64748b",
          whiteSpace: "nowrap" as const, background: "rgba(255,255,255,0.05)",
          padding: "2px 8px", borderRadius: 4,
        }}>{type}</span>
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{description}</p>

      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
        {tags.map((tag) => (
          <span key={tag} style={{
            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 500,
            background: tagColor(tag), color: "#cbd5e1",
            border: "1px solid rgba(148,163,184,0.1)",
          }}>{tag}</span>
        ))}
        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, color: "#64748b", marginLeft: "auto" }}>
          {date}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "8px 12px",
            background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: 7, color: "#38bdf8", fontSize: 12, fontWeight: 500,
            textDecoration: "none", transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(14,165,233,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(14,165,233,0.1)"; }}
        >
          Open PDF
        </a>
        {external && (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "8px 12px",
              background: "transparent", border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: 7, color: "#64748b", fontSize: 12,
              textDecoration: "none", transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(148,163,184,0.3)";
              e.currentTarget.style.color = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            Source
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Main client component ───────────────────────────────────────── */
export default function ResearchLibraryClient({
  files,
}: {
  files: Record<string, string[]>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("pdfs");
  const [search, setSearch] = useState("");

  const filteredDocs = OFFICIAL_DOCS.filter(
    (doc) =>
      !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredCountry = COUNTRY_DOCS.filter(
    (doc) =>
      !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.country.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  // PPTX from cat-bonds
  const presentations = (files["cat-bonds"] ?? []).filter((f) =>
    f.match(/\.(pptx|ppt|key|pdf)$/i)
  );

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "pdfs", label: "Official Reports", icon: "📄", count: OFFICIAL_DOCS.length },
    { id: "countries", label: "Country PDFs", icon: "🌍", count: COUNTRY_DOCS.length },
    { id: "podcasts", label: "Podcasts", icon: "🎧", count: LOCAL_PODCASTS.length },
    { id: "presentations", label: "Presentations", icon: "📊", count: presentations.length },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontFamily: "monospace", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase" as const,
          color: "#0ea5e9", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ display: "block", width: 20, height: 1, background: "#0ea5e9" }} />
          Research &amp; Tools
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "#f8fafc", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          Research Library
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Official reports, presentations, podcasts, and country materials
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search reports, tags, topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 400,
            padding: "10px 14px",
            background: "rgba(10,22,40,0.7)",
            border: "1px solid rgba(148,163,184,0.12)",
            borderRadius: 8, color: "#f8fafc", fontSize: 13,
            outline: "none", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 28,
        borderBottom: "1px solid rgba(148,163,184,0.08)",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px",
              background: "transparent", border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #0ea5e9" : "2px solid transparent",
              color: activeTab === tab.id ? "#38bdf8" : "#64748b",
              fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer", transition: "all 150ms ease",
              marginBottom: -1,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={{
              background: activeTab === tab.id ? "rgba(14,165,233,0.2)" : "rgba(148,163,184,0.1)",
              color: activeTab === tab.id ? "#38bdf8" : "#64748b",
              borderRadius: 20, padding: "1px 7px",
              fontSize: 10, fontFamily: "monospace",
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── Official PDFs tab ────────────────────────────────── */}
      {activeTab === "pdfs" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filteredDocs.map((doc) => (
            <FileCard key={doc.id} {...doc} />
          ))}
          {filteredDocs.length === 0 && (
            <p style={{ color: "#64748b", gridColumn: "1/-1" }}>No results for &quot;{search}&quot;</p>
          )}
        </div>
      )}

      {/* ── Country PDFs tab ─────────────────────────────────── */}
      {activeTab === "countries" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filteredCountry.map((doc) => (
            <FileCard
              key={doc.id}
              title={doc.title}
              description={doc.description}
              url={doc.localFile}
              tags={doc.tags}
              date={doc.date}
              type={doc.type}
              category={doc.country}
            />
          ))}
          {filteredCountry.length === 0 && (
            <p style={{ color: "#64748b", gridColumn: "1/-1" }}>No results for &quot;{search}&quot;</p>
          )}
        </div>
      )}

      {/* ── Podcasts tab ─────────────────────────────────────── */}
      {activeTab === "podcasts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {LOCAL_PODCASTS.map((pod) => (
            <div key={pod.id} style={{
              padding: 20,
              background: "rgba(10,22,40,0.7)",
              border: "1px solid rgba(148,163,184,0.08)",
              borderRadius: 12,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>🎙️</span>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: "monospace", fontSize: 10, fontWeight: 600,
                    letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    color: "#0ea5e9", margin: "0 0 4px",
                  }}>{pod.country}</p>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", margin: "0 0 2px" }}>
                    {pod.titleEn}
                  </h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px", fontFamily: "monospace" }}>
                    {pod.title}
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                    {pod.description}
                  </p>
                </div>
              </div>
              <audio
                controls
                src={pod.src}
                style={{ width: "100%", borderRadius: 6 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Presentations tab ────────────────────────────────── */}
      {activeTab === "presentations" && (
        <div>
          {presentations.length === 0 ? (
            <div style={{
              padding: 40, textAlign: "center",
              background: "rgba(10,22,40,0.5)",
              border: "1px solid rgba(148,163,184,0.08)", borderRadius: 12,
            }}>
              <p style={{ color: "#64748b", marginBottom: 8 }}>No presentations found</p>
              <p style={{ color: "#475569", fontSize: 12 }}>Add .pdf or .pptx files to the CAT_BONDS folder</p>
            </div>
          ) : (
            <div>
              {/* Preview image if available */}
              {(files["cat-bonds"] ?? []).filter((f) => f.match(/\.(png|jpg|jpeg|webp)$/i)).map((img) => (
                <div key={img} style={{ marginBottom: 24 }}>
                  <p style={{
                    fontFamily: "monospace", fontSize: 10, fontWeight: 600,
                    letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    color: "#64748b", marginBottom: 10,
                  }}>Preview</p>
                  <img
                    src={img}
                    alt="Presentation preview"
                    style={{
                      maxWidth: "100%", borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.1)",
                    }}
                  />
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {presentations.map((filePath) => (
                  <a
                    key={filePath}
                    href={filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: 16, background: "rgba(10,22,40,0.7)",
                      border: "1px solid rgba(148,163,184,0.08)", borderRadius: 10,
                      textDecoration: "none", transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)";
                      e.currentTarget.style.background = "rgba(14,165,233,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148,163,184,0.08)";
                      e.currentTarget.style.background = "rgba(10,22,40,0.7)";
                    }}
                  >
                    <span style={{ fontSize: 28 }}>📊</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", margin: 0, lineHeight: 1.4 }}>
                        {filePath.split("/").pop()?.replace(/\.(pptx|ppt|pdf|key)$/i, "")}
                      </p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0", fontFamily: "monospace" }}>
                        {filePath.split(".").pop()?.toUpperCase()}
                      </p>
                    </div>
                    <span style={{ marginLeft: "auto", color: "#0ea5e9", fontSize: 16 }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
