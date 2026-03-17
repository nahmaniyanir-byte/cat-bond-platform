import { cache } from "react";
import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

import { humanizeFileName, normalizeKey } from "@/lib/utils";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const COUNTRIES_ROOT = path.join(CONTENT_ROOT, "countries");
const GLOBAL_ROOT = path.join(CONTENT_ROOT, "global");

export interface MetadataAsset {
  title: string;
  description: string;
  file: string;
  thumbnail?: string;
}

export interface GlobalMetadata {
  siteName: string;
  siteSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  introVideo?: MetadataAsset;
  generalPresentation?: MetadataAsset;
  generalDocument?: MetadataAsset;
  generalSummary?: string;
  policyOverview?: {
    title: string;
    summary: string;
  };
  libraries?: {
    presentationsPageTitle?: string;
    pdfsPageTitle?: string;
    videosPageTitle?: string;
    podcastsPageTitle?: string;
  };
  featuredCountries?: string[];
}

export interface CountryMetadata {
  name: string;
  slug: string;
  region: string;
  heroTitle?: string;
  summary?: string;
  policyRelevance?: string;
  modelType?: string;
  peril: string[];
  trigger: string;
  year: number;
  amountUSD: number;
  latitude: number;
  longitude: number;
  coverImage?: string;
  presentations?: MetadataAsset[];
  pdfs?: MetadataAsset[];
  videos?: MetadataAsset[];
  podcasts?: MetadataAsset[];
  notes?: string[];
}

export interface ContentFile {
  id: string;
  title: string;
  fileName: string;
  extension: string;
  sizeBytes: number;
  relativePath: string;
  downloadUrl: string;
}

export interface CountryContentBundle {
  meta: CountryMetadata;
  folderName: string | null;
  dataFiles: ContentFile[];
  imageFiles: ContentFile[];
  noteFiles: ContentFile[];
  pdfFiles: ContentFile[];
  presentationFiles: ContentFile[];
  sourceFiles: ContentFile[];
  videoFiles: ContentFile[];
  podcastFiles: ContentFile[];
}

export type LibraryType =
  | "documents"
  | "presentations"
  | "videos"
  | "podcasts"
  | "pdfs";

export interface LibraryItem extends ContentFile {
  type: LibraryType;
  scope: "global" | "country";
  countrySlug?: string;
  countryName?: string;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readDirSafe(dirPath: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function findDirsByName(root: string, targetName: string): Promise<string[]> {
  const normalizedTarget = targetName.toLowerCase();
  const results: string[] = [];
  const queue: string[] = [root];

  while (queue.length) {
    const current = queue.shift()!;
    const entries = await readDirSafe(current);
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const abs = path.join(current, entry.name);
      if (entry.name.toLowerCase() === normalizedTarget) {
        results.push(abs);
      }
      queue.push(abs);
    }
  }
  return results;
}

function toContentRelative(absPath: string): string {
  return path.relative(CONTENT_ROOT, absPath).split(path.sep).join("/");
}

function toDownloadUrl(absPath: string): string {
  const relSegments = path
    .relative(CONTENT_ROOT, absPath)
    .split(path.sep)
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  return `/api/content/${relSegments.join("/")}`;
}

function toContentFile(absPath: string): ContentFile {
  const fileName = path.basename(absPath);
  const ext = path.extname(fileName).replace(".", "").toLowerCase();
  return {
    id: toContentRelative(absPath),
    title: humanizeFileName(fileName),
    fileName,
    extension: ext,
    sizeBytes: 0,
    relativePath: toContentRelative(absPath),
    downloadUrl: toDownloadUrl(absPath)
  };
}

async function withSize(file: ContentFile, absPath: string): Promise<ContentFile> {
  try {
    const stats = await fs.stat(absPath);
    return { ...file, sizeBytes: stats.size };
  } catch {
    return file;
  }
}

async function listFilesInDir(dirPath: string): Promise<ContentFile[]> {
  const entries = await readDirSafe(dirPath);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const abs = path.join(dirPath, entry.name);
        return withSize(toContentFile(abs), abs);
      })
  );

  return files.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

async function listNestedFiles(dirPath: string): Promise<ContentFile[]> {
  const out: Array<{ abs: string; file: ContentFile }> = [];
  const stack: string[] = [dirPath];

  while (stack.length) {
    const current = stack.pop()!;
    const entries = await readDirSafe(current);
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile()) {
        out.push({ abs, file: toContentFile(abs) });
      }
    }
  }

  const withSizes = await Promise.all(out.map(async (item) => withSize(item.file, item.abs)));
  return withSizes.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

