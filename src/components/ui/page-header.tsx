interface PageHeaderProps {
  title: string;
  subtitle: string;
  showSource?: boolean;
  date?: string;
  rightSlot?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showSource = true, date, rightSlot }: PageHeaderProps) {
  const displayDate = date ?? new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="cb-page-header">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="cb-section-title">{title}</h1>
          <p className="cb-section-subtitle">{subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {showSource && (
              <span className="cb-source-badge">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Source: Artemis.bm
              </span>
            )}
            <span className="cb-source-badge">{displayDate}</span>
          </div>
        </div>
        {rightSlot && <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>}
      </div>
    </div>
  );
}
