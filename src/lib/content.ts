import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

import { slugify } from "@/lib/utils";

export interface LibraryAsset {
  id: string;
  title: string;
  path: string;
  category: "document" | "pdf" | "presentation" | "video" | "podcast";
  country?: string;
}

export interface LibraryIndex {
  generated_at: string;
  documents: LibraryAsset[];
  pdfs: LibraryAsset[];
  presentations: LibraryAsset[];
  videos: LibraryAsset[];
  podcasts: LibraryAsset[];
}

const ROOT = process.cwd();
const SEARCH_PATHS: Array<{ category: LibraryAsset["category"]; relativePath: string; allowedExt: string[] }> = [
  { category: "document", relativePath: "content/global/documents", allowedExt: [".doc", ".docx", ".txt", ".md"] },
  { category: "pdf", relativePath: "content/global/documents", allowedExt: [".pdf"] },
  { category: "presentation", relativePath: "content/global/presentations", allowedExt: [".pdf", ".ppt", ".pptx"] },
  { category: "video", relativePath: "content/global/videos", allowedExt: [".mp4", ".mov", ".webm"] },
  { category: "podcast", relativePath: "content/global/podcasts", allowedExt: [".mp3", ".wav", ".m4a"] },
  { category: "document", relativePath: "research_library", allowedExt: [".pdf", ".doc", ".docx", ".txt", ".md"] },
  { category: "presentation", relativePath: "exports/presentations", allowedExt: [".pdf", ".ppt", ".pptx"] },
  { category: "video", relativePath: "exports/videos", allowedExt: [".mp4", ".mov", ".webm"] }
];

export const getLibraryIndex = cache(async (): Promise<LibraryIndex> => {
  const byCategory: Record<LibraryAsset["category"], LibraryAsset[]> = {
    document: [],
    pdf: [],
    presentation: [],
    video: [],
    podcast: []
  };

  for (const source of SEARCH_PATHS) {
    const folder = path.join(ROOT, source.relativePath);
    const files = await listFiles(folder);
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      if (!source.allowedExt.includes(ext)) continue;
      const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");
      const title = path.basename(filePath, ext).replace(/[_-]+/g, " ").trim();
      const id = slugify(`${source.category}-${relative}`);
      const country = inferCountryFromPath(relative);
      byCategory[source.category].push({
        id,
        title,
        path: `/${relative}`,
        category: source.category,
        country
      });
    }
  }

  byCategory.document.sort((a, b) => a.title.localeCompare(b.title));
  byCategory.pdf.sort((a, b) => a.title.localeCompare(b.title));
  byCategory.presentation.sort((a, b) => a.title.localeCompare(b.title));
  byCategory.video.sort((a, b) => a.title.localeCompare(b.title));
  byCategory.podcast.sort((a, b) => a.title.localeCompare(b.title));

  return {
    generated_at: new Date().toISOString(),
    documents: byCategory.document,
    pdfs: byCategory.pdf,
    presentations: byCategory.presentation,
    videos: byCategory.video,
    podcasts: byCategory.podcast
  };
});

async function listFiles(folderPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listFiles(fullPath)));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
    return files;
  } catch {
    return [];
  }
}

function inferCountryFromPath(relativePath: string): string | undefined {
  const normalized = relativePath.toLowerCase();
  const match = normalized.match(/countries\/([^/]+)/);
  if (!match?.[1]) return undefined;
  return match[1].replace(/[-_]+/g, " ");
}
