"use client";

import { useState } from "react";
import { CITIES_BY_COUNTRY, AREAS_BY_CITY } from "@/lib/constants/locations";
import { SearchableSelect } from "@/components/molecules/SearchableSelect";
import { useCreatePublicLead } from "@/hooks/mutations/public-site/useCreatePublicLead";
import { PhoneInput } from "@/components/molecules/PhoneInput";
import { isValidPhone } from "@/lib/utils/phone";

export type ListingIntent = "sell" | "rent_long" | "rent_short";

const PROPERTY_TYPES = [
  "Apartment", "Villa", "Townhouse", "Penthouse",
  "Office", "Retail", "Warehouse", "Plot", "Building", "Other",
] as const;

const INTENT_LABELS: Record<ListingIntent, string> = {
  sell: "Sell my property",
  rent_long: "Rent out my property",
  rent_short: "Short-term rent",
};

const COUNTRY_LABELS: Record<string, string> = { AE: "UAE", SA: "Saudi Arabia" };
const CURRENCY_BY_COUNTRY: Record<string, string> = { AE: "AED", SA: "SAR" };

interface FormState {
  intent: ListingIntent;
  name: string;
  phone: string;
  email: string;
  propertyType: string;
  country: string;
  city: string;
  area: string;
  bedrooms: string;
  price: string;
  message: string;
}

type FormErrors = Partial<Record<"name" | "phone" | "email" | "propertyType" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildMessage(form: FormState): string {
  const lines: string[] = [`Intent: ${INTENT_LABELS[form.intent]}`];
  if (form.propertyType) lines.push(`Property type: ${form.propertyType}`);
  if (form.country) lines.push(`Country: ${COUNTRY_LABELS[form.country] ?? form.country}`);
  if (form.city) lines.push(`City: ${form.city}`);
  if (form.area) lines.push(`Area: ${form.area}`);
  if (form.bedrooms) lines.push(`Bedrooms: ${form.bedrooms}`);
  if (form.price) lines.push(`Approx price/rent: ${form.price}`);
  if (form.message) lines.push(`Additional info: ${form.message}`);
  return lines.join("\n");
}

export const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 disabled:opacity-50";
export const errCls = "mt-1 px-1 text-xs text-red-600";
export const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export interface ListYourPropertyFormProps {
  slug: string;
  initialIntent: ListingIntent;
  operatingCountries: string[];
  onSuccess: (name: string) => void;
}

export function ListYourPropertyForm({
  slug,
  initialIntent,
  operatingCountries,
  onSuccess,
}: ListYourPropertyFormProps): React.ReactElement {
  const multiCountry = operatingCountries.length > 1;
  const implicitCountry = multiCountry ? "" : (operatingCountries[0] ?? "");

  const [form, setForm] = useState<FormState>({
    intent: initialIntent,
    name: "",
    phone: "",
    email: "",
    propertyType: "",
    country: implicitCountry,
    city: "",
    area: "",
    bedrooms: "",
    price: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate, isPending } = useCreatePublicLead({
    slug,
    onSuccess: () => onSuccess(form.name),
  });

  const set =
    <K extends keyof FormState>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      const value = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "country") { next.city = ""; next.area = ""; }
        if (field === "city") { next.area = ""; }
        return next;
      });
      if (field === "name" || field === "phone" || field === "email" ||
          field === "propertyType" || field === "message") {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const activeCountry = multiCountry ? form.country : implicitCountry;
  const cityOptions = activeCountry ? (CITIES_BY_COUNTRY[activeCountry] ?? []) : [];
  const cityValue = cityOptions.find((c) => c.label === form.city)?.value ?? "";
  const areaOptions = cityValue ? (AREAS_BY_CITY[cityValue] ?? []) : [];
  const currency = operatingCountries.map((c) => CURRENCY_BY_COUNTRY[c]).find(Boolean) ?? "USD";

  function validate(): boolean {
    const errs: FormErrors = {};
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    else if (form.name.trim().length > 120) errs.name = "Name must be under 120 characters";
    if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email address";
    if (!isValidPhone(form.phone)) errs.phone = "Enter a valid phone number (7-20 digits)";
    if (!form.propertyType) errs.propertyType = "Select a property type";
    if (form.message.length > 1000) errs.message = "Message must be under 1000 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!validate()) return;
    mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: buildMessage(form),
      listing_id: null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>I want to...</label>
        <select value={form.intent} onChange={set("intent")} className={fieldCls}>
          {(Object.keys(INTENT_LABELS) as ListingIntent[]).map((k) => (
            <option key={k} value={k}>{INTENT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Full name *</label>
          <input value={form.name} onChange={set("name")} placeholder="Jane Smith" className={fieldCls} />
          {errors.name && <p className={errCls}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <PhoneInput
            value={form.phone}
            onChange={(v) => {
              setForm((prev) => ({ ...prev, phone: v }));
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            placeholder="+971 50 123 4567"
            className={fieldCls}
            error={errors.phone}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Email *</label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" className={fieldCls} />
        {errors.email && <p className={errCls}>{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Property type *</label>
          <select value={form.propertyType} onChange={set("propertyType")} className={fieldCls}>
            <option value="">Select type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t.toLowerCase()}>{t}</option>
            ))}
          </select>
          {errors.propertyType && <p className={errCls}>{errors.propertyType}</p>}
        </div>

        {multiCountry && (
          <div>
            <label className={labelCls}>Country</label>
            <select value={form.country} onChange={set("country")} className={fieldCls}>
              <option value="">Select country</option>
              {operatingCountries.map((c) => (
                <option key={c} value={c}>{COUNTRY_LABELS[c] ?? c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>City</label>
          {cityOptions.length > 0 ? (
            <select
              value={form.city}
              onChange={set("city")}
              disabled={multiCountry && !form.country}
              className={fieldCls}
            >
              <option value="">Select city</option>
              {cityOptions.map((c) => (
                <option key={c.value} value={c.label}>{c.label}</option>
              ))}
            </select>
          ) : (
            <input value={form.city} onChange={set("city")} placeholder="City" className={fieldCls} />
          )}
        </div>

        <div>
          <label className={labelCls}>Area</label>
          <SearchableSelect
            value={form.area || null}
            onChange={(v) => setForm((prev) => ({ ...prev, area: v }))}
            options={areaOptions}
            placeholder="Area / community"
            disabled={!form.city}
            allowFreeText
            className={fieldCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Bedrooms</label>
          <input type="number" min={0} value={form.bedrooms} onChange={set("bedrooms")} placeholder="e.g. 3" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Approx price / rent</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">{currency}</span>
            <input value={form.price} onChange={set("price")} placeholder="1,200,000" className={`${fieldCls} pl-12`} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Additional notes</label>
        <textarea rows={3} value={form.message} onChange={set("message")} placeholder="Anything else you'd like us to know..." className={`${fieldCls} resize-y`} />
        {errors.message && <p className={errCls}>{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-extrabold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send to our team"}
      </button>
    </form>
  );
}
