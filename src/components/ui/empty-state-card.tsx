interface EmptyStateCardProps {
  message?: string;
}

export function EmptyStateCard({
  message = "Data not available in current dataset",
}: EmptyStateCardProps) {
  return (
    <div className="cb-empty-state">
      {message}
    </div>
  );
}
