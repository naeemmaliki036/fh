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
import type { Listing, ListingCreateRequest, ListingUpdateRequest, ListingPurpose, RentPeriod, ListingTier } from "@/lib/types/listing";

const PURPOSES: ListingPurpose[] = ["sale", "rent_short", "rent_long"];
const RENT_PERIODS: RentPeriod[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];
const TIERS: ListingTier[] = ["standard", "premium", "featured"];

const schema = z
  .object({
    title: z.string().min(2, "Title required"),
    purpose: z.enum(PURPOSES as [ListingPurpose, ...ListingPurpose[]]),
    price: z
      .string()
      .min(1, "Price required")
      .refine((s) => Number(s) > 0, "Must be a positive number"),
    currency: z.string().min(1),
    description: z.string().optional().nullable(),
    rent_period: z.enum(RENT_PERIODS as [RentPeriod, ...RentPeriod[]]).optional().nullable(),
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
  });

type FormValues = z.infer<typeof schema>;

interface ListingFormProps {
  defaultValues?: Partial<Listing>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: ListingCreateRequest | ListingUpdateRequest) => void;
  onCancel?: () => void;
}

export function ListingForm({ defaultValues, isPending, submitLabel, onSubmit, onCancel }: ListingFormProps): React.ReactElement {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      purpose: defaultValues?.purpose ?? "sale",
      price: defaultValues?.price ?? "",
      currency: defaultValues?.currency ?? "AED",
      description: defaultValues?.description ?? "",
      rent_period: defaultValues?.rent_period ?? null,
      listing_tier: defaultValues?.listing_tier ?? "standard",
      valid_from: defaultValues?.valid_from?.slice(0, 10) ?? null,
      valid_until: defaultValues?.valid_until?.slice(0, 10) ?? null,
    },
  });

  const purpose = useWatch({ control, name: "purpose" });
  const isRent = purpose === "rent_short" || purpose === "rent_long";

  const handleFormSubmit = (v: FormValues): void => {
    onSubmit({ ...v, rent_period: isRent ? (v.rent_period ?? null) : null });
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
        <div className="space-y-1.5"><Label htmlFor="form-price">Price</Label><Input id="form-price" {...register("price")} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
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
        <div className="space-y-1.5">
          <Label>Valid From</Label>
          <Input type="date" {...register("valid_from")} />
          <p className="text-xs text-muted-foreground mt-1">Leave blank for no expiry</p>
        </div>
        <div className="space-y-1.5">
          <Label>Valid Until</Label>
          <Input type="date" {...register("valid_until")} />
          <p className="text-xs text-muted-foreground mt-1">Leave blank for no expiry</p>
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
