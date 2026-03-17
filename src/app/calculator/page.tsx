import type { Metadata } from "next";

import { CatBondCalculator } from "@/components/explorer/catbond-calculator";
import { getCalculatorContent } from "@/lib/calculator-content";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Pricing Calculator | Global Catastrophe Bond Intelligence Platform"
};

export default async function CalculatorPage() {
  const content = await getCalculatorContent();
  return (
    <>
      <PageHeader
        title="Pricing Calculator"
        subtitle="Illustrative sovereign cat bond structuring — payout tiers, expected loss calibration, and annual premium estimation"
        showSource={false}
      />
      <CatBondCalculator content={content} />
    </>
  );
}
