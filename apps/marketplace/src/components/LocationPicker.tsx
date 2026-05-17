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
  // pr-10 leaves space for the native dropdown chevron so it doesn't crowd the text
  "w-full rounded-xl border border-slate-200 pl-4 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 disabled:opacity-50 bg-white appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-[image:url('data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22%2364748b%22%3E%3Cpath%20fill-rule=%22evenodd%22%20d=%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.06l3.71-3.83a.75.75%200%20111.08%201.04l-4.25%204.39a.75.75%200%2001-1.08%200L5.21%208.27a.75.75%200%2001.02-1.06z%22%20clip-rule=%22evenodd%22/%3E%3C/svg%3E')]";
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
