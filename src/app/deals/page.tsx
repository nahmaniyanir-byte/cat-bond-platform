import type { Metadata } from "next";

import { TransactionDatabase } from "@/components/explorer/transaction-database";
import { getDealSlugIndex, getMasterDeals } from "@/lib/market-data";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Deal Explorer | Global Catastrophe Bond Intelligence Platform"
};

export default async function DealsPage() {
  const [deals, slugIndex] = await Promise.all([getMasterDeals(), getDealSlugIndex()]);

  return (
    <>
      <PageHeader
        title="Deal Explorer"
        subtitle="Searchable catastrophe bond transaction universe — filter by peril, trigger, sponsor, and year"
      />
      <TransactionDatabase
      deals={deals}
      variant="deal_explorer"
      showDealLinks
      enableCompare
      dealHrefById={slugIndex.index}
    />
    </>
  );
}
