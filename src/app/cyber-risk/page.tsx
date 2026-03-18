import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import CyberRiskClient, { type CyberFiles } from "./cyber-risk-client";

export const metadata: Metadata = {
  title: "Cyber Risk Cat Bonds | Global Catastrophe Bond Intelligence Platform",
};

function getCyberFiles(): CyberFiles {
  const base = path.join(process.cwd(), "public/knowledge/cyber-risk");
  if (!fs.existsSync(base)) return { pdfs: [], audio: [], images: [] };

  const all: string[] = [];
  function walk(dir: string) {
    try {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isFile()) {
          all.push(
            full.replace(path.join(process.cwd(), "public"), "").replace(/\\/g, "/")
          );
        } else {
          walk(full);
        }
      }
    } catch {
      // ignore
    }
  }
  walk(base);

  return {
    pdfs: all.filter((f) => f.match(/\.pdf$/i)),
    audio: all.filter((f) => f.match(/\.(mp3|wav|m4a|aac)$/i)),
    images: all.filter((f) => f.match(/\.(jpg|jpeg|png|gif|webp)$/i)),
  };
}

export default function CyberRiskPage() {
  const files = getCyberFiles();
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-10 lg:px-8">
      <CyberRiskClient files={files} />
    </main>
  );
}
