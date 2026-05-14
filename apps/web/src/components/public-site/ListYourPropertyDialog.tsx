"use client";

import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ListYourPropertyForm } from "./ListYourPropertyForm";
import type { ListingIntent } from "./ListYourPropertyForm";

interface ListYourPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  initialIntent?: ListingIntent;
  /** ISO-3166-1 alpha-2 country codes from the tenant profile */
  operatingCountries?: string[];
}

const SUCCESS_CLOSE_DELAY_MS = 4000;

export function ListYourPropertyDialog({
  open,
  onOpenChange,
  slug,
  initialIntent = "sell",
  operatingCountries = [],
}: ListYourPropertyDialogProps): React.ReactElement {
  const [successName, setSuccessName] = useState<string | null>(null);

  // Auto-close after success delay
  useEffect(() => {
    if (!successName) return;
    const timer = setTimeout(() => {
      setSuccessName(null);
      onOpenChange(false);
    }, SUCCESS_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [successName, onOpenChange]);

  // Reset success state when dialog re-opens
  useEffect(() => {
    if (open) setSuccessName(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl p-0 shadow-2xl">
        {/* Welcome banner */}
        <div className="rounded-t-2xl bg-[hsl(var(--primary))]/8 px-6 pb-5 pt-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]/15">
            <Home className="h-5 w-5 text-[hsl(var(--primary))]" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-950">
              Let&apos;s get your property listed
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-600">
              Tell us a bit about your property and we&apos;ll take it from there. Our team will
              reach out within one business day to walk you through next steps.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4">
          {successName ? (
            <SuccessState name={successName} />
          ) : (
            <ListYourPropertyForm
              slug={slug}
              initialIntent={initialIntent}
              operatingCountries={operatingCountries}
              onSuccess={setSuccessName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuccessState({ name }: { name: string }): React.ReactElement {
  const firstName = name.split(" ")[0];
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <svg
          className="h-8 w-8 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-lg font-black text-slate-950">
        Thanks {firstName} &mdash; we&apos;ll reach out soon.
      </p>
      <p className="max-w-xs text-sm text-slate-500">
        Our team will review your details and contact you within one business day.
      </p>
    </div>
  );
}
