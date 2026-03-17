import type { Metadata } from "next";

import { LibraryBrowser } from "@/components/explorer/library-browser";
import { getGlobalMetadata, getLibraryIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "PDFs | Global Sovereign Catastrophe Bond Explorer"
};

export default async function PdfsPage() {
  const [globalMeta, libraries] = await Promise.all([getGlobalMetadata(), getLibraryIndex()]);
  const items = [...libraries.pdfs, ...libraries.documents];

  return (
    <LibraryBrowser
      title={globalMeta.libraries?.pdfsPageTitle ?? "All PDF Documents"}
      subtitle="Aggregated PDF and document library from all available sovereign folders."
      items={items}
    />
  );
}