async function resolveCountryFolder(meta: CountryMetadata): Promise<string | null> {
  const entries = await readDirSafe(COUNTRIES_ROOT);
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const wanted = [meta.slug, meta.name, meta.name.replace(/\s+/g, "-"), meta.name.replace(/\s+/g, "")].map(normalizeKey);

  const matched = dirs.find((dir) => wanted.includes(normalizeKey(dir)));
  if (matched) return matched;

  // Fallback for minor folder spelling differences (for example: "Chila" vs "Chile").
  const primary = normalizeKey(meta.name);
  const fuzzy = dirs.find((dir) => {
    const norm = normalizeKey(dir);
    return norm.startsWith(primary.slice(0, 4)) || primary.startsWith(norm.slice(0, 4));
  });
  return fuzzy ?? null;
}

async function resolveSubDirectory(basePath: string, target: string): Promise<string | null> {
  const entries = await readDirSafe(basePath);
  const matched = entries.find((entry) => entry.isDirectory() && normalizeKey(entry.name) === normalizeKey(target));
  return matched ? path.join(basePath, matched.name) : null;
}

function convertMetadataAssetToFile(asset: MetadataAsset): ContentFile {
  const fileName = path.basename(asset.file);
  const ext = path.extname(fileName).replace(".", "").toLowerCase();
  const fallbackId = `${asset.title}-${asset.file}`;
  const normalized = asset.file.replace(/^\/+/, "");
  const contentRelative = normalized.toLowerCase().startsWith("content/") ? normalized.slice("content/".length) : normalized;

  return {
    id: fallbackId,
    title: asset.title,
    fileName,
    extension: ext,
    sizeBytes: 0,
    relativePath: contentRelative,
    downloadUrl: asset.file.startsWith("http")
      ? asset.file
      : `/api/content/${contentRelative
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")}`
  };
}

export const getGlobalMetadata = cache(async (): Promise<GlobalMetadata> => {
  return readJsonFile<GlobalMetadata>(path.join(CONTENT_ROOT, "metadata", "global.json"));
});

export const getCountriesMetadata = cache(async (): Promise<CountryMetadata[]> => {
  return readJsonFile<CountryMetadata[]>(path.join(CONTENT_ROOT, "metadata", "countries.json"));
});

async function getCountryFiles(meta: CountryMetadata): Promise<CountryContentBundle> {
  const folderName = await resolveCountryFolder(meta);
  if (!folderName) {
    return {
      meta,
      folderName: null,
      dataFiles: [],
      imageFiles: [],
      noteFiles: [],
      pdfFiles: (meta.pdfs ?? []).map(convertMetadataAssetToFile),
      presentationFiles: (meta.presentations ?? []).map(convertMetadataAssetToFile),
      sourceFiles: [],
      videoFiles: (meta.videos ?? []).map(convertMetadataAssetToFile),
      podcastFiles: (meta.podcasts ?? []).map(convertMetadataAssetToFile)
    };
  }

  const base = path.join(COUNTRIES_ROOT, folderName);
  const dataDir = await resolveSubDirectory(base, "Data");
  const imagesDir = await resolveSubDirectory(base, "Images");
  const notesDir = await resolveSubDirectory(base, "Notes");
  const pdfDir = await resolveSubDirectory(base, "PDFs");
  const presentationsDir = await resolveSubDirectory(base, "Presentations");
  const sourcesDir = await resolveSubDirectory(base, "Sources");
  const videosDir = await resolveSubDirectory(base, "Videos");
  const podcastsDir = await resolveSubDirectory(base, "Podcasts");

  const scannedPdfs = pdfDir ? await listFilesInDir(pdfDir) : [];
  const scannedPresentations = presentationsDir ? await listFilesInDir(presentationsDir) : [];
  const scannedVideos = videosDir ? await listFilesInDir(videosDir) : [];
  const scannedPodcasts = podcastsDir ? await listFilesInDir(podcastsDir) : [];

  return {
    meta,
    folderName,
    dataFiles: dataDir ? await listFilesInDir(dataDir) : [],
    imageFiles: imagesDir ? await listFilesInDir(imagesDir) : [],
    noteFiles: notesDir ? await listFilesInDir(notesDir) : [],
    pdfFiles: scannedPdfs.length ? scannedPdfs : (meta.pdfs ?? []).map(convertMetadataAssetToFile),
    presentationFiles: scannedPresentations.length
      ? scannedPresentations
      : (meta.presentations ?? []).map(convertMetadataAssetToFile),
    sourceFiles: sourcesDir ? await listFilesInDir(sourcesDir) : [],
    videoFiles: scannedVideos.length ? scannedVideos : (meta.videos ?? []).map(convertMetadataAssetToFile),
    podcastFiles: scannedPodcasts.length ? scannedPodcasts : (meta.podcasts ?? []).map(convertMetadataAssetToFile)
  };
}

