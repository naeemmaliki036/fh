import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";

export const metadata: Metadata = {
  title: "Request a Demo — AqarFlow",
  description:
    "Book a 20-minute walkthrough of AqarFlow. We'll show you the platform end-to-end.",
};

export default function DemoPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#faf9f6] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT — pitch */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-4">
              Book a demo
            </p>
            <h1 className="text-4xl font-extrabold text-[#0a0a0a] tracking-tight leading-tight mb-5">
              See AqarFlow in action — 20 minutes, no fluff.
            </h1>
            <p className="text-lg text-[#4a4a4a] leading-relaxed mb-8">
              We&apos;ll walk you through the full platform end-to-end: properties, listings,
              leads, deals, commission, document collection, and your public tenant site.
            </p>
            <ul className="space-y-4">
              {[
                "Tailored to your team size and use case",
                "Live walkthrough of your actual workflow",
                "Q&A with a product specialist",
                "No pressure, no long-term commitment",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#0a0a0a] text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#0f766e]/10 border border-[#0f766e]/30 flex items-center justify-center text-[#0f766e] text-xs shrink-0">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-12 p-6 bg-white rounded-2xl border border-black/8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#0f766e]/10 flex items-center justify-center">
                  <span className="text-[#0f766e] font-bold text-sm">AQ</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0a0a0a]">AqarFlow Team</p>
                  <p className="text-xs text-[#6a6a6a]">Real estate ops specialists</p>
                </div>
              </div>
              <p className="text-sm text-[#4a4a4a] italic leading-relaxed">
                &ldquo;We built AqarFlow because every real-estate platform we tried was either too
                generic or too expensive. This is the platform we wished existed.&rdquo;
              </p>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="bg-white rounded-3xl border border-black/8 shadow-xl p-8 sm:p-10">
            <DemoRequestForm />
          </div>
        </div>
      </div>
    </div>
  );
}
