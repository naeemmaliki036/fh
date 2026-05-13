import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

/** Marketing pages always render in light mode. */
export default function MarketingLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="light" data-theme="light">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
