import React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroDashboardMock } from "./HeroDashboardMock";

const TRUST_LOGOS = [
  "Al Noor Realty",
  "Emaar Brokers",
  "Dubai Elite Prop.",
  "Riyadh RE Group",
  "Bayan Properties",
] as const;

function TrustStrip(): React.ReactElement {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 md:items-start">
      <p className="text-xs font-medium text-[#6b6b6b] uppercase tracking-widest">
        Trusted by real-estate companies across UAE and KSA
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
        {TRUST_LOGOS.map((name) => (
          <span
            key={name}
            className="text-sm font-semibold text-[#9a9a9a] hover:text-[#0f766e] transition-colors cursor-default"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeroSection(): React.ReactElement {
  return (
    <section className="relative min-h-screen bg-[#faf9f6] flex items-center overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#0f766e]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-100/60 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — copy */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f766e]/10 border border-[#0f766e]/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] animate-pulse" />
              <span className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest">
                Real Estate Operations Platform
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-[#0a0a0a] leading-[1.05] tracking-tight max-w-xl">
              One platform.{" "}
              <span className="bg-gradient-to-r from-[#0f766e] to-[#059669] bg-clip-text text-transparent">
                Every property,
              </span>{" "}
              lead, and deal.
            </h1>

            <p className="mt-6 text-lg text-[#4a4a4a] leading-relaxed max-w-lg">
              AqarFlow gives real-estate companies a complete operations platform — properties,
              listings, leads, deals, commissions, document collection, and a public-facing site
              for every tenant. All in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/demo">
                <Button
                  size="lg"
                  className="rounded-full bg-[#0f766e] hover:bg-[#0e6b63] text-white px-7 gap-2 shadow-lg shadow-[#0f766e]/20 transition-all hover:-translate-y-0.5"
                >
                  Get started — it&apos;s free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-[#0a0a0a]/20 text-[#0a0a0a] hover:bg-black/5 px-7 gap-2 transition-all hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch demo
                </Button>
              </Link>
            </div>

            <TrustStrip />
          </div>

          {/* RIGHT — dashboard mockup */}
          <div className="flex justify-center lg:justify-end">
            <HeroDashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}
