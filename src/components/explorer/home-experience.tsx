"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Globe2, ShieldCheck, Wallet } from "lucide-react";

import type { CountryMetadata, GlobalMetadata } from "@/lib/content";
import { formatCurrency } from "@/lib/utils";
import { InteractiveGlobe } from "@/components/explorer/interactive-globe";

interface HomeExperienceProps {
  globalMeta: GlobalMetadata;
  countries: CountryMetadata[];
  introVideoUrl: string | null;
}

export function HomeExperience({ globalMeta, countries, introVideoUrl }: HomeExperienceProps) {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string>(countries[0]?.slug ?? "");
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);

  const points = useMemo(
    () =>
      countries.map((entry) => ({
        slug: entry.slug,
        name: entry.name,
        latitude: entry.latitude,
        longitude: entry.longitude
      })),
    [countries]
  );

  const highlighted = useMemo(
    () => countries.find((entry) => entry.slug === (hoverSlug ?? selectedSlug)) ?? countries[0] ?? null,
    [countries, hoverSlug, selectedSlug]
  );

  const featuredCountries = useMemo(() => {
    const featured = globalMeta.featuredCountries ?? [];
    if (!featured.length) return countries.slice(0, 4);
    const match = featured
      .map((slug) => countries.find((country) => country.slug === slug))
      .filter((country): country is CountryMetadata => Boolean(country));
    return match.length ? match.slice(0, 4) : countries.slice(0, 4);
  }, [countries, globalMeta.featuredCountries]);

  const stats = useMemo(() => {
    const totalProtection = countries.reduce((sum, item) => sum + item.amountUSD, 0);
    const issuedCases = countries.filter((item) => item.year > 0).length;
    const uniqueRegions = new Set(countries.map((item) => item.region)).size;
    const latestYear = Math.max(...countries.map((item) => item.year));
    return [
      { label: "Tracked Countries", value: String(countries.length), icon: Globe2 },
      { label: "Issued Sovereign Cases", value: String(issuedCases), icon: Building2 },
      { label: "Total Notional Protection", value: formatCurrency(totalProtection), icon: Wallet },
      { label: "Latest Issuance Year", value: String(latestYear), icon: ShieldCheck },
      { label: "Policy Regions", value: String(uniqueRegions), icon: Building2 }
    ];
  }, [countries]);

  return (
    <div className="space-y-7">
      <section className="glass-panel overflow-hidden p-5 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.9fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
              <div className="h-[530px]">
                <InteractiveGlobe
                  points={points}
                  selectedSlug={highlighted?.slug}
                  onHover={setHoverSlug}
                  onSelect={(slug) => {
                    setSelectedSlug(slug);
                    window.setTimeout(() => router.push(`/countries/${slug}`), 280);
                  }}
                />
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
              Rotate, zoom, and select countries directly from the sovereign catastrophe bond globe.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Policy Intelligence Platform</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white lg:text-4xl">{globalMeta.heroTitle}</h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{globalMeta.siteSubtitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{globalMeta.heroDescription}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/countries" className="btn-primary">
                Explore Countries
              </Link>
              <Link href="/global-overview" className="btn-secondary">
                Global Overview
              </Link>
              <Link href="/calculator" className="btn-secondary">
                Open Calculator
              </Link>
            </div>

            <article className="rounded-xl border border-cyan-300/35 bg-cyan-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Selected Case</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{highlighted?.name ?? "No country selected"}</h2>
              {highlighted ? (
                <>
                  <p className="mt-2 text-sm text-slate-200">{highlighted.summary ?? "No executive summary available yet."}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="chip">{highlighted.region}</span>
                    <span className="chip">{highlighted.trigger}</span>
                    <span className="chip">{highlighted.year > 0 ? highlighted.year : "Policy Case"}</span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-300">Content will be added soon.</p>
              )}
            </article>

            <article className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                {globalMeta.introVideo?.title ?? "Intro Video"}
              </p>
              {introVideoUrl ? (
                <video controls className="mt-3 w-full rounded-lg border border-white/10 bg-black">
                  <source src={introVideoUrl} />
                </video>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-white/15 bg-slate-950/60 p-5 text-sm text-slate-400">
                  Intro video file is not currently available in the content library.
                </div>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <motion.article
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.42 }}
            className="glass-panel p-4"
          >
            <stat.icon className="h-4 w-4 text-cyan-200" />
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
          </motion.article>
        ))}
      </section>

      <section className="glass-panel p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Featured Case Studies</h2>
          <Link href="/countries" className="text-sm text-cyan-200 hover:text-cyan-100">
            Open full country library
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredCountries.map((country) => (
            <article key={country.slug} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <p className="text-sm font-semibold text-white">{country.name}</p>
              <p className="mt-1 text-xs text-slate-400">{country.region}</p>
              <p className="mt-2 line-clamp-3 text-sm text-slate-300">{country.summary ?? "Content will be added soon."}</p>
              <Link
                href={`/countries/${country.slug}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100"
              >
                View Case
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
