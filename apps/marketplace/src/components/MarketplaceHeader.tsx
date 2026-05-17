"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronRight, ChevronDown, Home, Heart, User, LogOut } from "lucide-react";
import {
  PORTAL_BRAND_NAME,
  AQARFLOW_PORTAL_URL,
  AQARFLOW_BRAND_NAME,
} from "@/lib/portal-brand";
import { CountrySelector } from "@/components/CountrySelector";
import { useConsumer } from "@/lib/consumer-context";
import { useAuthDialog } from "@/lib/auth-dialog-context";

function AgencyDropdown(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
            Go to platform <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}

function AvatarDropdown(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { consumer, signOut } = useConsumer();

  useEffect(() => {
    function onOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const initials = (consumer?.full_name ?? consumer?.email ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  function handleSignOut(): void {
    signOut();
    setOpen(false);
    // Always land on the homepage after sign-out, even if the current route
    // is auth-gated (/me/*); never bounce to /login.
    router.replace("/");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2 py-1 hover:border-teal-300 transition"
        aria-label="Account menu"
      >
        <span className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-black text-teal-700">
          {initials || "?"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-100 bg-white shadow-xl py-2 z-50">
          <Link
            href="/me/listings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="h-4 w-4 text-slate-400" /> My listings
          </Link>
          <Link
            href="/me/favorites"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <Heart className="h-4 w-4 text-slate-400" /> Favorites
          </Link>
          <Link
            href="/me/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <User className="h-4 w-4 text-slate-400" /> Profile
          </Link>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition w-full text-left"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// All right-cluster elements share these size/shape rules so the bar
// reads as a single horizontal rhythm — 36px tall pills with matching
// horizontal padding. Variant flips colour only.
const PILL_BASE =
  "inline-flex items-center h-9 rounded-full px-4 text-sm font-semibold transition shrink-0";

function PostPropertyButton(): React.ReactElement {
  const { token } = useConsumer();
  const { open } = useAuthDialog();

  const cls = `${PILL_BASE} bg-teal-600 text-white font-bold hover:bg-teal-700`;
  if (token) {
    return (
      <Link href="/me/listings/new" className={cls}>
        Post a property
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() =>
        open({ mode: "signup", reason: "Sign up to post a property", redirectAfter: "/me/listings/new" })
      }
      className={cls}
    >
      Post a property
    </button>
  );
}

export function MarketplaceHeader(): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const { token, isHydrated } = useConsumer();
  const { open: openAuthDialog } = useAuthDialog();
  const isSignedIn = isHydrated && !!token;

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

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/listings?purpose=sale" className="hover:text-teal-600 transition">Buy</Link>
          <Link href="/listings?purpose=rent_long" className="hover:text-teal-600 transition">Rent</Link>
          <Link href="/agencies" className="hover:text-teal-600 transition">Agencies</Link>
          <Link href="/listings?completion_status=off_plan" className="hover:text-teal-600 transition">New Projects</Link>
          <Link href="/agents" className="hover:text-teal-600 transition">Find Your Agent</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {!isSignedIn && (
            <button
              type="button"
              onClick={() => openAuthDialog({ mode: "login" })}
              className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition"
            >
              Log in
            </button>
          )}
          <PostPropertyButton />
          {isSignedIn ? (
            <>
              <Suspense>
                <CountrySelector />
              </Suspense>
              <AvatarDropdown />
            </>
          ) : (
            <>
              <AgencyDropdown />
              <Suspense>
                <CountrySelector />
              </Suspense>
            </>
          )}
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
            <Link href="/listings?purpose=sale" onClick={() => setMenuOpen(false)}>Buy</Link>
            <Link href="/listings?purpose=rent_long" onClick={() => setMenuOpen(false)}>Rent</Link>
            <Link href="/agencies" onClick={() => setMenuOpen(false)}>Agencies</Link>
            <Link href="/listings?completion_status=off_plan" onClick={() => setMenuOpen(false)}>New Projects</Link>
            <Link href="/agents" onClick={() => setMenuOpen(false)}>Find Your Agent</Link>
            {isSignedIn ? (
              <>
                <Link href="/me/listings" onClick={() => setMenuOpen(false)}>My listings</Link>
                <Link href="/me/favorites" onClick={() => setMenuOpen(false)}>Favorites</Link>
                <Link href="/me/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); openAuthDialog({ mode: "login" }); }}
                  className="text-left"
                >
                  Log in
                </button>
                <a href={AQARFLOW_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="text-teal-600">
                  For agencies — {AQARFLOW_BRAND_NAME}
                </a>
              </>
            )}
          </nav>
          <div className="pt-2">
            <PostPropertyButton />
          </div>
          {!isSignedIn && (
            <Suspense>
              <CountrySelector />
            </Suspense>
          )}
        </div>
      )}
    </header>
  );
}
