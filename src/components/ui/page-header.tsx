import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  showSource?: boolean;
  date?: string;
  rightSlot?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  showSource = true,
  date,
  rightSlot,
}: PageHeaderProps) {
  const displayDate =
    date ??
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="cb-page-header page-enter">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* Eyebrow */}
          {eyebrow && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 12,
            }}>
              <span style={{
                display: "block",
                width: 22,
                height: 1.5,
                background: "var(--primary)",
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--primary)",
              }}>
                {eyebrow}
              </span>
              <span style={{
                display: "inline-block",
                animation: "blink 1s step-end infinite",
                color: "var(--primary)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                lineHeight: 1,
              }}>
                ▌
              </span>
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--text-1)",
            letterSpacing: "-0.022em",
            lineHeight: 1.2,
            marginBottom: 7,
          }}>
            {title}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 13,
            color: "var(--text-3)",
            lineHeight: 1.65,
            maxWidth: 700,
          }}>
            {subtitle}
          </p>

          {/* Metadata row */}
          <div style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}>
            {showSource && (
              <span className="cb-source-badge">
                <span
                  className="pulse-dot"
                  style={{ width: 5, height: 5, marginRight: 1 }}
                />
                Source: Artemis.bm
              </span>
            )}
            <span className="cb-source-badge">{displayDate}</span>
          </div>
        </div>

        {rightSlot && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}
