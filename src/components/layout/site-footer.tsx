"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      style={{
        background: "var(--abyss)",
        borderTop: "1px solid var(--border-1)",
        marginTop: 40,
      }}
    >
      <div
        className="mx-auto w-full max-w-[1700px] px-4 lg:px-8"
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Left: platform identity + live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span className="pulse-dot" />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: "#38bdf8",
            textTransform: "uppercase",
          }}>
            LIVE
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-4)",
            letterSpacing: "0.08em",
          }}>
            — Cat Bond Intelligence Platform
          </span>
        </div>

        {/* Center: key links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
          className="hidden md:flex"
        >
          {[
            { href: "/global-market", label: "Market" },
            { href: "/deals", label: "Explorer" },
            { href: "/israel-lab", label: "Israel Lab" },
            { href: "/countries", label: "Countries" },
            { href: "/methodology", label: "Methodology" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--text-4)",
                textTransform: "uppercase",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#38bdf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-4)"; }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: data source + year */}
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-4)",
          letterSpacing: "0.06em",
          textAlign: "right",
          flexShrink: 0,
        }}>
          Data: Artemis.bm&nbsp;|&nbsp;© 2026
        </div>
      </div>
    </footer>
  );
}
