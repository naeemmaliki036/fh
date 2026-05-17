"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCountries, useCities, useAreas } from "@/hooks/queries/useLocations";
import type { CountryWithCounts, City, Area } from "@/lib/types/location";

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

interface LocationDropdownProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  isLoading: boolean;
  disabled: boolean;
  required?: boolean;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}

function LocationDropdown({
  id, label, value, placeholder, isLoading, disabled, required,
  onValueChange, children,
}: LocationDropdownProps): React.ReactElement {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={isLoading ? "Loading…" : placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
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
  const { data: countries, isLoading: loadingCountries } = useCountries();

  const countryRecord: CountryWithCounts | undefined = countries?.find(
    (c) => c.code === country,
  );
  const countryId = countryRecord?.id;

  const { data: cities, isLoading: loadingCities } = useCities(countryId);

  const cityRecord: City | undefined = cities?.find((c) => c.label === city);
  const cityId = cityRecord?.id;

  const { data: areas, isLoading: loadingAreas } = useAreas(showArea ? cityId : undefined);

  const gridCls = layout === "grid"
    ? `grid grid-cols-1 gap-3 ${showArea ? "sm:grid-cols-3" : "sm:grid-cols-2"}`
    : "flex flex-col gap-3";

  return (
    <div className={gridCls}>
      <LocationDropdown
        id="lp-country"
        label="Country"
        value={country ?? ""}
        placeholder="Select country"
        isLoading={loadingCountries}
        disabled={disabled}
        required={required}
        onValueChange={(code) => onChange({ country: code || null, city: null, area: null })}
      >
        {(countries ?? []).map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.flag_emoji ? `${c.flag_emoji} ` : ""}{c.name} ({c.code})
          </SelectItem>
        ))}
      </LocationDropdown>

      <LocationDropdown
        id="lp-city"
        label="City"
        value={city ?? ""}
        placeholder={
          !country ? "Select country first" :
          (cities?.length === 0 ? "No cities — ask admin to add" : "Select city")
        }
        isLoading={loadingCities}
        disabled={disabled || !country}
        required={required}
        onValueChange={(label) => onChange({ country, city: label || null, area: null })}
      >
        {(cities ?? []).map((c: City) => (
          <SelectItem key={c.id} value={c.label}>{c.label}</SelectItem>
        ))}
      </LocationDropdown>

      {showArea && (
        <LocationDropdown
          id="lp-area"
          label="Area"
          value={area ?? ""}
          placeholder={
            !city ? "Select city first" :
            (areas?.length === 0 ? "No areas — ask admin to add" : "Select area (optional)")
          }
          isLoading={loadingAreas}
          disabled={disabled || !city}
          onValueChange={(label) => onChange({ country, city, area: label || null })}
        >
          {(areas ?? []).map((a: Area) => (
            <SelectItem key={a.id} value={a.label}>{a.label}</SelectItem>
          ))}
        </LocationDropdown>
      )}
    </div>
  );
}
