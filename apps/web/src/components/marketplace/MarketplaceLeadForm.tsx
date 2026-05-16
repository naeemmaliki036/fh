"use client";

import { useState } from "react";
import { useCreatePublicLead } from "@/hooks/mutations/public-site/useCreatePublicLead";
import { isValidPhone } from "@/lib/utils/phone";
import { PhoneInput } from "@/components/molecules/PhoneInput";

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

export function MarketplaceLeadForm({ tenantSlug, listingId }: MarketplaceLeadFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [sent, setSent] = useState(false);

  const { mutate, isPending } = useCreatePublicLead({
    slug: tenantSlug,
    onSuccess: () => setSent(true),
  });

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (form.name.trim().length < 2) errs.name = "Name required";
    if (!EMAIL_RE.test(form.email)) errs.email = "Valid email required";
    if (form.phone && !isValidPhone(form.phone)) errs.phone = "Invalid phone";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!validate()) return;
    mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      message: form.message || null,
      listing_id: listingId,
    });
  }

  if (sent) {
    return (
      <div className="py-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <span className="text-emerald-600 text-xl">✓</span>
        </div>
        <p className="font-bold text-slate-900">Message sent!</p>
        <p className="text-xs text-slate-500">The agency will contact you shortly.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400";
  const errCls = "text-[11px] text-red-500 mt-0.5";

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
        <PhoneInput
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          placeholder="+971 50 000 0000"
          error={errors.phone}
        />
      </div>
      <div>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="I am interested in this property..."
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700 transition disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
