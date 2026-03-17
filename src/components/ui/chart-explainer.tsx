interface ChartExplainerProps {
  what: string;
  why: string;
}

export function ChartExplainer({ what, why }: ChartExplainerProps) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/55 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-300">What This Shows</p>
      <p className="mt-1 text-sm text-slate-200">{what}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-300">Why It Matters</p>
      <p className="mt-1 text-sm text-slate-200">{why}</p>
    </div>
  );
}
