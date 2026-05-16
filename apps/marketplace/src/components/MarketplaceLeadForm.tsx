"use client";

import { useState, useCallback } from "react";
import { marketplaceApi } from "@/lib/api";
import { isValidPhone, sanitizePhone } from "@/lib/phone";

interface MarketplaceLeadFormProps {
  tenantSlug: string;
  listingId: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400";
const errCls = "text-[11px] text-red-500 mt-0.5";

export function MarketplaceLeadForm({
  tenantSlug,
  listingId,
}: MarketplaceLeadFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (form.name.trim().length < 2) errs.name = "Name required";
    if (!EMAIL_RE.test(form.email)) errs.email = "Valid email required";
    if (form.phone && !isValidPhone(form.phone)) errs.phone = "Invalid phone";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handlePhoneChange = useCallback(
    (v: string): void => setForm((f) => ({ ...f, phone: sanitizePhone(v) })),
    [],
  );

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;
    setPending(true);
    try {
      await marketplaceApi.post(`/public/sites/${tenantSlug}/leads`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        message: form.message || null,
        listing_id: listingId,
      });
      setSent(true);
    } catch {
      setErrors((e) => ({ ...e, message: "Failed to send. Please try again." }));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="py-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <span className="text-emerald-600 text-xl">&#10003;</span>
        </div>
        <p className="font-bold text-slate-900">Message sent!</p>
        <p className="text-xs text-slate-500">The agency will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-black text-slate-900">Contact agent</h3>
      <div>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Full name *"
          className={inputCls}
        />
        {errors.name && <p className={errCls}>{errors.name}</p>}
      </div>
      <div>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email *"
          className={inputCls}
        />
        {errors.email && <p className={errCls}>{errors.email}</p>}
      </div>
      <div>
        <input
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="+971 50 000 0000"
          className={inputCls}
        />
        {errors.phone && <p className={errCls}>{errors.phone}</p>}
      </div>
      <div>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="I am interested in this property..."
          rows={3}
          className={`${inputCls} resize-none`}
        />
        {errors.message && <p className={errCls}>{errors.message}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700 transition disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
