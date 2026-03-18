interface ChartExplainerProps {
  what: string;
  why: string;
}

export function ChartExplainer({ what, why }: ChartExplainerProps) {
  return (
    <div style={{
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 1,
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-1)",
      overflow: "hidden",
      background: "var(--border-1)",
    }}>
      {/* What */}
      <div style={{
        background: "rgba(2,4,16,0.82)",
        padding: "12px 16px",
      }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--primary)",
          marginBottom: 6,
        }}>
          WHAT THIS SHOWS
        </p>
        <p style={{
          fontSize: 12,
          color: "var(--text-3)",
          lineHeight: 1.6,
        }}>
          {what}
        </p>
      </div>

      {/* Why */}
      <div style={{
        background: "rgba(2,4,16,0.82)",
        padding: "12px 16px",
      }}>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--gold)",
          marginBottom: 6,
        }}>
          WHY IT MATTERS
        </p>
        <p style={{
          fontSize: 12,
          color: "var(--text-3)",
          lineHeight: 1.6,
        }}>
          {why}
        </p>
      </div>
    </div>
  );
}
