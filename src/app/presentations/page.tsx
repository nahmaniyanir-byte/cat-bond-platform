import type { Metadata } from "next";

import { LibraryBrowser } from "@/components/explorer/library-browser";
import { getGlobalMetadata, getLibraryIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Presentations | Global Sovereign Catastrophe Bond Explorer"
};

export default async function PresentationsPage() {
  const [globalMeta, libraries] = await Promise.all([getGlobalMetadata(), getLibraryIndex()]);

  return (
    <LibraryBrowser
      title={globalMeta.libraries?.presentationsPageTitle ?? "All Presentations"}
      subtitle="Aggregated presentation library from global and country content folders."
      items={libraries.presentations}
    />
  );
}
