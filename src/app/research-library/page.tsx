import type { Metadata } from "next";
import ResearchLibraryClient from "./research-library-client";

export const metadata: Metadata = {
  title: "Research Library | Global Catastrophe Bond Intelligence Platform",
};

// File paths are hardcoded so Vercel never bundles public/knowledge/ into the Lambda.
// All files under public/ are served as static CDN assets — no fs reads needed.
const KNOWLEDGE_FILES: Record<string, string[]> = {
  pdfs: [
    "/knowledge/pdfs/worldbank-mexico-catbond-2024.pdf",
    "/knowledge/pdfs/worldbank-jamaica-catbond-2024.pdf",
    "/knowledge/pdfs/oecd-catbond-asia-pacific-2024.pdf",
    "/knowledge/pdfs/financing-unpredictable-sovereign-catbonds-2025.pdf",
  ],
  "cat-bonds": [
    "/knowledge/cat-bonds/Catastrophe_Bonds_s (2).pptx",
    "/knowledge/cat-bonds/unnamed (4).png",
    "/knowledge/cat-bonds/הימור_על_אסונות_טבע_דרך_אג_ח_קטסטרופה.m4a",
  ],
  "cyber-risk": [
    "/knowledge/cyber-risk/National_Quantum_Security_Strategy (1).pdf",
    "/knowledge/cyber-risk/הצפנה_פוסט_קוונטית_והגנה_מפני_פענוח_עתידי.m4a",
  ],
  countries: [
    "/knowledge/countries/Chile/Chile_Cat_Bond_2023 (1).pdf",
    "/knowledge/countries/Mexico/Mexico_s_Architecture_of_Resilience.pdf",
    "/knowledge/countries/Mexico/אג_ח_הקטסטרופה_של_מקסיקו_נגד_הטבע.m4a",
    "/knowledge/countries/Peru/Peru_Catastrophe_Bond_Strategy (1).pdf",
    "/knowledge/countries/Philippines/Philippine_Catastrophe_Bond_Blueprint (1).pdf",
    "/knowledge/countries/Philippines/הימור_המיליארדים_של_וול_סטריט_באג_ח_אסונות.m4a",
    "/knowledge/countries/colombia/Colombia_Catastrophe_Bonds (1).pdf",
    "/knowledge/countries/colombia/אג_ח_קטסטרופה_נגד_רעידות_אדמה_בברית_הפסיפית.m4a",
    "/knowledge/countries/jamaica/Jamaica_Catastrophe_Bond_Strategy (2).pdf",
    "/knowledge/countries/jamaica/איגרת_החוב_שמצילה_את_ג_מייקה_מהוריקנים.m4a",
  ],
};

export default function ResearchLibraryPage() {
  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-10 lg:px-8">
      <ResearchLibraryClient files={KNOWLEDGE_FILES} />
    </main>
  );
}
