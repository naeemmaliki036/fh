"use client";

import {
  useLocationCountries,
  useLocationCities,
  useLocationAreas,
} from "@/hooks/queries/useLocations";
import type { LocationCountry, LocationCity, LocationArea } from "@fh/portal-types";

export interface LocationPickerProps {
  country: string | null;
  city: string | null;
  area: string | null;
  onChange: (next: { country: string | null; city: string | null; area: string | null }) => void;
  required?: boolean;
  showArea?: boolean;
  layout?: "grid" | "stacked";
  disabled?: boolean;
}

const selectCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 disabled:opacity-50 bg-white";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";

interface DropdownProps {
  label: string;
  value: string;
  placeholder: string;
  isLoading: boolean;
  disabled: boolean;
  required?: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

function Dropdown({
  label, value, placeholder, isLoading, disabled, required,
  onChange, children,
}: DropdownProps): React.ReactElement {
  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className={selectCls}
      >
        <option value="">{isLoading ? "Loading…" : placeholder}</option>
        {children}
      </select>
    </div>
  );
}

export function LocationPicker({
  country,
  city,
  area,
  onChange,
  required = false,
  showArea = true,
  layout = "grid",
  disabled = false,
}: LocationPickerProps): React.ReactElement {
  const { data: countries, isLoading: loadingCountries } = useLocationCountries();

  const countryRecord: LocationCountry | undefined = countries?.find(
    (c) => c.code === country,
  );
  const countryId = countryRecord?.id;

  const { data: cities, isLoading: loadingCities } = useLocationCities(countryId);

  const cityRecord: LocationCity | undefined = cities?.find((c) => c.label === city);
  const cityId = cityRecord?.id;

  const { data: areas, isLoading: loadingAreas } = useLocationAreas(
    showArea ? cityId : undefined,
  );

  const wrapperCls =
    layout === "grid"
      ? `grid grid-cols-1 gap-3 ${showArea ? "sm:grid-cols-3" : "sm:grid-cols-2"}`
      : "flex flex-col gap-3";

  return (
    <div className={wrapperCls}>
      <Dropdown
        label="Country"
        value={country ?? ""}
        placeholder="Select country"
        isLoading={loadingCountries}
        disabled={disabled}
        required={required}
        onChange={(v) => onChange({ country: v || null, city: null, area: null })}
      >
        {(countries ?? []).map((c: LocationCountry) => (
          <option key={c.code} value={c.code}>
            {c.flag_emoji ? `${c.flag_emoji} ` : ""}{c.name} ({c.code})
          </option>
        ))}
      </Dropdown>

      <Dropdown
        label="City"
        value={city ?? ""}
        placeholder={
          !country
            ? "Select country first"
            : cities?.length === 0
            ? "No cities — ask admin to add"
            : "Select city"
        }
        isLoading={loadingCities}
        disabled={disabled || !country}
        required={required}
        onChange={(v) => onChange({ country, city: v || null, area: null })}
      >
        {(cities ?? []).map((c: LocationCity) => (
          <option key={c.id} value={c.label}>{c.label}</option>
        ))}
      </Dropdown>

      {showArea && (
        <Dropdown
          label="Area"
          value={area ?? ""}
          placeholder={
            !city ? "Select city first" :
            areas?.length === 0 ? "No areas — ask admin to add" : "Select area (optional)"
          }
          isLoading={loadingAreas}
          disabled={disabled || !city}
          onChange={(v) => onChange({ country, city, area: v || null })}
        >
          {(areas ?? []).map((a: LocationArea) => (
            <option key={a.id} value={a.label}>{a.label}</option>
          ))}
        </Dropdown>
      )}
    </div>
  );
}
