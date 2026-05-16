"use client";

import { Globe } from "lucide-react";
import { useCountry } from "@/lib/country-context";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";

export function CountryGateModal(): React.ReactElement | null {
  const { country, setCountry, isHydrated } = useCountry();
  const { data } = useMarketplaceCountries();

  if (!isHydrated || country !== null) return null;

  const countries = data?.countries ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select your country"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-8 py-8 text-white text-center">
          <Globe className="h-10 w-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl font-black leading-tight">Where are you looking?</h1>
          <p className="mt-2 text-sm text-teal-100 leading-relaxed">
            Pick a country to start exploring properties on {PORTAL_BRAND_NAME}.
          </p>
        </div>

        {/* Country grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {countries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-400 text-sm">
              <Globe className="h-8 w-8 opacity-40" />
              <p>Loading available countries…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {countries.map(({ code, name, flag_emoji }) => (
                <button
                  key={code}
                  onClick={() => setCountry(code)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 hover:border-teal-400 hover:shadow-md transition text-center"
                >
                  <span className="text-4xl leading-none" role="img" aria-label={name}>
                    {flag_emoji}
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-snug group-hover:text-teal-700 transition">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
