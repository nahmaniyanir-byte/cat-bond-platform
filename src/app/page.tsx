import type { Metadata } from "next";

import { HomepagePreview } from "@/components/home/homepage-preview";
import { getHomeContent } from "@/lib/home-content";

export const metadata: Metadata = {
  title: "Global Catastrophe Bond Intelligence Platform"
};

export default async function HomePage() {
  const content = await getHomeContent();
  return <HomepagePreview content={content} />;
}
