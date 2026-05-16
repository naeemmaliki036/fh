import Link from "next/link";
import { Building2 } from "lucide-react";
import {
  PORTAL_BRAND_NAME,
  PORTAL_BRAND_TAGLINE,
  AQARFLOW_PORTAL_URL,
  AQARFLOW_MARKETING_URL,
  AQARFLOW_BRAND_NAME,
} from "@/lib/portal-brand";
import { AqarFlowPromoBlock } from "./footer/AqarFlowPromoBlock";

export function MarketplaceFooter(): React.ReactElement {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-16">
      {/* AqarFlow promo band */}
      <AqarFlowPromoBlock
        portalUrl={AQARFLOW_PORTAL_URL}
        marketingUrl={AQARFLOW_MARKETING_URL}
        brandName={AQARFLOW_BRAND_NAME}
        portalBrandName={PORTAL_BRAND_NAME}
      />

      {/* Main footer columns */}
      <div className="mx-auto w-[min(100%-32px,1280px)] py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="h-5 w-5 text-teal-600" />
              <span className="font-black text-base">{PORTAL_BRAND_NAME}</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">{PORTAL_BRAND_TAGLINE}</p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-600">
            <Link href="/listings?purpose=sale" className="hover:text-teal-600 transition">
              Buy
            </Link>
            <Link href="/listings?purpose=rent_long" className="hover:text-teal-600 transition">
              Rent
            </Link>
            <Link href="/agencies" className="hover:text-teal-600 transition">
              Agencies
            </Link>
            <a
              href={AQARFLOW_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-teal-600 transition"
            >
              List your property
            </a>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {PORTAL_BRAND_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
