"use client";

import type { WizardFormState } from "../wizard-types";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "office", label: "Office" },
  { value: "land", label: "Land" },
  { value: "warehouse", label: "Warehouse" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
] as const;

interface Props {
  state: WizardFormState;
  onChange: (updates: Partial<WizardFormState>) => void;
  onNext: () => void;
}

export function StepPurposeType({ state, onChange, onNext }: Props): React.ReactElement {
  const canAdvance = !!state.property_type;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">Purpose & property type</h2>
        <p className="text-sm text-slate-500 mt-1">What are you listing?</p>
      </div>

      {/* Purpose */}
      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">Are you selling or renting?</p>
        <div className="flex gap-3">
          {[
            { value: "sale", label: "For sale" },
            { value: "rent_long", label: "For rent" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ purpose: value as WizardFormState["purpose"] })}
              className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition ${
                state.purpose === value
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-600 hover:border-teal-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">Property type</p>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ property_type: value })}
              className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                state.property_type === value
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-600 hover:border-teal-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canAdvance}
        onClick={onNext}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
