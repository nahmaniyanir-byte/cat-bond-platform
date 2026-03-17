"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

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
      { href: "/risk-gap", label: "Risk Gap Module", description: "Coverage depth and policy gap screening." }
    ]
  },
  {
    id: "research-tools",
    title: "RESEARCH & TOOLS",
    links: [
      { href: "/investor-data-room", label: "Investor Data Room", description: "Documented datasets, modules, and structured packages." },
      { href: "/calculator", label: "Pricing Calculator", description: "Illustrative sovereign structuring cost simulation." },
      { href: "/methodology", label: "Methodology", description: "Definitions, data lineage, and governance rules." }
    ]
  }
];

export function SiteNavigation() {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const activeSection = useMemo(
    () => MENU.find((section) => section.id === openSectionId) ?? null,
    [openSectionId]
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Link href="/" className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">
            Global Catastrophe Bond Intelligence Platform
          </p>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {MENU.map((section) => {
            const open = section.id === openSectionId;
            return (
              <div
                key={section.id}
                className="relative"
                onMouseEnter={() => setOpenSectionId(section.id)}
                onMouseLeave={() => setOpenSectionId((current) => (current === section.id ? null : current))}
              >
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold tracking-[0.12em] transition",
                    open
                      ? "border-cyan-300/45 bg-cyan-500/10 text-cyan-100"
                      : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-cyan-300/30 hover:text-cyan-100"
                  )}
                >
                  {section.title}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition", open ? "rotate-180" : undefined)} />
                </button>

                {open ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[420px] rounded-xl border border-white/12 bg-slate-950/94 p-3 shadow-[0_20px_45px_rgba(2,6,23,0.55)]">
                    <div className="space-y-1">
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-lg border border-transparent px-3 py-2 transition hover:border-cyan-300/25 hover:bg-slate-900/70"
                          onClick={() => setOpenSectionId(null)}
                        >
                          <p className="text-sm font-medium text-white">{link.label}</p>
                          <p className="mt-0.5 text-xs text-slate-300">{link.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/global-market" className="btn-secondary">
            Dashboard
          </Link>
          <Link href="/deals" className="btn-hero-primary">
            Open Explorer
          </Link>
        </div>
      </div>

      {activeSection ? (
        <div className="border-t border-white/5 bg-slate-950/65 px-4 py-2 text-xs text-slate-300 lg:hidden">
          {activeSection.title}
        </div>
      ) : null}
    </header>
  );
}
