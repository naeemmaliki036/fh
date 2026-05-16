"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronRight } from "lucide-react";
import {
  PORTAL_BRAND_NAME,
  AQARFLOW_PORTAL_URL,
  AQARFLOW_BRAND_NAME,
} from "@/lib/portal-brand";
import { CountrySelector } from "@/components/CountrySelector";

function AgencyDropdown(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition"
      >
        For agencies
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-100 bg-white shadow-xl p-4 z-50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-1">
            {AQARFLOW_BRAND_NAME}
          </p>
          <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">
            Power your agency with {AQARFLOW_BRAND_NAME}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Manage inventory, leads, and deals — then publish straight to{" "}
            {PORTAL_BRAND_NAME} with one click.
          </p>
          <a
            href={AQARFLOW_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 transition w-full justify-center"
          >
            Go to {AQARFLOW_BRAND_NAME} <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}

export function MarketplaceHeader(): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
      <div className="mx-auto flex w-[min(100%-32px,1280px)] items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center shrink-0" aria-label={PORTAL_BRAND_NAME}>
          <Image
            src="/propertypoint-logo@2x.png"
            alt={PORTAL_BRAND_NAME}
            width={913}
            height={200}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link href="/listings?purpose=sale" className="hover:text-teal-600 transition">
            Buy
          </Link>
          <Link href="/listings?purpose=rent_long" className="hover:text-teal-600 transition">
            Rent
          </Link>
          <Link href="/agencies" className="hover:text-teal-600 transition">
            Agencies
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Suspense>
            <CountrySelector />
          </Suspense>
          <AgencyDropdown />
          <Link
            href="/listings"
            className="rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 transition"
          >
            Browse
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 pb-6 pt-4 space-y-4">
          <nav className="flex flex-col gap-4 text-base font-semibold text-slate-700">
            <Link href="/listings?purpose=sale" onClick={() => setMenuOpen(false)}>
              Buy
            </Link>
            <Link href="/listings?purpose=rent_long" onClick={() => setMenuOpen(false)}>
              Rent
            </Link>
            <Link href="/agencies" onClick={() => setMenuOpen(false)}>
              Agencies
            </Link>
            <a
              href={AQARFLOW_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600"
            >
              For agencies — {AQARFLOW_BRAND_NAME}
            </a>
          </nav>
          <Suspense>
            <CountrySelector />
          </Suspense>
        </div>
      )}
    </header>
  );
}
