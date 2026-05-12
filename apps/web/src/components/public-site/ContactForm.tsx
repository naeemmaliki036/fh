"use client";

import { useState } from "react";
import { useCreatePublicLead } from "@/hooks/mutations/public-site/useCreatePublicLead";

interface ContactFormProps {
  slug: string;
  listingId?: string;
  compact?: boolean;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  purpose: string;
  area: string;
  message: string;
}

const INITIAL: FormState = { name: "", phone: "", email: "", purpose: "buy", area: "", message: "" };

const fieldCls =
  "w-full rounded-2xl bg-slate-50 px-4 py-4 text-slate-950 outline-none border-0 focus:ring-2 focus:ring-slate-950/20";

export function ContactForm({ slug, listingId, compact = false }: ContactFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(INITIAL);

  const { mutate, isPending } = useCreatePublicLead({
    slug,
    onSuccess: () => setForm(INITIAL),
  });

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      message: [form.purpose && `Intent: ${form.purpose}`, form.area && `Area: ${form.area}`, form.message]
        .filter(Boolean)
        .join(" | ") || null,
      listing_id: listingId ?? null,
    });
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 rounded-[2rem] bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Contact agent</h3>
        <input required value={form.name} onChange={set("name")} placeholder="Full name" className={fieldCls} />
        <input required type="email" value={form.email} onChange={set("email")} placeholder="Email" className={fieldCls} />
        <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+971 50 000 0000" className={fieldCls} />
        <textarea
          rows={3}
          value={form.message}
          onChange={set("message")}
          placeholder="Your message"
          className={`${fieldCls} resize-y`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send message"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <input required value={form.name} onChange={set("name")} placeholder="Full name" className={fieldCls} />
      <input type="tel" value={form.phone} onChange={set("phone")} placeholder="Phone / WhatsApp" className={fieldCls} />
      <input required type="email" value={form.email} onChange={set("email")} placeholder="Email address" className={fieldCls} />
      <select value={form.purpose} onChange={set("purpose")} className={fieldCls}>
        <option value="buy">I want to buy</option>
        <option value="rent">I want to rent</option>
        <option value="sell">I want to sell</option>
        <option value="list">I want to list a property</option>
      </select>
      <input value={form.area} onChange={set("area")} placeholder="Preferred area" className={fieldCls} />
      <textarea
        rows={4}
        value={form.message}
        onChange={set("message")}
        placeholder="Tell us your budget, timeline, and requirements"
        className={`${fieldCls} resize-y md:col-span-2`}
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60 md:col-span-2"
      >
        {isPending ? "Sending…" : "Submit enquiry"}
      </button>
    </form>
  );
}
