"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Building2 } from "lucide-react";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";

interface MarketplaceHeaderProps {
  onListWithUs?: () => void;
}

export function MarketplaceHeader({ onListWithUs }: MarketplaceHeaderProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-lg">
      <div className="mx-auto flex w-[min(100%-32px,1280px)] items-center justify-between gap-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Building2 className="h-6 w-6 text-amber-400" />
          <span className="text-lg font-black tracking-tight">{PORTAL_BRAND_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <Link href="/listings?purpose=sale" className="hover:text-white transition">
            Buy
          </Link>
          <Link href="/listings?purpose=rent_long" className="hover:text-white transition">
            Rent
          </Link>
          <Link href="/agencies" className="hover:text-white transition">
            Agencies
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {onListWithUs && (
            <button
              onClick={onListWithUs}
              className="rounded-full border border-amber-400 px-4 py-1.5 text-sm font-bold text-amber-400 hover:bg-amber-400 hover:text-slate-900 transition"
            >
              List your property
            </button>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-slate-700"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900 px-5 pb-6 pt-4">
          <nav className="flex flex-col gap-4 text-base font-semibold text-slate-300">
            <Link href="/listings?purpose=sale" onClick={() => setMenuOpen(false)}>Buy</Link>
            <Link href="/listings?purpose=rent_long" onClick={() => setMenuOpen(false)}>Rent</Link>
            <Link href="/agencies" onClick={() => setMenuOpen(false)}>Agencies</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
