import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CountryIntelligencePage } from "@/components/explorer/country-intelligence-page";
import { getCountryPageDataBySlug, getCountryPageIndex } from "@/lib/country-pages";

type CountrySlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CountrySlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getCountryPageDataBySlug(slug);
  if (!pageData) {
    return { title: "Country Not Found | Global Sovereign Catastrophe Bond Explorer" };
  }

  return {
    title: `${pageData.summary.country_name} | Global Catastrophe Bond Intelligence Platform`,
    description: pageData.summary.summary
  };
}

export async function generateStaticParams() {
  const countries = await getCountryPageIndex();
  return countries.map((country) => ({ slug: country.slug }));
}

export default async function CountrySlugPage({ params }: CountrySlugPageProps) {
  const { slug } = await params;
  const pageData = await getCountryPageDataBySlug(slug);
  if (!pageData) {
    notFound();
  }

  return <CountryIntelligencePage data={pageData} />;
}
