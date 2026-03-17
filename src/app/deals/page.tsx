import type { Metadata } from "next";

import { TransactionDatabase } from "@/components/explorer/transaction-database";
import { getDealSlugIndex, getMasterDeals } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Deal Explorer | Global Catastrophe Bond Intelligence Platform"
};

export default async function DealsPage() {
  const [deals, slugIndex] = await Promise.all([getMasterDeals(), getDealSlugIndex()]);

  return (
    <TransactionDatabase
      deals={deals}
      variant="deal_explorer"
      showDealLinks
      enableCompare
      dealHrefById={slugIndex.index}
    />
  );
}
