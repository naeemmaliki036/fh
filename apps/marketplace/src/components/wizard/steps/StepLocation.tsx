"use client";

import { LocationPicker } from "@/components/LocationPicker";
import type { WizardFormState } from "../wizard-types";

const errCls = "text-[11px] text-red-500 mt-1";

interface Props {
  state: WizardFormState;
  onChange: (updates: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepLocation({ state, onChange, onNext, onBack }: Props): React.ReactElement {
  const canAdvance = !!state.country && !!state.city;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">Location</h2>
        <p className="text-sm text-slate-500 mt-1">Where is the property located?</p>
      </div>

      <LocationPicker
        country={state.country || null}
        city={state.city || null}
        area={state.area ?? null}
        onChange={({ country: c, city: ci, area: a }) => {
          onChange({
            country: c ?? "",
            city: ci ?? "",
            area: a ?? null,
          });
        }}
        required={true}
        showArea={true}
        layout="stacked"
      />

      {!state.country && <p className={errCls}>Country is required</p>}
      {state.country && !state.city && <p className={errCls}>City is required</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canAdvance}
          onClick={onNext}
          className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
