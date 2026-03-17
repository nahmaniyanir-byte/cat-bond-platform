import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { SiteNavigation } from "@/components/layout/site-navigation";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Global Catastrophe Bond Intelligence Platform",
  description: "Institutional catastrophe bond market intelligence for policy, sovereign finance, and investor analytics."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNavigation />
        <main className="mx-auto w-full max-w-[1700px] px-4 py-7 lg:px-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
