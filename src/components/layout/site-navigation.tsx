"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface MenuLink {
  href: string;
  label: string;
  description: string;
}

interface MenuSection {
  id: string;
  title: string;
  links: MenuLink[];
}

const MENU: MenuSection[] = [
  {
    id: "market",
    title: "MARKET",
    links: [
      { href: "/global-market", label: "Global Market Dashboard", description: "Macro issuance and market structure analytics." },
      { href: "/deals", label: "Deal Explorer", description: "Searchable catastrophe bond transaction universe." },
      { href: "/pricing-intelligence", label: "Pricing Intelligence", description: "Spread, expected loss, and pricing diagnostics." },
      { href: "/global-map", label: "Global Map", description: "Interactive issuance footprint and country routing." }
    ]
  },
  {
    id: "sovereign-policy",
    title: "SOVEREIGN & POLICY",
    links: [
      { href: "/sovereign-dashboard", label: "Sovereign Dashboard", description: "Sovereign-only issuance and structure analysis." },
      { href: "/countries", label: "Country Cases", description: "Country-level intelligence pages and deal tables." },
      { href: "/israel-lab", label: "ISRAEL LAB", description: "Israel-focused sovereign policy and structuring workspace." },
      { href: "/seismic-countries", label: "High Seismic Risk Countries", description: "Issuance vs non-issuance in seismic-risk universe." },
      { href: "/risk-gap", label: "Risk Gap Module", description: "Coverage depth and policy gap screening." },
      { href: "/policy-overview", label: "Policy Overview", description: "Sovereign benchmarks and Israel structuring context." }
    ]
  },
  {
    id: "research-tools",
    title: "RESEARCH & TOOLS",
    links: [
      { href: "/investor-data-room", label: "Investor Data Room", description: "Documented datasets, modules, and structured packages." },
      { href: "/calculator", label: "Pricing Calculator", description: "Illustrative sovereign structuring cost simulation." },
      { href: "/methodology", label: "Methodology", description: "Definitions, data lineage, and governance rules." },
      { href: "/research-library", label: "Research Library", description: "Official PDFs, presentations, podcasts, and country materials." },
      { href: "/cyber-risk", label: "Cyber Risk", description: "Cyber catastrophe bonds — emerging frontier and market overview." },
      { href: "/presentation", label: "Main Presentation", description: "Catastrophe bonds overview presentation with audio." }
    ]
  }
];

export function SiteNavigation() {
  const pathname = usePathname();
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSection = useMemo(
    () => MENU.find((section) => section.id === openSectionId) ?? null,
    [openSectionId]
  );

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function sectionHasActive(section: MenuSection) {
    return section.links.some((link) => isActive(link.href));
  }

  function handleMenuEnter(sectionId: string) {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenSectionId(sectionId);
  }

  function handleMenuLeave() {
    closeTimerRef.current = setTimeout(() => {
      setOpenSectionId(null);
    }, 150);
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(2,4,16,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(148,163,184,0.07)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4 px-4 lg:px-8" style={{ height: 52 }}>
        {/* Logo */}
        <Link href="/" onClick={() => setMobileOpen(false)} className="min-w-0 shrink-0">
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: "#38bdf8",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            Global Catastrophe Bond Intelligence Platform
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {MENU.map((section) => {
            const open = section.id === openSectionId;
            const hasActive = sectionHasActive(section);
            return (
              <div
                key={section.id}
                className="relative"
                onMouseEnter={() => handleMenuEnter(section.id)}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: open || hasActive
                      ? "1px solid rgba(14,165,233,0.3)"
                      : "1px solid transparent",
                    background: open || hasActive
                      ? "rgba(14,165,233,0.08)"
                      : "transparent",
                    color: open || hasActive ? "#38bdf8" : "#94a3b8",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!open && !hasActive) {
                      const t = e.currentTarget;
                      t.style.color = "#38bdf8";
                      t.style.borderColor = "rgba(14,165,233,0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!open && !hasActive) {
                      const t = e.currentTarget;
                      t.style.color = "#94a3b8";
                      t.style.borderColor = "transparent";
                    }
                  }}
                >
                  {section.title}
                  <ChevronDown
                    style={{
                      width: 12,
                      height: 12,
                      transition: "transform 200ms",
                      transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {/* Bridge */}
                {open ? (
                  <div
                    style={{ position: "absolute", top: "100%", left: 0, right: 0, height: 12 }}
                    onMouseEnter={() => handleMenuEnter(section.id)}
                  />
                ) : null}

                {/* Dropdown */}
                {open ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 12px)",
                      width: 420,
                      background: "rgba(2,4,16,0.98)",
                      border: "1px solid rgba(148,163,184,0.1)",
                      borderRadius: 12,
                      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                      padding: 12,
                    }}
                    onMouseEnter={() => handleMenuEnter(section.id)}
                    onMouseLeave={handleMenuLeave}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {section.links.map((link) => {
                        const active = isActive(link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpenSectionId(null)}
                            style={{
                              display: "block",
                              padding: "10px 12px",
                              borderRadius: 8,
                              borderLeft: active ? "2px solid #0ea5e9" : "2px solid transparent",
                              background: active ? "rgba(14,165,233,0.08)" : "transparent",
                              transition: "all 150ms ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            <p style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: active ? "#38bdf8" : "#f1f5f9",
                              marginBottom: 2,
                            }}>
                              {link.label}
                            </p>
                            <p style={{ fontSize: 11, color: "#64748b" }}>{link.description}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/global-market" className={cn("btn-secondary", isActive("/global-market") ? "border-cyan-400/50 text-cyan-100" : "")}>
            Dashboard
          </Link>
          <Link href="/deals" className={cn("btn-hero-primary", isActive("/deals") ? "opacity-90" : "")}>
            Open Explorer
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 6,
            border: "1px solid rgba(148,163,184,0.12)",
            background: "rgba(10,22,40,0.6)",
            color: "#94a3b8",
            cursor: "pointer",
          }}
          className="lg:hidden"
        >
          {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div style={{
          borderTop: "1px solid rgba(148,163,184,0.07)",
          background: "rgba(2,4,16,0.98)",
          padding: "12px 16px 20px",
        }} className="lg:hidden">
          {MENU.map((section) => (
            <div key={section.id} style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "#64748b",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>
                {section.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderLeft: isActive(link.href) ? "2px solid #0ea5e9" : "2px solid transparent",
                      background: isActive(link.href) ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.02)",
                      color: isActive(link.href) ? "#38bdf8" : "#cbd5e1",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{link.label}</p>
                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{link.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(148,163,184,0.07)", paddingTop: 16, marginTop: 4 }}>
            <Link href="/global-market" className="btn-secondary" style={{ flex: 1, textAlign: "center" }} onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link href="/deals" className="btn-hero-primary" style={{ flex: 1, textAlign: "center" }} onClick={() => setMobileOpen(false)}>
              Open Explorer
            </Link>
          </div>
        </div>
      ) : null}

      {activeSection ? (
        <div style={{
          borderTop: "1px solid rgba(148,163,184,0.05)",
          background: "rgba(2,4,16,0.65)",
          padding: "6px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "#64748b",
          letterSpacing: "0.1em",
        }} className="lg:hidden">
          {activeSection.title}
        </div>
      ) : null}
    </header>
  );
}
