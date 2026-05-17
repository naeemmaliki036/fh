"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";
import { WORLD_COUNTRIES } from "@/lib/utils/world-countries";

interface CountrySelectFieldProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

const OTHER_CODE = "__OTHER__";

export function CountrySelectField({
  id,
  value,
  onChange,
  error,
  label = "Country",
  required,
}: CountrySelectFieldProps): React.ReactElement {
  const { data } = useMarketplaceCountries();
  const curated = (data?.items ?? []).filter((c) => c.enabled);

  // Determine if the current value is in curated list
  const isOtherMode = useState<boolean>(
    () => !!value && !curated.some((c) => c.code === value),
  )[0];
  const [showWorld, setShowWorld] = useState(isOtherMode);

  const selectBase = cn(
    "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0f766e]",
    error ? "border-red-400" : "border-input",
  );

  function handleChange(v: string): void {
    if (v === OTHER_CODE) {
      setShowWorld(true);
      onChange("");
    } else {
      onChange(v);
    }
  }

  if (showWorld) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-medium text-[#0a0a0a]">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <button
            type="button"
            onClick={() => { setShowWorld(false); onChange(""); }}
            className="text-xs text-teal-600 hover:underline"
          >
            Back to curated list
          </button>
        </div>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectBase}
        >
          <option value="">Select country</option>
          {WORLD_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#0a0a0a]">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={selectBase}
      >
        <option value="">Select country</option>
        {curated.map((c) => (
          <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>
        ))}
        <option value={OTHER_CODE}>Other…</option>
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
