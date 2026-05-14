"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import type { PublicTenantProfile } from "@/lib/types/public-site";
import { ListYourPropertyDialog } from "./ListYourPropertyDialog";

interface PublicSiteHeaderProps {
  profile: PublicTenantProfile;
  slug: string;
  /** True when the site is in direct_only mode — hides index-only nav links. */
  isDirect?: boolean;
}

export function PublicSiteHeader({ profile, slug, isDirect = false }: PublicSiteHeaderProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const initials = profile.name.slice(0, 2).toUpperCase();
  const homeHref = `/p/${slug}`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-[min(100%-40px,1280px)] items-center justify-between gap-6 py-3.5">
        {/* Brand */}
        <Link href={homeHref} className="flex items-center gap-3 shrink-0">
          {profile.logo_url ? (
            <img
              src={profile.logo_url}
              alt={profile.name}
              className="h-10 w-10 rounded-2xl object-contain shadow-md shadow-slate-900/10"
            />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-md shadow-slate-900/10">
              {initials}
            </span>
          )}
          <span>
            <strong className="block text-base font-black leading-tight">{profile.name}</strong>
            <small className="block text-[11px] text-slate-400 leading-tight">Real Estate</small>
          </span>
        </Link>

        {/* Desktop nav — centered; hidden in direct_only mode */}
        {!isDirect && (
          <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-bold text-slate-600 md:flex">
            <Link href={`${homeHref}#listings`} className="transition hover:text-slate-950">
              Listings
            </Link>
            <Link href={`${homeHref}#team`} className="transition hover:text-slate-950">
              Team
            </Link>
            <Link href={`${homeHref}#contact`} className="transition hover:text-slate-950">
              Contact
            </Link>
          </nav>
        )}

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setListDialogOpen(true)}
            className="hidden rounded-full border border-[hsl(var(--primary))] px-5 py-2.5 text-sm font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary))]/10 sm:inline-flex"
          >
            List Your Property
          </button>
          <Link
            href={`${homeHref}#contact`}
            className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:inline-flex"
          >
            Talk to us
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-5 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-5 text-base font-bold text-slate-700">
            <Link href={`${homeHref}#listings`} onClick={() => setOpen(false)}>
              Listings
            </Link>
            <Link href={`${homeHref}#team`} onClick={() => setOpen(false)}>
              Team
            </Link>
            <Link href={`${homeHref}#contact`} onClick={() => setOpen(false)}>
              Contact
            </Link>
            <button
              onClick={() => { setOpen(false); setListDialogOpen(true); }}
              className="mt-1 inline-flex w-fit rounded-full border border-[hsl(var(--primary))] px-6 py-2.5 text-sm font-bold text-[hsl(var(--primary))]"
            >
              List Your Property
            </button>
            <Link
              href={`${homeHref}#contact`}
              onClick={() => setOpen(false)}
              className="inline-flex w-fit rounded-full bg-slate-950 px-6 py-2.5 text-sm text-white"
            >
              Talk to us
            </Link>
          </nav>
        </div>
      )}

      <ListYourPropertyDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        slug={slug}
        initialIntent="sell"
        operatingCountries={profile.operating_countries}
      />
    </header>
  );
}
