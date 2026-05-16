import Link from "next/link";
import { Building2 } from "lucide-react";
import { PORTAL_BRAND_NAME, PORTAL_BRAND_TAGLINE } from "@/lib/portal-brand";

export function MarketplaceFooter(): React.ReactElement {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="mx-auto w-[min(100%-32px,1280px)] py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-amber-400" />
              <span className="font-black text-base">{PORTAL_BRAND_NAME}</span>
            </div>
            <p className="text-sm max-w-xs">{PORTAL_BRAND_TAGLINE}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold">
            <Link href="/marketplace/listings?purpose=sale" className="hover:text-white transition">Buy</Link>
            <Link href="/marketplace/listings?purpose=rent_long" className="hover:text-white transition">Rent</Link>
            <Link href="/marketplace/agencies" className="hover:text-white transition">Agencies</Link>
            <Link href="/login" className="hover:text-white transition">Agent login</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-slate-700 pt-6 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {PORTAL_BRAND_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
