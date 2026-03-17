"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type MenuCategoryId = "market" | "sovereign_policy" | "research_tools";

interface MenuLink {
  href: string;
  label: string;
  description: string;
}

interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  links: MenuLink[];
}

const MENU: MenuCategory[] = [
  {
    id: "market",
    label: "MARKET",
    links: [
      {
        href: "/global-market",
        label: "Global Market Dashboard",
        description: "Issuance, market structure, rankings, and cycle analytics."
      },
      {
        href: "/deals",
        label: "Deal Explorer",
        description: "Search and filter the full cleaned catastrophe bond transaction set."
      },
      {
        href: "/pricing-intelligence",
        label: "Pricing Intelligence",
        description: "Spread vs expected loss and pricing distribution diagnostics."
      },
      {
        href: "/global-map",
        label: "Global Globe / Map",
        description: "Interactive global catastrophe bond footprint and overlays."
      },
      {
        href: "/global-market",
        label: "Top Sponsors / Brokers",
        description: "Intermediary, sponsor, and market-share analysis."
      },
      {
        href: "/global-market",
        label: "Trigger / Peril Analytics",
        description: "Comparative peril and trigger mix across the market."
      }
    ]
  },
  {
    id: "sovereign_policy",
    label: "SOVEREIGN & POLICY",
    links: [
      {
        href: "/countries",
        label: "Sovereign Cases",
        description: "Country intelligence pages and structured sovereign case studies."
      },
      {
        href: "/sovereign-dashboard",
        label: "Sovereign Dashboard",
        description: "Sovereign-only issuance, pricing, trigger, and peril analysis."
      },
      {
        href: "/countries",
        label: "Country Pages",
        description: "Detailed country modules built from structured data folders."
      },
      {
        href: "/israel-lab",
        label: "ISRAEL LAB",
        description: "Interactive trigger lab and sovereign liquidity simulation engine."
      },
      {
        href: "/risk-gap",
        label: "Risk Gap Module",
        description: "Illustrative coverage gap and sovereign market-depth framing."
      },
      {
        href: "/policy-overview",
        label: "Policy Notes / Benchmarking",
        description: "Core policy rationale and comparative sovereign structuring context."
      }
    ]
  },
  {
    id: "research_tools",
    label: "RESEARCH & TOOLS",
    links: [
      {
        href: "/research-library",
        label: "Research Library",
        description: "Cross-platform searchable repository of reports and resources."
      },
      {
        href: "/methodology",
        label: "Methodology",
        description: "KPI logic, source hierarchy, and data governance standards."
      },
      {
        href: "/calculator",
        label: "Calculator",
        description: "Cat bond structuring and fiscal cost simulation tools."
      },
      {
        href: "/investor-data-room",
        label: "Investor Data Room",
        description: "Institutional package architecture for market and sovereign content."
      },
      {
        href: "/data-governance",
        label: "Data Governance",
        description: "Classification rules, dedup policy, and validation controls."
      },
      {
        href: "/database",
        label: "Downloadable Datasets",
        description: "Interactive master database with export capability."
      }
    ]
  }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuCategoryId | null>(null);

  const activeMenu = useMemo(
    () =>
      MENU.find((category) =>
        category.links.some(
          (link) => pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
        )
      )?.id ?? null,
    [pathname]
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
          Global Cat Bond Intelligence Platform
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          {MENU.map((category) => {
            const active = activeMenu === category.id;
            const expanded = openMenu === category.id;
            return (
              <div key={category.id} className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setOpenMenu(category.id)}
                  onFocus={() => setOpenMenu(category.id)}
                  onClick={() => setOpenMenu((current) => (current === category.id ? null : category.id))}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                    active || expanded
                      ? "border-cyan-300/50 bg-cyan-500/18 text-cyan-100"
                      : "border-white/10 bg-slate-900/55 text-slate-300 hover:border-cyan-300/40 hover:text-white"
                  )}
                >
                  {category.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded ? "rotate-180" : "")} />
                </button>

                {expanded ? (
                  <div className="absolute right-0 top-full mt-2 w-[760px] rounded-xl border border-white/15 bg-slate-950/96 p-4 shadow-[0_22px_70px_rgba(2,6,23,0.7)]">
                    <div className="grid gap-2 md:grid-cols-2">
                      {category.links.map((link) => {
                        const linkActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                        return (
                          <Link
                            key={`${category.id}-${link.href}-${link.label}`}
                            href={link.href}
                            onClick={() => setOpenMenu(null)}
                            className={cn(
                              "rounded-lg border p-3 transition",
                              linkActive
                                ? "border-cyan-300/55 bg-cyan-500/15"
                                : "border-white/10 bg-slate-900/65 hover:border-cyan-300/35"
                            )}
                          >
                            <p className="text-sm font-semibold text-white">{link.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-300">{link.description}</p>
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
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-3 xl:hidden">
        <div className="space-y-2">
          {MENU.map((category) => {
            const active = activeMenu === category.id;
            return (
              <details
                key={`mobile-${category.id}`}
                className={cn(
                  "rounded-lg border bg-slate-900/70",
                  active ? "border-cyan-300/50" : "border-white/10"
                )}
              >
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  {category.label}
                </summary>
                <div className="space-y-1 border-t border-white/10 p-2">
                  {category.links.map((link) => {
                    const linkActive =
                      pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={`mobile-link-${category.id}-${link.href}-${link.label}`}
                        href={link.href}
                        className={cn(
                          "block rounded-md border px-3 py-2 text-xs",
                          linkActive
                            ? "border-cyan-300/55 bg-cyan-500/15 text-cyan-100"
                            : "border-white/10 bg-slate-900/65 text-slate-300"
                        )}
                      >
                        <p className="font-semibold text-inherit">{link.label}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{link.description}</p>
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </header>
  );
}
