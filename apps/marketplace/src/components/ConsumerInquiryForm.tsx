"use client";

import { useState, useCallback } from "react";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { submitConsumerInquiry } from "@fh/api-client/src/consumer";
import { marketplaceApi } from "@/lib/api";
import { isValidPhone, sanitizePhone } from "@/lib/phone";
import type { ConsumerListingLeadResponse } from "@fh/portal-types";

interface ConsumerInquiryFormProps {
  listingId: string;
}

interface FormState {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";
const errCls = "text-[11px] text-red-500 mt-0.5";

export function ConsumerInquiryForm({ listingId }: ConsumerInquiryFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    buyer_name: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_message: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ConsumerListingLeadResponse | null>(null);

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (form.buyer_name.trim().length < 2) e.buyer_name = "Name required";
    if (!EMAIL_RE.test(form.buyer_email)) e.buyer_email = "Valid email required";
    if (form.buyer_phone && !isValidPhone(form.buyer_phone)) e.buyer_phone = "Invalid phone";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handlePhoneChange = useCallback(
    (v: string): void => setForm((f) => ({ ...f, buyer_phone: sanitizePhone(v) })),
    [],
  );

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;
    setPending(true);
    try {
      const data = await submitConsumerInquiry(marketplaceApi, listingId, {
        buyer_name: form.buyer_name.trim(),
        buyer_email: form.buyer_email.trim(),
        buyer_phone: form.buyer_phone || undefined,
        buyer_message: form.buyer_message || undefined,
      });
      setResult(data);
    } catch {
      setErrors((prev) => ({ ...prev, buyer_message: "Failed to send. Please try again." }));
    } finally {
      setPending(false);
    }
  }

  if (result) {
    const { seller_contact } = result;
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-sm font-bold text-emerald-800">
            Reveal request sent. The owner has been notified.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Owner contact</p>
          {seller_contact.email && (
            <a
              href={`mailto:${seller_contact.email}`}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-teal-600 transition"
            >
              <Mail className="h-4 w-4 text-slate-400" /> {seller_contact.email}
            </a>
          )}
          {seller_contact.phone && (
            <>
              <a
                href={`tel:${seller_contact.phone}`}
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-teal-600 transition"
              >
                <Phone className="h-4 w-4 text-slate-400" /> {seller_contact.phone}
              </a>
              <a
                href={`https://wa.me/${seller_contact.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 transition"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-black text-slate-900">Contact the owner</h3>
      <div>
        <input
          value={form.buyer_name}
          onChange={(e) => setForm((f) => ({ ...f, buyer_name: e.target.value }))}
          placeholder="Your name *"
          className={inputCls}
        />
        {errors.buyer_name && <p className={errCls}>{errors.buyer_name}</p>}
      </div>
      <div>
        <input
          type="email"
          value={form.buyer_email}
          onChange={(e) => setForm((f) => ({ ...f, buyer_email: e.target.value }))}
          placeholder="Email *"
          className={inputCls}
        />
        {errors.buyer_email && <p className={errCls}>{errors.buyer_email}</p>}
      </div>
      <div>
        <input
          type="tel"
          value={form.buyer_phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="+971 50 000 0000"
          className={inputCls}
        />
        {errors.buyer_phone && <p className={errCls}>{errors.buyer_phone}</p>}
      </div>
      <div>
        <textarea
          value={form.buyer_message}
          onChange={(e) => setForm((f) => ({ ...f, buyer_message: e.target.value }))}
          placeholder="Message (optional)"
          rows={3}
          className={`${inputCls} resize-none`}
        />
        {errors.buyer_message && <p className={errCls}>{errors.buyer_message}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
      >
        {pending ? "Sending..." : "Reveal owner contact"}
      </button>
    </form>
  );
}
