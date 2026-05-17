"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/constants/regions";
import { Textarea } from "@/components/atoms/Textarea";
import { PriceHint } from "@/components/molecules/PriceHint";
import type { Listing, ListingCreateRequest, ListingUpdateRequest, ListingPurpose, RentPeriod, ListingTier, RentChequeCount } from "@/lib/types/listing";

const PURPOSES: ListingPurpose[] = ["sale", "rent_short", "rent_long"];
const RENT_PERIODS: RentPeriod[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const TIERS: ListingTier[] = ["standard", "premium", "featured"];
const CHEQUE_COUNTS: RentChequeCount[] = [1, 2, 4, 6, 12];

const schema = z
  .object({
    title: z.string().min(2, "Title required"),
    short_description: z.string().max(250).optional().nullable(),
    purpose: z.enum(PURPOSES as [ListingPurpose, ...ListingPurpose[]]),
    price: z
      .string()
      .min(1, "Price required")
      .refine((s) => Number(s) > 0, "Must be a positive number"),
    currency: z.string().min(1),
    description: z.string().optional().nullable(),
    rent_period: z.enum(RENT_PERIODS as [RentPeriod, ...RentPeriod[]]).optional().nullable(),
    rent_cheque_count: z.coerce.number().refine((v) => CHEQUE_COUNTS.includes(v as RentChequeCount)).optional().nullable(),
    trakheesi_permit: z.string().max(64).optional().nullable(),
    listing_tier: z.enum(TIERS as [ListingTier, ...ListingTier[]]).optional(),
    valid_from: z.string().optional().nullable(),
    valid_until: z.string().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.valid_from && v.valid_until && v.valid_until < v.valid_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valid_until"],
        message: "Must be on or after start date",
      });
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (v.valid_from && v.valid_from < todayIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valid_from"],
        message: "Valid From cannot be in the past",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface ListingFormProps {
  defaultValues?: Partial<Listing>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: ListingCreateRequest | ListingUpdateRequest) => void;
  onCancel?: () => void;
  /** Inline price error from a backend 422 (string detail). Cleared on next submit. */
  priceApiError?: string | null;
}

export function ListingForm({ defaultValues, isPending, submitLabel, onSubmit, onCancel, priceApiError }: ListingFormProps): React.ReactElement {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      short_description: defaultValues?.short_description ?? null,
      purpose: defaultValues?.purpose ?? "sale",
      price: defaultValues?.price ?? "",
      currency: defaultValues?.currency ?? "AED",
      description: defaultValues?.description ?? "",
      rent_period: defaultValues?.rent_period ?? null,
      rent_cheque_count: defaultValues?.rent_cheque_count ?? null,
      trakheesi_permit: defaultValues?.trakheesi_permit ?? null,
      listing_tier: defaultValues?.listing_tier ?? "standard",
      valid_from: defaultValues?.valid_from?.slice(0, 10) ?? null,
      valid_until: defaultValues?.valid_until?.slice(0, 10) ?? null,
    },
  });
  const shortDescLen = (watch("short_description") ?? "").length;

  const purpose = useWatch({ control, name: "purpose" });
  const isRent = purpose === "rent_short" || purpose === "rent_long";
  const isRentLong = purpose === "rent_long";
  const isRentShort = purpose === "rent_short";

  const handleFormSubmit = (v: FormValues): void => {
    onSubmit({
      ...v,
      rent_period: isRent ? (v.rent_period ?? null) : null,
      rent_cheque_count: isRentLong ? ((v.rent_cheque_count ?? null) as RentChequeCount | null) : null,
      trakheesi_permit: isRentShort ? (v.trakheesi_permit ?? null) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2"><Label htmlFor="form-title">Title</Label><Input id="form-title" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Purpose</Label>
          <Controller name="purpose" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Tier</Label>
          <Controller name="listing_tier" control={control} render={({ field }) => (
            <Select value={field.value ?? "standard"} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5"><Label htmlFor="form-price">Price</Label>
          <Input
            id="form-price"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 1500000"
            {...register("price")}
            onInput={(e) => {
              const t = e.currentTarget;
              const cleaned = t.value.replace(/[^0-9]/g, "");
              if (t.value !== cleaned) t.value = cleaned;
            }}
          />
          <PriceHint value={watch("price")} currency={watch("currency")} />
          {(errors.price || priceApiError) && (
            <p className="text-xs text-destructive">{errors.price?.message ?? priceApiError}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Controller name="currency" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        {isRent && (
          <div className="space-y-1.5 col-span-2">
            <Label>Rent Period</Label>
            <Controller name="rent_period" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                <SelectContent>{RENT_PERIODS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        )}
        {isRentLong && (
          <div className="space-y-1.5">
            <Label>Cheques <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Controller name="rent_cheque_count" control={control} render={({ field }) => (
              <Select value={field.value != null ? String(field.value) : ""} onValueChange={(v) => field.onChange(v ? Number(v) : null)}>
                <SelectTrigger><SelectValue placeholder="No. of cheques" /></SelectTrigger>
                <SelectContent>{CHEQUE_COUNTS.map(n => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "cheque" : "cheques"}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        )}
        {isRentShort && (
          <div className="space-y-1.5 col-span-2">
            <Label>Trakheesi Permit <span className="text-xs text-muted-foreground">(optional, max 64 chars)</span></Label>
            <Input {...register("trakheesi_permit")} maxLength={64} placeholder="e.g. DTCM-12345" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Valid From</Label>
          <Input type="date" min={new Date().toISOString().slice(0, 10)} {...register("valid_from")} />
          {errors.valid_from && (
            <p className="text-xs text-destructive">{errors.valid_from.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Today or later. Leave blank to start immediately.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Valid Until</Label>
          <Input type="date" min={new Date().toISOString().slice(0, 10)} {...register("valid_until")} />
          {errors.valid_until && (
            <p className="text-xs text-destructive">{errors.valid_until.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Leave blank for no expiry</p>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="form-short-description">Short description</Label>
          <Input
            id="form-short-description"
            {...register("short_description")}
            maxLength={250}
            placeholder="Brief headline shown on the public listing page (max 250 chars)"
          />
          <p className="text-xs text-muted-foreground text-right">{shortDescLen}/250</p>
          {errors.short_description && (
            <p className="text-xs text-destructive">{errors.short_description.message}</p>
          )}
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description</Label>
          <Textarea {...register("description")} rows={2} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
