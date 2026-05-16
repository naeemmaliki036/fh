"use client";

import { useState, type ReactNode } from "react";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { ListYourPropertyWizard } from "@/components/marketing/ListYourPropertyWizard";

export default function MarketplaceLayout({ children }: { children: ReactNode }): React.ReactElement {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="light min-h-screen bg-slate-50 flex flex-col" data-theme="light">
      <MarketplaceHeader onListWithUs={() => setWizardOpen(true)} />
      <main className="flex-1">{children}</main>
      <MarketplaceFooter />
      <ListYourPropertyWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
