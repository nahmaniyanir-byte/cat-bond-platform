interface EmptyStateCardProps {
  message?: string;
}

export function EmptyStateCard({ message = "Data not available in current dataset" }: EmptyStateCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/45 p-5 text-sm text-slate-400">{message}</div>
  );
}
