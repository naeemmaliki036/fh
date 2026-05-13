import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCtaSection(): React.ReactElement {
  return (
    <section className="bg-[#faf9f6] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-[#0f766e] to-[#065f46] rounded-3xl overflow-hidden px-8 py-20 text-center">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <div className="relative">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
              Get started today
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto leading-tight">
              Ready to streamline your real-estate ops?
            </h2>
            <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
              Join forward-thinking agencies across UAE and KSA that manage their entire
              operations on AqarFlow.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link href="/demo">
                <Button
                  size="lg"
                  className="rounded-full bg-white text-[#0f766e] hover:bg-[#faf9f6] px-8 font-bold shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Request a demo
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/40 text-white hover:bg-white/10 px-8 font-bold transition-all hover:-translate-y-0.5"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
