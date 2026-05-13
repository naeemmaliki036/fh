"use client";

import { useState } from "react";
import { z } from "zod";
import { useCreatePublicLead } from "@/hooks/mutations/public-site/useCreatePublicLead";

interface ContactFormProps {
  slug: string;
  listingId?: string;
  compact?: boolean;
}

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^\+?[\d\s\-() ]{7,20}$/.test(v), "Invalid phone number"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(2000, "Message must be under 2000 characters"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

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

const errCls = "text-xs text-red-600 mt-1 px-1";

export function ContactForm({ slug, listingId, compact = false }: ContactFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [succeeded, setSucceeded] = useState(false);

  const { mutate, isPending } = useCreatePublicLead({
    slug,
    onSuccess: () => {
      setForm(INITIAL);
      setErrors({});
      setSucceeded(true);
      setTimeout(() => setSucceeded(false), 5000);
    },
  });

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const result = contactSchema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      message: form.message || (compact ? "" : [form.purpose && `Intent: ${form.purpose}`, form.area && `Area: ${form.area}`].filter(Boolean).join(" | ")),
    });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!validate()) return;
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

  if (succeeded) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-sm text-center space-y-4">
        <div className="text-4xl">&#10003;</div>
        <p className="text-lg font-bold text-slate-950">Message sent!</p>
        <p className="text-sm text-slate-600">We'll get back to you shortly.</p>
        <button
          type="button"
          onClick={() => setSucceeded(false)}
          className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 rounded-[2rem] bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Contact agent</h3>
        <div>
          <input value={form.name} onChange={set("name")} placeholder="Full name" className={fieldCls} />
          {errors.name && <p className={errCls}>{errors.name}</p>}
        </div>
        <div>
          <input type="email" value={form.email} onChange={set("email")} placeholder="Email" className={fieldCls} />
          {errors.email && <p className={errCls}>{errors.email}</p>}
        </div>
        <div>
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+971 50 000 0000" className={fieldCls} />
          {errors.phone && <p className={errCls}>{errors.phone}</p>}
        </div>
        <div>
          <textarea rows={3} value={form.message} onChange={set("message")} placeholder="Your message" className={`${fieldCls} resize-y`} />
          {errors.message && <p className={errCls}>{errors.message}</p>}
        </div>
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
      <div>
        <input value={form.name} onChange={set("name")} placeholder="Full name" className={fieldCls} />
        {errors.name && <p className={errCls}>{errors.name}</p>}
      </div>
      <div>
        <input type="tel" value={form.phone} onChange={set("phone")} placeholder="Phone / WhatsApp" className={fieldCls} />
        {errors.phone && <p className={errCls}>{errors.phone}</p>}
      </div>
      <div>
        <input type="email" value={form.email} onChange={set("email")} placeholder="Email address" className={fieldCls} />
        {errors.email && <p className={errCls}>{errors.email}</p>}
      </div>
      <select value={form.purpose} onChange={set("purpose")} className={fieldCls}>
        <option value="buy">I want to buy</option>
        <option value="rent">I want to rent</option>
        <option value="sell">I want to sell</option>
        <option value="list">I want to list a property</option>
      </select>
      <input value={form.area} onChange={set("area")} placeholder="Preferred area" className={fieldCls} />
      <div className="md:col-span-2">
        <textarea
          rows={4}
          value={form.message}
          onChange={set("message")}
          placeholder="Tell us your budget, timeline, and requirements"
          className={`${fieldCls} resize-y`}
        />
        {errors.message && <p className={errCls}>{errors.message}</p>}
      </div>
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
