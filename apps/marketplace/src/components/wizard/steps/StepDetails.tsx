"use client";

import type { WizardFormState } from "../wizard-types";

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";

const FURNISHING = ["furnished", "unfurnished", "partly_furnished"] as const;
const COMPLETION = ["ready", "off_plan"] as const;
const OWNERSHIP = ["freehold", "leasehold"] as const;
const VIEWS = ["sea", "city", "garden", "pool", "golf", "mountain", "community"] as const;

interface Props {
  state: WizardFormState;
  onChange: (updates: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function NumInput({
  label,
  value,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  value: number | null;
  max: number;
  placeholder: string;
  onChange: (v: number | null) => void;
}): React.ReactElement {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="number"
        min={0}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Math.min(Number(e.target.value), max) : null)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function PillSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null | undefined;
  options: readonly T[];
  onChange: (v: T | null) => void;
}): React.ReactElement {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? null : opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              value === opt
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-600 hover:border-teal-200"
            }`}
          >
            {opt.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepDetails({ state, onChange, onNext, onBack }: Props): React.ReactElement {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Property details</h2>
        <p className="text-sm text-slate-500 mt-1">All fields are optional but help attract buyers.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumInput
          label="Bedrooms"
          value={state.bedrooms ?? null}
          max={50}
          placeholder="3"
          onChange={(v) => onChange({ bedrooms: v })}
        />
        <NumInput
          label="Bathrooms"
          value={state.bathrooms ?? null}
          max={50}
          placeholder="2"
          onChange={(v) => onChange({ bathrooms: v })}
        />
        <NumInput
          label="Size (sqft)"
          value={state.size_sqft ?? null}
          max={999999}
          placeholder="1200"
          onChange={(v) => onChange({ size_sqft: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumInput
          label="Parking spaces"
          value={state.parking_spaces ?? null}
          max={20}
          placeholder="1"
          onChange={(v) => onChange({ parking_spaces: v })}
        />
        <NumInput
          label="Floor number"
          value={state.floor_number ?? null}
          max={200}
          placeholder="5"
          onChange={(v) => onChange({ floor_number: v })}
        />
      </div>

      <PillSelect
        label="Furnishing"
        value={state.furnishing_status}
        options={FURNISHING}
        onChange={(v) => onChange({ furnishing_status: v })}
      />
      <PillSelect
        label="Completion"
        value={state.completion_status}
        options={COMPLETION}
        onChange={(v) => onChange({ completion_status: v })}
      />
      <PillSelect
        label="Ownership"
        value={state.ownership_type}
        options={OWNERSHIP}
        onChange={(v) => onChange({ ownership_type: v })}
      />
      <PillSelect
        label="View"
        value={state.view_orientation}
        options={VIEWS}
        onChange={(v) => onChange({ view_orientation: v })}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
