"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

function AqarFlowLogo(): React.ReactElement {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="w-8 h-8 rounded-lg bg-[#0f766e] flex items-center justify-center">
        <span className="text-white font-bold text-sm leading-none">A</span>
      </div>
      <span className="font-bold text-lg tracking-tight text-[#0a0a0a] group-hover:text-[#0f766e] transition-colors">
        AqarFlow
      </span>
    </Link>
  );
}

function DesktopNav(): React.ReactElement {
  return (
    <nav className="hidden md:flex items-center gap-8">
      {NAV_LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="text-sm font-medium text-[#4a4a4a] hover:text-[#0f766e] transition-colors"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

function MobileDrawer({ open, onClose }: MobileDrawerProps): React.ReactElement | null {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-72 bg-[#faf9f6] shadow-xl flex flex-col p-6 gap-6">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Close menu">
            <X className="w-5 h-5 text-[#0a0a0a]" />
          </button>
        </div>
        <nav className="flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="text-base font-medium text-[#0a0a0a] hover:text-[#0f766e] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-3 mt-auto">
          <Link href="/login">
            <Button variant="outline" className="w-full rounded-full border-[#0f766e] text-[#0f766e] hover:bg-[#0f766e]/5">
              Sign in
            </Button>
          </Link>
          <Link href="/demo">
            <Button className="w-full rounded-full bg-[#0f766e] hover:bg-[#0e6b63] text-white">
              Request demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MarketingHeader(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
          scrolled
            ? "bg-[#faf9f6]/90 backdrop-blur-md border-b border-black/5 shadow-sm"
            : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <AqarFlowLogo />
          <DesktopNav />
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-full border-[#0f766e] text-[#0f766e] hover:bg-[#0f766e]/5">
                Sign in
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="sm" className="rounded-full bg-[#0f766e] hover:bg-[#0e6b63] text-white px-5">
                Request demo
              </Button>
            </Link>
          </div>
          <button
            className="md:hidden p-2 rounded-md hover:bg-black/5"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-[#0a0a0a]" />
          </button>
        </div>
      </header>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
