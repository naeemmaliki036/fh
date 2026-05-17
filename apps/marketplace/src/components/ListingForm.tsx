"use client";

import { useState, useCallback } from "react";
import { useCountry } from "@/lib/country-context";
import type {
  ConsumerListingCreateRequest,
  ConsumerListingPurpose,
} from "@fh/portal-types";

const PROPERTY_TYPES = [
  "apartment", "villa", "townhouse", "penthouse", "studio",
  "office", "land", "warehouse", "retail", "other",
] as const;

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "KWD"] as const;

const AMENITIES_LIST = [
  "Pool", "Gym", "Parking", "Balcony", "Garden", "Security",
  "Elevator", "Central A/C", "Pet friendly", "Maid's room",
  "Study", "Storage", "Laundry", "Sea view", "City view",
] as const;

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";
const errCls = "text-[11px] text-red-500 mt-1";

export type ListingFormValues = ConsumerListingCreateRequest;
type FormErrors = Partial<Record<keyof ConsumerListingCreateRequest | "amenities", string>>;

interface ListingFormProps {
  initialValues?: Partial<ListingFormValues>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => void;
  onDelete?: () => void;
  isDeletePending?: boolean;
}

export function ListingForm({
  initialValues,
  isPending,
  submitLabel,
  onSubmit,
  onDelete,
  isDeletePending,
}: ListingFormProps): React.ReactElement {
  const { country: ctxCountry } = useCountry();

  const [form, setForm] = useState<ListingFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    property_type: initialValues?.property_type ?? "apartment",
    purpose: initialValues?.purpose ?? "sale",
    price: initialValues?.price ?? 0,
    currency: initialValues?.currency ?? "AED",
    country: initialValues?.country ?? ctxCountry ?? "",
    city: initialValues?.city ?? "",
    area: initialValues?.area ?? "",
    bedrooms: initialValues?.bedrooms ?? null,
    bathrooms: initialValues?.bathrooms ?? null,
    size_sqft: initialValues?.size_sqft ?? null,
    amenities: initialValues?.amenities ?? [],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = "Title required";
    if (form.price <= 0) e.price = "Price must be greater than 0";
    if (!form.country.trim()) e.country = "Country required";
    if (!form.city.trim()) e.city = "City required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const toggleAmenity = useCallback((a: string): void => {
    setForm((f) => {
      const list = f.amenities ?? [];
      const next = list.includes(a) ? list.filter((x) => x !== a) : [...list, a];
      return { ...f, amenities: next };
    });
  }, []);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className={labelCls}>Title *</label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="3BR apartment in Downtown Dubai..."
          className={inputCls}
        />
        {errors.title && <p className={errCls}>{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          placeholder="Tell buyers / renters about the property..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Type + Purpose */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Property type *</label>
          <select
            value={form.property_type}
            onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))}
            className={inputCls}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Purpose *</label>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(["sale", "rent_long"] as ConsumerListingPurpose[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, purpose: p }))}
                className={`flex-1 py-2.5 text-sm font-bold transition ${
                  form.purpose === p
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p === "sale" ? "Sale" : "Rent"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price + Currency */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label className={labelCls}>Price *</label>
          <input
            type="number"
            min={0}
            value={form.price || ""}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            placeholder="1000000"
            className={inputCls}
          />
          {errors.price && <p className={errCls}>{errors.price}</p>}
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <select
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className={inputCls}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Country *</label>
          <input
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="AE"
            className={inputCls}
          />
          {errors.country && <p className={errCls}>{errors.country}</p>}
        </div>
        <div>
          <label className={labelCls}>City *</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Dubai"
            className={inputCls}
          />
          {errors.city && <p className={errCls}>{errors.city}</p>}
        </div>
        <div>
          <label className={labelCls}>Area / Community</label>
          <input
            value={form.area ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            placeholder="Downtown"
            className={inputCls}
          />
        </div>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Bedrooms</label>
          <input
            type="number"
            min={0}
            max={50}
            value={form.bedrooms ?? ""}
            onChange={(e) => {
              const n = e.target.value ? Number(e.target.value) : null;
              setForm((f) => ({ ...f, bedrooms: n !== null && n > 50 ? 50 : n }));
            }}
            placeholder="3"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Bathrooms</label>
          <input
            type="number"
            min={0}
            max={50}
            value={form.bathrooms ?? ""}
            onChange={(e) => {
              const n = e.target.value ? Number(e.target.value) : null;
              setForm((f) => ({ ...f, bathrooms: n !== null && n > 50 ? 50 : n }));
            }}
            placeholder="2"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Size (sqft)</label>
          <input
            type="number"
            min={0}
            value={form.size_sqft ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, size_sqft: e.target.value ? Number(e.target.value) : null }))}
            placeholder="1500"
            className={inputCls}
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className={labelCls}>Amenities</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {AMENITIES_LIST.map((a) => {
            const selected = (form.amenities ?? []).includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? "bg-teal-600 text-white border-teal-600"
                    : "border-slate-200 text-slate-600 hover:border-teal-300"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeletePending}
            className="rounded-xl border border-red-200 px-6 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition disabled:opacity-60"
          >
            {isDeletePending ? "Archiving..." : "Delete listing"}
          </button>
        )}
      </div>
    </form>
  );
}
