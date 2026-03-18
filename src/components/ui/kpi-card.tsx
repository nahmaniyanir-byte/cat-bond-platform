"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  note?: string;
  definition?: string;
  interpretation?: string;
  dataType?: "historical" | "derived" | "illustrative" | string;
  className?: string;
  /** Visual accent color for the left border and value text */
  accent?: "blue" | "gold" | "green" | "cyan";
}

const ACCENT: Record<
  NonNullable<KpiCardProps["accent"]>,
  { border: string; text: string; glow: string }
> = {
  blue:  { border: "#0ea5e9", text: "#38bdf8",  glow: "rgba(14,165,233,0.10)" },
  gold:  { border: "#f59e0b", text: "#fbbf24",  glow: "rgba(245,158,11,0.10)" },
  green: { border: "#10b981", text: "#34d399",  glow: "rgba(16,185,129,0.10)" },
  cyan:  { border: "#06b6d4", text: "#67e8f9",  glow: "rgba(6,182,212,0.10)"  },
};

export function KpiCard({
  label,
  value,
  note,
  definition,
  interpretation,
  dataType,
  className,
  accent = "blue",
}: KpiCardProps) {
  const hasTooltip = Boolean(definition || interpretation || dataType);
  const cfg = ACCENT[accent];

  return (
    <article
      className={cn("overlay-kpi-card", className)}
      style={{ borderLeft: `2px solid ${cfg.border}` }}
    >
      <div style={{ padding: "18px 20px" }}>

        {/* Label row */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            lineHeight: 1.2,
          }}>
            {label}
          </p>

          {hasTooltip && (
            <div className="group relative" style={{ flexShrink: 0 }}>
              <Info
                style={{ width: 13, height: 13, color: "var(--text-4)", cursor: "help" }}
              />
              {/* Tooltip */}
              <div
                className="pointer-events-none absolute right-0 top-6 z-20 opacity-0 shadow-xl transition-opacity group-hover:opacity-100"
                style={{
                  width: 284,
                  background: "rgba(2,4,16,0.98)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                  backdropFilter: "blur(24px)",
                }}
              >
                {definition && (
                  <p style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.55 }}>
                    {definition}
                  </p>
                )}
                {interpretation && (
                  <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 8, lineHeight: 1.55 }}>
                    {interpretation}
                  </p>
                )}
                {dataType && (
                  <p style={{
                    marginTop: 10,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: cfg.text,
                  }}>
                    DATA TYPE: {dataType}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Value */}
        <p
          className="animate-value-glow"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 28,
            fontWeight: 700,
            color: cfg.text,
            letterSpacing: "-0.025em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
            marginBottom: note ? 9 : 0,
          }}
        >
          {value}
        </p>

        {/* Note */}
        {note && (
          <p style={{
            fontSize: 11,
            color: "var(--text-3)",
            lineHeight: 1.55,
          }}>
            {note}
          </p>
        )}
      </div>
    </article>
  );
}
