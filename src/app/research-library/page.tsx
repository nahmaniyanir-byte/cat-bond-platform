import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import ResearchLibraryClient from "./research-library-client";

export const metadata: Metadata = {
  title: "Research Library | Global Catastrophe Bond Intelligence Platform",
};

function getKnowledgeFiles() {
  const base = path.join(process.cwd(), "public/knowledge");
  const result: Record<string, string[]> = {};

  if (!fs.existsSync(base)) return result;

  function walk(dir: string, category: string) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isFile()) {
          if (!result[category]) result[category] = [];
          result[category].push(
            full
              .replace(path.join(process.cwd(), "public"), "")
              .replace(/\\/g, "/")
          );
        } else if (stat.isDirectory()) {
          walk(full, category);
        }
      }
    } catch {
      // ignore unreadable dirs
    }
  }

  for (const cat of ["pdfs", "cat-bonds", "cyber-risk", "countries"]) {
    walk(path.join(base, cat), cat);
  }

  return result;
}

export default function ResearchLibraryPage() {
  const files = getKnowledgeFiles();
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-10 lg:px-8">
      <ResearchLibraryClient files={files} />
    </main>
  );
}
