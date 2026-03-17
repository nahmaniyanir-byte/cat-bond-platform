export default function CountryLoading() {
  return (
    <div className="glass-panel flex min-h-[240px] items-center justify-center p-7">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-300" />
        <p className="mt-3 text-sm text-slate-300">Loading country case study...</p>
      </div>
    </div>
  );
}
