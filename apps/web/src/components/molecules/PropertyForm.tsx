"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, COUNTRIES } from "@/lib/constants/regions";
import type { Property, PropertyCreateRequest, PropertyUpdateRequest, PropertyType, PropertyStatus } from "@/lib/types/property";

const TYPES: PropertyType[] = ["apartment","villa","townhouse","penthouse","office","retail","warehouse","plot","building","other"];
const STATUSES: PropertyStatus[] = ["draft","available","reserved","sold","rented","off_market"];

const schema = z.object({
  title: z.string().min(2, "Title required"),
  property_type: z.enum(TYPES as [PropertyType, ...PropertyType[]]),
  description: z.string().optional(),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  size_sqft: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  address_line: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  internal_reference: z.string().optional().nullable(),
  status: z.enum(STATUSES as [PropertyStatus, ...PropertyStatus[]]).optional(),
});

type FormValues = z.infer<typeof schema>;

interface PropertyFormProps {
  defaultValues?: Partial<Property>;
  showStatus?: boolean;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (data: PropertyCreateRequest | PropertyUpdateRequest) => void;
  onCancel?: () => void;
}

export function PropertyForm({ defaultValues, showStatus, isPending, submitLabel, onSubmit, onCancel }: PropertyFormProps): React.ReactElement {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      property_type: defaultValues?.property_type ?? "apartment",
      description: defaultValues?.description ?? "",
      bedrooms: defaultValues?.bedrooms ?? null,
      bathrooms: defaultValues?.bathrooms ?? null,
      size_sqft: defaultValues?.size_sqft ?? "",
      price: defaultValues?.price ?? "",
      currency: defaultValues?.currency ?? "AED",
      address_line: defaultValues?.address_line ?? "",
      city: defaultValues?.city ?? "",
      area: defaultValues?.area ?? "",
      country: defaultValues?.country ?? "AE",
      internal_reference: defaultValues?.internal_reference ?? "",
      status: defaultValues?.status,
    },
  });

  const handleFormSubmit = (v: FormValues): void => {
    onSubmit({ ...v, bedrooms: v.bedrooms ?? null, bathrooms: v.bathrooms ?? null });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Title</Label>
          <Input {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Controller name="property_type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        {showStatus && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        )}
        <div className="space-y-1.5"><Label>Bedrooms</Label><Input type="number" {...register("bedrooms")} /></div>
        <div className="space-y-1.5"><Label>Bathrooms</Label><Input type="number" {...register("bathrooms")} /></div>
        <div className="space-y-1.5"><Label>Size (sqft)</Label><Input {...register("size_sqft")} /></div>
        <div className="space-y-1.5"><Label>Price</Label><Input {...register("price")} /></div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Controller name="currency" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5"><Label>Internal Ref</Label><Input {...register("internal_reference")} /></div>
        <div className="space-y-1.5"><Label>Address</Label><Input {...register("address_line")} /></div>
        <div className="space-y-1.5"><Label>City</Label><Input {...register("city")} /></div>
        <div className="space-y-1.5"><Label>Area</Label><Input {...register("area")} /></div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Controller name="country" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Description</Label>
          <textarea {...register("description")} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
