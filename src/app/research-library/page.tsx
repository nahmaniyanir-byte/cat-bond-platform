import type { Metadata } from "next";

import { ResearchDatabase } from "@/components/explorer/research-database";
import { getCountriesMetadata, getLibraryIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Research Library | Global Catastrophe Bond Intelligence Platform"
};

export default async function ResearchLibraryPage() {
  const [countries, libraryIndex] = await Promise.all([getCountriesMetadata(), getLibraryIndex()]);
  const allItems = [
    ...libraryIndex.documents,
    ...libraryIndex.presentations,
    ...libraryIndex.pdfs,
    ...libraryIndex.videos,
    ...libraryIndex.podcasts
  ];

  return <ResearchDatabase countries={countries} libraryItems={allItems} />;
}
