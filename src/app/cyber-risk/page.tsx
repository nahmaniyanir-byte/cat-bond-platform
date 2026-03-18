import type { Metadata } from "next";
import CyberRiskClient, { type CyberFiles } from "./cyber-risk-client";

export const metadata: Metadata = {
  title: "Cyber Risk Cat Bonds | Global Catastrophe Bond Intelligence Platform",
};

// File paths are hardcoded so Vercel never bundles public/knowledge/ into the Lambda.
// These files are served as static CDN assets — no fs reads needed at runtime.
const CYBER_FILES: CyberFiles = {
  pdfs: ["/knowledge/cyber-risk/National_Quantum_Security_Strategy (1).pdf"],
  audio: ["/knowledge/cyber-risk/הצפנה_פוסט_קוונטית_והגנה_מפני_פענוח_עתידי.m4a"],
  images: [],
};

export default function CyberRiskPage() {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-10 lg:px-8">
      <CyberRiskClient files={CYBER_FILES} />
    </main>
  );
}
