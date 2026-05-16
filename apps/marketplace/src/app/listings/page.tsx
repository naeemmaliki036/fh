"use client";

import { Suspense } from "react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ListingsContent } from "./ListingsContent";

export default function ListingsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
              Loading...
            </div>
          }
        >
          <ListingsContent />
        </Suspense>
      </main>
      <MarketplaceFooter />
    </div>
  );
}
