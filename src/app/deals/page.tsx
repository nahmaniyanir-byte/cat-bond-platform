import type { Metadata } from "next";

import { TransactionDatabase } from "@/components/explorer/transaction-database";
import { getDealPageIndex } from "@/lib/deal-pages";
import { getMasterDeals } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Deal Explorer | Global Catastrophe Bond Intelligence Platform"
};

export default async function DealsPage() {
  const [deals, dealIndex] = await Promise.all([getMasterDeals(), getDealPageIndex()]);
  const dealHrefById = Object.fromEntries(
    dealIndex.flatMap((entry) => {
      const ids = [entry.deal.id, entry.deal.deal_id].filter(Boolean) as string[];
      return ids.map((id) => [id, entry.slug]);
    })
  );

  return (
    <TransactionDatabase
      deals={deals}
      variant="deal_explorer"
      showDealLinks
      enableCompare
      dealHrefById={dealHrefById}
    />
  );
}
