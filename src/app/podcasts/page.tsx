import type { Metadata } from "next";

import { LibraryBrowser } from "@/components/explorer/library-browser";
import { getGlobalMetadata, getLibraryIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Podcasts | Global Sovereign Catastrophe Bond Explorer"
};

export default async function PodcastsPage() {
  const [globalMeta, libraries] = await Promise.all([getGlobalMetadata(), getLibraryIndex()]);

  return (
    <LibraryBrowser
      title={globalMeta.libraries?.podcastsPageTitle ?? "All Podcasts"}
      subtitle="Podcast library for sovereign disaster risk financing discussions."
      items={libraries.podcasts}
    />
  );
}
