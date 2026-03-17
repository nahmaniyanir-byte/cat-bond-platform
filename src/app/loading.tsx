export default function Loading() {
  return (
    <div className="glass-panel flex min-h-[240px] items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-300" />
        <p className="mt-3 text-sm text-slate-300">Loading sovereign policy intelligence...</p>
      </div>
    </div>
  );
}
