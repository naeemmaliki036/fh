"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function PricingCard(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!email) return;
    // TODO: wire to POST /api/marketing/early-access
    setSubmitted(true);
    setEmail("");
    toast.success("You're on the list! We'll notify you when pricing is live.");
  }

  return (
    <div className="bg-white rounded-3xl border border-black/8 shadow-xl overflow-hidden max-w-lg w-full mx-auto">
      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0f766e] via-emerald-400 to-amber-400" />

      <div className="p-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
            Early access
          </span>
        </div>

        <h3 className="text-3xl font-extrabold text-[#0a0a0a] mb-3">Coming soon</h3>
        <p className="text-[#4a4a4a] text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Transparent, usage-based pricing built for MENA real-estate teams. Join the waitlist
          and get first access — plus founding-member rates.
        </p>

        {submitted ? (
          <div className="py-4 px-6 bg-[#0f766e]/10 rounded-xl border border-[#0f766e]/20">
            <p className="text-[#0f766e] font-semibold text-sm">
              You&apos;re on the list. We&apos;ll be in touch.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 h-11 rounded-full px-5 border-black/15 focus-visible:ring-[#0f766e]"
            />
            <Button
              type="submit"
              className="rounded-full bg-[#0f766e] hover:bg-[#0e6b63] text-white px-6 h-11 shrink-0"
            >
              Notify me
            </Button>
          </form>
        )}

        <p className="mt-4 text-xs text-[#8a8a8a]">No spam. Unsubscribe any time.</p>
      </div>
    </div>
  );
}

export function PricingTeaserSection(): React.ReactElement {
  return (
    <section id="pricing" className="bg-[#f4f3f0] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-[#4a4a4a] max-w-md mx-auto">
            No per-feature gatekeeping. One plan that scales with your team.
          </p>
        </div>
        <PricingCard />
      </div>
    </section>
  );
}
