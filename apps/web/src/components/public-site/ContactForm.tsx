"use client";

import { useState } from "react";
import { useCreatePublicLead } from "@/hooks/mutations/public-site/useCreatePublicLead";

interface ContactFormProps {
  slug: string;
  listingId?: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const INITIAL: FormState = { name: "", email: "", phone: "", message: "" };

export function ContactForm({ slug, listingId }: ContactFormProps): React.ReactElement {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useCreatePublicLead({
    slug,
    onSuccess: () => {
      setSubmitted(true);
      setForm(INITIAL);
    },
  });

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    mutate({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      message: form.message || null,
      listing_id: listingId ?? null,
    });
  };

  if (submitted) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-2">
        <p className="text-base font-semibold">Thank you!</p>
        <p className="text-sm text-muted-foreground">
          Your message has been sent. An agent will contact you shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
    >
      <h3 className="text-base font-semibold">Contact Agent</h3>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
        <input
          required
          value={form.name}
          onChange={set("name")}
          placeholder="Your name"
          className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Email *</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
          className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Phone</label>
        <input
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          placeholder="+971 50 000 0000"
          className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Message</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={set("message")}
          placeholder="I'm interested in this property..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
