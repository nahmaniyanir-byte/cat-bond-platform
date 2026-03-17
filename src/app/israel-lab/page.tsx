import type { Metadata } from "next";

import { IsraelLabCore } from "@/components/explorer/israel-lab-core";
import { getIsraelLabContent } from "@/lib/israel-lab-content";

export const metadata: Metadata = {
  title: "Israel Lab | Global Catastrophe Bond Intelligence Platform",
  description:
    "Interactive sovereign catastrophe bond innovation module for Israel earthquake risk, trigger design, and fiscal liquidity simulation."
};

export default async function IsraelLabPage() {
  const content = await getIsraelLabContent();
  return <IsraelLabCore content={content} />;
}