export const getAllCountryBundles = cache(async (): Promise<CountryContentBundle[]> => {
  const countries = await getCountriesMetadata();
  const bundles = await Promise.all(countries.map((country) => getCountryFiles(country)));
  return bundles;
});

export const getCountryBundleBySlug = cache(async (slug: string): Promise<CountryContentBundle | null> => {
  const all = await getAllCountryBundles();
  return all.find((entry) => entry.meta.slug === slug) ?? null;
});

async function findGlobalCategoryDir(category: string): Promise<string | null> {
  const matches = await findDirsByName(GLOBAL_ROOT, category);
  return matches[0] ?? null;
}

export const getGlobalFiles = cache(async () => {
  const documentsDir = await findGlobalCategoryDir("documents");
  const presentationsDir = await findGlobalCategoryDir("presentations");
  const videosDir = await findGlobalCategoryDir("videos");
  const podcastsDir = await findGlobalCategoryDir("podcasts");

  return {
    documents: documentsDir ? await listNestedFiles(documentsDir) : [],
    presentations: presentationsDir ? await listNestedFiles(presentationsDir) : [],
    videos: videosDir ? await listNestedFiles(videosDir) : [],
    podcasts: podcastsDir ? await listNestedFiles(podcastsDir) : []
  };
});

export const getIntroVideoAsset = cache(async (): Promise<ContentFile | null> => {
  const [globalMeta, globalFiles] = await Promise.all([getGlobalMetadata(), getGlobalFiles()]);

  const declared = globalMeta.introVideo?.file;
  if (declared?.startsWith("http")) {
    return convertMetadataAssetToFile({
      title: globalMeta.introVideo?.title ?? "Intro Video",
      description: globalMeta.introVideo?.description ?? "",
      file: declared
    });
  }

  if (declared) {
    const abs = path.join(process.cwd(), declared.replace(/^\/+/, "").split("/").join(path.sep));
    if (await pathExists(abs)) {
      return withSize(toContentFile(abs), abs);
    }
  }

  return globalFiles.videos[0] ?? null;
});

function dedupeFiles<T extends ContentFile>(files: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const file of files) {
    const key = `${file.fileName.toLowerCase()}|${file.downloadUrl}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(file);
    }
  }
  return out;
}

export const getLibraryIndex = cache(async (): Promise<Record<LibraryType, LibraryItem[]>> => {
  const [globalFiles, countries] = await Promise.all([getGlobalFiles(), getAllCountryBundles()]);

  const docs: LibraryItem[] = globalFiles.documents.map((file) => ({ ...file, scope: "global", type: "documents" }));
  const presentations: LibraryItem[] = globalFiles.presentations.map((file) => ({
    ...file,
    scope: "global",
    type: "presentations"
  }));
  const videos: LibraryItem[] = globalFiles.videos.map((file) => ({ ...file, scope: "global", type: "videos" }));
  const podcasts: LibraryItem[] = globalFiles.podcasts.map((file) => ({ ...file, scope: "global", type: "podcasts" }));
  const pdfs: LibraryItem[] = [];

  for (const country of countries) {
    for (const file of dedupeFiles(country.presentationFiles)) {
      presentations.push({
        ...file,
        scope: "country",
        type: "presentations",
        countrySlug: country.meta.slug,
        countryName: country.meta.name
      });
    }

    for (const file of dedupeFiles(country.pdfFiles)) {
      pdfs.push({
        ...file,
        scope: "country",
        type: "pdfs",
        countrySlug: country.meta.slug,
        countryName: country.meta.name
      });
    }

    for (const file of dedupeFiles(country.videoFiles)) {
      videos.push({
        ...file,
        scope: "country",
        type: "videos",
        countrySlug: country.meta.slug,
        countryName: country.meta.name
      });
    }

    for (const file of dedupeFiles(country.podcastFiles)) {
      podcasts.push({
        ...file,
        scope: "country",
        type: "podcasts",
        countrySlug: country.meta.slug,
        countryName: country.meta.name
      });
    }
  }

  return {
    documents: dedupeFiles(docs),
    presentations: dedupeFiles(presentations),
    videos: dedupeFiles(videos),
    podcasts: dedupeFiles(podcasts),
    pdfs: dedupeFiles(pdfs)
  };
});

export async function readTextFromFile(file: ContentFile): Promise<string | null> {
  if (file.relativePath.startsWith("/")) return null;
  const abs = path.join(CONTENT_ROOT, file.relativePath.split("/").join(path.sep));
  try {
    const text = await fs.readFile(abs, "utf8");
    return text;
  } catch {
    return null;
  }
}
