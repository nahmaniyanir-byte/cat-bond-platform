"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass-panel p-8">
      <h1 className="text-xl font-semibold text-white">Unexpected Platform Error</h1>
      <p className="mt-2 text-sm text-slate-300">The requested data could not be loaded. Please retry.</p>
      <button type="button" onClick={reset} className="btn-secondary mt-4">
        Retry
      </button>
    </div>
  );
}
