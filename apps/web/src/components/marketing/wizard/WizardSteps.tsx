"use client";

import { PhoneInput } from "@/components/molecules/PhoneInput";
import { useLocationData } from "@/hooks/useLocationData";
import { cn } from "@/lib/utils/cn";
import type { WizardState, WizardPropertyType, WizardBedrooms } from "./wizard-types";

// ---- Shared atoms ----
export function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition select-none",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
      )}
    >
      {children}
    </button>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

const RESIDENTIAL_TYPES: WizardPropertyType[] = [
  "apartment", "villa", "townhouse", "penthouse", "land", "other",
];
const COMMERCIAL_TYPES: WizardPropertyType[] = ["office", "retail", "warehouse"];
const BEDS: WizardBedrooms[] = ["studio", "1", "2", "3", "4", "5", "6", "7", "8+"];
const FURNISHING_OPTIONS = [
  { value: "furnished" as const, label: "Furnished" },
  { value: "unfurnished" as const, label: "Unfurnished" },
  { value: "partly_furnished" as const, label: "Partly" },
];
const URGENCY_OPTIONS = [
  { value: "this_month" as const, label: "This month" },
  { value: "within_2_months" as const, label: "Within 2 months" },
  { value: "flexible" as const, label: "Flexible" },
];

interface StepProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export function StepIntent({ state, onChange }: StepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">I am looking to</h2>
      <div className="flex gap-3 flex-wrap">
        <PillButton active={state.intent === "sell"} onClick={() => onChange({ intent: "sell" })}>Sell</PillButton>
        <PillButton active={state.intent === "rent"} onClick={() => onChange({ intent: "rent" })}>Rent</PillButton>
      </div>
    </div>
  );
}

export function StepRentFrequency({ state, onChange }: StepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Rent period</h2>
      <div className="flex gap-3">
        <PillButton active={state.rentFrequency === "yearly"} onClick={() => onChange({ rentFrequency: "yearly" })}>Yearly</PillButton>
        <PillButton active={state.rentFrequency === "monthly"} onClick={() => onChange({ rentFrequency: "monthly" })}>Monthly</PillButton>
      </div>
    </div>
  );
}

export function StepLocation({ state, onChange }: StepProps): React.ReactElement {
  const { citiesByCountry, areasByCity } = useLocationData();
  const allCities = Object.values(citiesByCountry).flat();
  const citySlug = allCities.find((c) => c.label === state.city)?.value ?? "";
  const areaOptions = citySlug ? (areasByCity[citySlug] ?? []) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Where is the property?</h2>
      <div className="space-y-3">
        {allCities.length > 0 ? (
          <select
            value={state.city}
            onChange={(e) => onChange({ city: e.target.value, area: "" })}
            className={inputCls}
          >
            <option value="">Select city</option>
            {allCities.map((c) => <option key={c.value} value={c.label}>{c.label}</option>)}
          </select>
        ) : (
          <input value={state.city} onChange={(e) => onChange({ city: e.target.value })} placeholder="City" className={inputCls} />
        )}
        {areaOptions.length > 0 ? (
          <select value={state.area} onChange={(e) => onChange({ area: e.target.value })} className={inputCls}>
            <option value="">Select area (optional)</option>
            {areaOptions.map((a) => <option key={a.value} value={a.label}>{a.label}</option>)}
          </select>
        ) : (
          <input value={state.area} onChange={(e) => onChange({ area: e.target.value })} placeholder="Area / community (optional)" className={inputCls} />
        )}
      </div>
    </div>
  );
}

export function StepCategoryType({ state, onChange }: StepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Property category & type</h2>
      <div className="flex gap-2 mb-3">
        <PillButton active={state.category === "residential"} onClick={() => onChange({ category: "residential", propertyType: null })}>Residential</PillButton>
        <PillButton active={state.category === "commercial"} onClick={() => onChange({ category: "commercial", propertyType: null })}>Commercial</PillButton>
      </div>
      <div className="flex flex-wrap gap-2">
        {(state.category === "residential" ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES).map((t) => (
          <PillButton key={t} active={state.propertyType === t} onClick={() => onChange({ propertyType: t })}>
            <span className="capitalize">{t.replace("_", " ")}</span>
          </PillButton>
        ))}
      </div>
    </div>
  );
}

export function StepBedrooms({ state, onChange }: StepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">How many bedrooms?</h2>
      <div className="flex flex-wrap gap-2">
        {BEDS.map((b) => (
          <PillButton key={b} active={state.bedrooms === b} onClick={() => onChange({ bedrooms: b })}>
            {b === "studio" ? "Studio" : b}
          </PillButton>
        ))}
      </div>
    </div>
  );
}

export function StepAreaFurnishing({ state, onChange }: StepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Size & furnishing</h2>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Size (sqft) *</label>
        <input
          type="number"
          min={0}
          value={state.sqft}
          onChange={(e) => onChange({ sqft: e.target.value })}
          placeholder="e.g. 1200"
          className={`mt-1 ${inputCls}`}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Furnishing</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {FURNISHING_OPTIONS.map((f) => (
            <PillButton key={f.value} active={state.furnishing === f.value} onClick={() => onChange({ furnishing: f.value })}>
              {f.label}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepUrgency({ state, onChange }: StepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">When do you want to list?</h2>
      <div className="flex flex-wrap gap-2">
        {URGENCY_OPTIONS.map((u) => (
          <PillButton key={u.value} active={state.urgency === u.value} onClick={() => onChange({ urgency: u.value })}>
            {u.label}
          </PillButton>
        ))}
      </div>
    </div>
  );
}

interface StepContactProps extends StepProps {
  errors: { name?: string; email?: string; phone?: string };
}

export function StepContact({ state, onChange, errors }: StepContactProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900">Your contact details</h2>
      <div>
        <input value={state.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Full name *" className={inputCls} />
        {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
      </div>
      <div>
        <input type="email" value={state.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="Email *" className={inputCls} />
        {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
      </div>
      <div>
        <PhoneInput value={state.phone} onChange={(v) => onChange({ phone: v })} placeholder="+971 50 000 0000" error={errors.phone} />
      </div>
    </div>
  );
}
