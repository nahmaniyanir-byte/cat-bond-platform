import type { Metadata } from "next";

import { CatBondCalculator } from "@/components/explorer/catbond-calculator";
import { getCalculatorContent } from "@/lib/calculator-content";

export const metadata: Metadata = {
  title: "Pricing Calculator | Global Catastrophe Bond Intelligence Platform"
};

export default async function CalculatorPage() {
  const content = await getCalculatorContent();
  return <CatBondCalculator content={content} />;
}
