"use client";

import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";
import type { WizardFormState } from "../wizard-types";

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";
const errCls = "text-[11px] text-red-500 mt-1";

interface Props {
  state: WizardFormState;
  onChange: (updates: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepLocation({ state, onChange, onNext, onBack }: Props): React.ReactElement {
  const { data: countriesData } = useMarketplaceCountries();
  const countries = countriesData?.countries ?? [];

  const canAdvance = !!state.country && !!state.city;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">Location</h2>
        <p className="text-sm text-slate-500 mt-1">Where is the property located?</p>
      </div>

      <div>
        <label className={labelCls}>Country *</label>
        <select
          value={state.country}
          onChange={(e) => onChange({ country: e.target.value })}
          className={inputCls}
        >
          <option value="">Select country…</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag_emoji} {c.name}
            </option>
          ))}
        </select>
        {!state.country && <p className={errCls}>Required</p>}
      </div>

      <div>
        <label className={labelCls}>City *</label>
        <input
          value={state.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="e.g. Dubai"
          className={inputCls}
        />
        {!state.city && <p className={errCls}>Required</p>}
      </div>

      <div>
        <label className={labelCls}>Area / Community</label>
        <input
          value={state.area ?? ""}
          onChange={(e) => onChange({ area: e.target.value })}
          placeholder="e.g. Downtown, JBR…"
          className={inputCls}
        />
        <p className="text-[11px] text-slate-400 mt-1">Optional — helps buyers find you faster</p>
      </div>

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
