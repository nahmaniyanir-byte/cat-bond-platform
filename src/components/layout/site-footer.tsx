export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-slate-950/70">
      <div className="mx-auto grid w-full max-w-[1600px] gap-3 px-4 py-7 text-sm text-slate-400 lg:grid-cols-2 lg:px-8">
        <p>
          Global Sovereign Catastrophe Bond Explorer
          <br />
          Institutional policy intelligence for sovereign disaster risk financing.
        </p>
        <p className="lg:text-right">
          Data source: `data/master/cat_bond_master.csv` with deterministic JSON datasets generated via
          `npm run data:refresh`.
        </p>
      </div>
    </footer>
  );
}
