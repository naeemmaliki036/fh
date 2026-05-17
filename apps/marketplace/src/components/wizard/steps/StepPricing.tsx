"use client";

import type { WizardFormState } from "../wizard-types";

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";
const errCls = "text-[11px] text-red-500 mt-1";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "KWD"] as const;

interface Props {
  state: WizardFormState;
  onChange: (updates: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
  /** Inline error from a backend 422 price-validation rule. */
  priceApiError?: string | null;
  onSaveDraft?: () => void;
  isSaving?: boolean;
}

export function StepPricing({ state, onChange, onNext, onBack, priceApiError, onSaveDraft, isSaving }: Props): React.ReactElement {
  const canAdvance = !!state.title?.trim() && (state.price ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Price & description</h2>
        <p className="text-sm text-slate-500 mt-1">Give your listing a title and set your asking price.</p>
      </div>

      <div>
        <label className={labelCls}>Title *</label>
        <input
          value={state.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="3BR apartment in Downtown Dubai…"
          className={inputCls}
          maxLength={200}
        />
        {!state.title?.trim() && <p className={errCls}>Title is required</p>}
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={state.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          placeholder="Tell buyers about the property, nearby amenities…"
          className={`${inputCls} resize-none`}
          maxLength={5000}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label className={labelCls}>Price *</label>
          <input
            type="number"
            min={0}
            value={state.price ?? ""}
            onChange={(e) => onChange({ price: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="1,000,000"
            className={priceApiError ? `${inputCls} border-red-400 ring-2 ring-red-400/20` : inputCls}
          />
          {!(state.price && state.price > 0) && !priceApiError && (
            <p className={errCls}>Price is required</p>
          )}
          {priceApiError && <p className={errCls}>{priceApiError}</p>}
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <select
            value={state.currency ?? "AED"}
            onChange={(e) => onChange({ currency: e.target.value })}
            className={inputCls}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 min-w-[120px] rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          Back
        </button>
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="flex-1 min-w-[120px] rounded-xl border border-teal-300 py-3 text-sm font-bold text-teal-700 hover:bg-teal-50 transition disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save draft & exit"}
          </button>
        )}
        <button
          type="button"
          disabled={!canAdvance}
          onClick={onNext}
          className="flex-1 min-w-[120px] rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
