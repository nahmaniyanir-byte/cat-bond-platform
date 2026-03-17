import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CountryIntelligencePage } from "@/components/explorer/country-intelligence-page";
import { getCountryPageDataBySlug } from "@/lib/country-pages";

interface CountryPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Country Case | Global Catastrophe Bond Intelligence Platform"
};

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const data = await getCountryPageDataBySlug(slug);
  if (!data) notFound();

  return <CountryIntelligencePage data={data} />;
}
