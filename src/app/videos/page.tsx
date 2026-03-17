import type { Metadata } from "next";

import { LibraryBrowser } from "@/components/explorer/library-browser";
import { getGlobalMetadata, getLibraryIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Videos | Global Sovereign Catastrophe Bond Explorer"
};

export default async function VideosPage() {
  const [globalMeta, libraries] = await Promise.all([getGlobalMetadata(), getLibraryIndex()]);

  return (
    <LibraryBrowser
      title={globalMeta.libraries?.videosPageTitle ?? "All Videos"}
      subtitle="Global and country video library for policy briefings and case-study media."
      items={libraries.videos}
    />
  );
}
