interface EmptyStateCardProps {
  message?: string;
}

export function EmptyStateCard({ message = "Content will be added soon" }: EmptyStateCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/45 p-5 text-sm text-slate-400">{message}</div>
  );
}
