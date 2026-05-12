"use client";

import { useState } from "react";
import type { PublicTenantProfile } from "@/lib/types/public-site";

interface PublicSiteHeaderProps {
  profile: PublicTenantProfile;
}

export function PublicSiteHeader({ profile }: PublicSiteHeaderProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f7f5ef]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-[min(100%-40px,1280px)] items-center justify-between gap-6 py-4">
        {/* Brand */}
        <a href="#home" className="flex items-center gap-3">
          {profile.logo_url ? (
            <img
              src={profile.logo_url}
              alt={profile.name}
              className="h-11 w-11 rounded-2xl object-contain shadow-lg shadow-slate-900/10"
            />
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-900/10">
              {initials}
            </span>
          )}
          <span>
            <strong className="block text-lg font-black">{profile.name}</strong>
            <small className="mt-0.5 block text-xs text-slate-500">Real Estate</small>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 md:flex">
          <a href="#listings" className="transition hover:text-slate-950">Listings</a>
          <a href="#agents" className="transition hover:text-slate-950">Agents</a>
          <a href="#contact" className="transition hover:text-slate-950">Contact</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:inline-flex"
          >
            Talk to us
          </a>
          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            <span className="block space-y-1">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-slate-200 bg-[#f7f5ef] px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-bold text-slate-700">
            <a href="#listings" onClick={() => setOpen(false)}>Listings</a>
            <a href="#agents" onClick={() => setOpen(false)}>Agents</a>
            <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex w-fit rounded-full bg-slate-950 px-5 py-2.5 text-sm font-extrabold text-white"
            >
              Talk to us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
