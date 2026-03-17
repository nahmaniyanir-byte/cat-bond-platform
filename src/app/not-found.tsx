import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass-panel p-8 text-center">
      <h1 className="text-2xl font-semibold text-white">Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-300">This sovereign policy page is currently unavailable.</p>
      <Link href="/" className="btn-secondary mt-4 inline-flex">
        Return Home
      </Link>
    </div>
  );
}
