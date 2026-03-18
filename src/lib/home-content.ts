import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

const HOME_ROOT = path.join(process.cwd(), "content", "home");
const DATA_COUNTRIES_ROOT = path.join(process.cwd(), "data", "countries");

export interface IntroVideoConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  video_source: string;
  autoplay?: boolean;
  show_skip_button?: boolean;
  skip_label?: string;
  duration_seconds?: number;
}

export interface HeroCta {
  label: string;
  url: string;
}

export interface HeroConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  value_proposition: string[];
  background_type?: "video" | "image" | "none";
  background_video?: string;
  primary_call_to_action?: HeroCta;
  secondary_call_to_action?: HeroCta;
  tertiary_call_to_action?: HeroCta;
}

export interface KpiItem {
  id: string;
  label: string;
  value: string;
  note?: string;
  definition?: string;
  interpretation?: string;
  data_type?: "historical" | "derived" | "illustrative" | string;
}

export interface KpiConfig {
  enabled: boolean;
  section_title: string;
  section_subtitle: string;
  items: KpiItem[];
}

export interface GlobeLegendItem {
  label: string;
  color: string;
}

export interface GlobeSectionConfig {
  enabled: boolean;
  section_title: string;
  section_subtitle: string;
  description: string;
  default_view: string;
  available_views: string[];
  legend: GlobeLegendItem[];
  primary_call_to_action?: HeroCta;
}

export interface QuickAccessItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
  order?: number;
}

export interface QuickAccessConfig {
  enabled: boolean;
  section_title: string;
  section_subtitle: string;
  items: QuickAccessItem[];
}

export type HomeSectionId = "intro_video" | "hero" | "kpis" | "globe" | "quick_access";

export interface SectionOrderConfig {
  page: string;
  sections: Array<{
    id: HomeSectionId;
    enabled: boolean;
    order: number;
  }>;
}

export interface GlobePoint {
  id: string;
  country_name: string;
  slug: string;
  lat: number;
  lng: number;
  sovereign_flag: boolean;
  market_segment: string;
  deal_count: number;
  total_volume_usd: number;
  main_peril: string;
  latest_issue_year: number | null;
  tooltip_title: string;
  tooltip_text: string;
  destination_url: string;
}

export interface HomeContentBundle {
  introVideo: IntroVideoConfig;
  hero: HeroConfig;
  kpis: KpiConfig;
  globeSection: GlobeSectionConfig;
  quickAccess: QuickAccessConfig;
  sectionOrder: SectionOrderConfig;
  globePoints: GlobePoint[];
}

async function readJsonAt<T>(absolutePath: string): Promise<T> {
  const text = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(text) as T;
}

async function readHomeJson<T>(fileName: string): Promise<T> {
  return readJsonAt<T>(path.join(HOME_ROOT, fileName));
}

async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function sanitizeText(value: string): string {
  return value
    .replace(/ג€™/g, "'")
    .replace(/€™/g, "'")
    .replace(/׳’ג‚¬ג„¢/g, "'")
    .replace(/ג‚¬ג„¢/g, "'");
}

function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const mapped = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, sanitizeDeep(item)]);
    return Object.fromEntries(mapped) as T;
  }

  return value;
}

// resolvePublicMedia removed: the JSON configs already contain correct paths.
// Probing public/ via fs.access caused Vercel to bundle the entire public/
// directory (339MB) into the serverless function, exceeding the 300MB limit.

async function resolveGlobePoints(): Promise<GlobePoint[]> {
  const dataFile = path.join(DATA_COUNTRIES_ROOT, "country_globe_points.json");
  if (await fileExists(dataFile)) {
    return readJsonAt<GlobePoint[]>(dataFile);
  }
  return readHomeJson<GlobePoint[]>("country_globe_points.json");
}

export const getHomeContent = cache(async (): Promise<HomeContentBundle> => {
  const [introRaw, heroRaw, kpisRaw, globeRaw, quickRaw, orderRaw, pointsRaw] = await Promise.all([
    readHomeJson<IntroVideoConfig>("intro_video.json"),
    readHomeJson<HeroConfig>("hero.json"),
    readHomeJson<KpiConfig>("kpis.json"),
    readHomeJson<GlobeSectionConfig>("globe_section.json"),
    readHomeJson<QuickAccessConfig>("quick_access.json"),
    readHomeJson<SectionOrderConfig>("section_order.json"),
    resolveGlobePoints()
  ]);

  const introVideo = sanitizeDeep(introRaw);
  const hero = sanitizeDeep(heroRaw);
  const kpis = sanitizeDeep(kpisRaw);
  const globeSection = sanitizeDeep(globeRaw);
  const quickAccess = sanitizeDeep(quickRaw);
  const sectionOrder = sanitizeDeep(orderRaw);
  const globePoints = sanitizeDeep(pointsRaw);

  // Use the path from config directly — no fs probing needed.
  // Fallback to /video/intro.mp4 if config is empty.
  if (!introVideo.video_source) {
    introVideo.video_source = "/video/intro.mp4";
  }

  // hero.background_video stays as-is from config (currently empty / "none").

  quickAccess.items = [...quickAccess.items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  sectionOrder.sections = [...sectionOrder.sections].sort((a, b) => a.order - b.order);

  return {
    introVideo,
    hero,
    kpis,
    globeSection,
    quickAccess,
    sectionOrder,
    globePoints
  };
});
