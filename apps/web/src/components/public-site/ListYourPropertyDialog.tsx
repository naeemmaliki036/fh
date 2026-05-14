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
      <DialogContent className="w-full max-w-3xl rounded-2xl p-0 shadow-2xl">
        {/* Compact welcome banner — amber accent on icon */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-amber-50 px-5 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 ring-1 ring-amber-200">
            <Home className="h-4 w-4 text-amber-600" />
          </div>
          <DialogHeader className="flex-1 space-y-0">
            <DialogTitle className="text-base font-black text-slate-950">
              Let&apos;s get your property listed
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              We&apos;ll reach out within one business day.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 pt-3">
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
