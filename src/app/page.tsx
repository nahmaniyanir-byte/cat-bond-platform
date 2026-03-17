import { HomepagePreview } from "@/components/home/homepage-preview";
import { getHomeContent } from "@/lib/home-content";

export default async function HomePage() {
  const content = await getHomeContent();
  return <HomepagePreview content={content} />;
}
