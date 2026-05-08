"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_PLATFORM_CONTACT_EMAIL ?? "support@fh-platform.com";
const CONTACT_PHONE =
  process.env.NEXT_PUBLIC_PLATFORM_CONTACT_PHONE ?? "+971 4 000 0000";

interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

function ContactForm(): React.ReactElement {
  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // TODO: Wire to POST /public/contact-message when backend endpoint is ready.
    // The endpoint does not exist yet — submit is intentionally disabled.
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          name="name"
          placeholder="Your name"
          value={values.name}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email-field">Email</Label>
        <Input
          id="contact-email-field"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          placeholder="Describe your issue…"
          value={values.message}
          onChange={handleChange}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <Button type="submit" className="w-full" disabled>
        Coming soon
      </Button>
    </form>
  );
}

export default function ContactPage(): React.ReactElement {
  return (
    <div className="space-y-6 mt-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact Platform</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reach out to the platform team through any of the channels below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phone</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            {CONTACT_PHONE}
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send a message</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
