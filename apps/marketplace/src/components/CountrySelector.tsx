"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCountry } from "@/lib/country-context";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";

export function CountrySelector(): React.ReactElement {
  const { country, setCountry, isHydrated } = useCountry();
  const { data } = useMarketplaceCountries();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function onOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  if (!isHydrated || !country) return <></>;

  const countries = data?.countries ?? [];
  const selected = countries.find((c) => c.code === country);
  const selectedName = selected?.name ?? country;
  const selectedFlag = selected?.flag_emoji ?? "🏳️";

  function handleSelect(code: string): void {
    setCountry(code);
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span role="img" aria-label={selectedName} className="text-base leading-none">
          {selectedFlag}
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate">{selectedName}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select country"
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
            {countries.map(({ code, name, flag_emoji }) => {
              const isSelected = code === country;
              return (
                <button
                  key={code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(code)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50 font-semibold"
                  }`}
                >
                  <span className="text-xl leading-none" role="img" aria-label={name}>
                    {flag_emoji}
                  </span>
                  <span className="flex-1 truncate">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
