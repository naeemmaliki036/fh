"use client";

import { MapPin, Bed, Bath, Maximize, Image } from "lucide-react";
import type { WizardFormState } from "../wizard-types";
import type { ConsumerListingMediaItem } from "@fh/portal-types";

interface Props {
  state: WizardFormState;
  media: ConsumerListingMediaItem[];
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

function Row({ label, value }: { label: string; value: string | null | undefined }): React.ReactElement | null {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800 capitalize">{value.replace(/_/g, " ")}</span>
    </div>
  );
}

export function StepReview({ state, media, isSaving, isSubmitting, onSaveDraft, onSubmit, onBack }: Props): React.ReactElement {
  const coverUrl = media[0]?.url ?? null;
  const locationStr = [state.area, state.city, state.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Review & submit</h2>
        <p className="text-sm text-slate-500 mt-1">Check your listing before submitting for review.</p>
      </div>

      {/* Preview card */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="relative aspect-[3/2] bg-slate-100">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-300">
              <Image className="h-10 w-10" />
            </div>
          )}
          <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${state.purpose === "sale" ? "bg-teal-600" : "bg-amber-500"}`}>
            {state.purpose === "sale" ? "For sale" : "For rent"}
          </span>
        </div>
        <div className="p-4 space-y-3">
          <p className="font-black text-slate-900">{state.title || "—"}</p>
          <p className="text-base font-black text-teal-700">
            {state.currency ?? "AED"} {(state.price ?? 0).toLocaleString("en-AE")}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3 text-teal-500" />
            {locationStr || "Location not set"}
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            {state.bedrooms != null && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{state.bedrooms} bed</span>}
            {state.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{state.bathrooms} bath</span>}
            {state.size_sqft != null && <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{state.size_sqft.toLocaleString()} sqft</span>}
          </div>
        </div>
      </div>

      {/* Details summary */}
      <div className="rounded-xl bg-slate-50 p-4 space-y-0.5">
        <Row label="Type" value={state.property_type} />
        <Row label="Furnishing" value={state.furnishing_status} />
        <Row label="Completion" value={state.completion_status} />
        <Row label="Ownership" value={state.ownership_type} />
        <Row label="View" value={state.view_orientation} />
        <div className="flex justify-between py-1.5">
          <span className="text-xs text-slate-500">Photos</span>
          <span className="text-xs font-semibold text-slate-800">{media.length} uploaded</span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        After submitting, your listing will be reviewed by our team. This typically takes less than 24 hours.
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
          onClick={onSaveDraft}
          disabled={isSaving}
          className="flex-1 rounded-xl border border-teal-200 py-3 text-sm font-bold text-teal-700 hover:bg-teal-50 transition disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-50"
        >
          {isSubmitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
