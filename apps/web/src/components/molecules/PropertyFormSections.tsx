"use client";

import { useState } from "react";
import { Controller, type Control, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagsInput } from "@/components/molecules/TagsInput";
import { LocationPicker } from "@/components/molecules/LocationPicker";
import { CURRENCIES } from "@/lib/constants/regions";
import { TYPES, STATUSES, type PropertyFormValues } from "@/components/molecules/PropertyForm.config";

export function SectionHeader({ label }: { label: string }): React.ReactElement {
  return <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</h3>;
}
export function Divider(): React.ReactElement {
  return <div className="border-t pt-4" />;
}

// ── Basic info ────────────────────────────────────────────────────────────────
interface BasicInfoProps {
  register: UseFormRegister<PropertyFormValues>;
  control: Control<PropertyFormValues>;
  showStatus?: boolean;
  titleError?: string;
  refError?: string;
  currentRef?: string | null;
}
export function BasicInfoSection({ register, control, showStatus, titleError, refError, currentRef }: BasicInfoProps): React.ReactElement {
  const [editRef, setEditRef] = useState(false);
  return (
    <div className="space-y-1.5">
      <SectionHeader label="Basic info" />
      {currentRef && !editRef && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs">
          <span className="font-mono text-foreground">{currentRef}</span>
          <button type="button" onClick={() => setEditRef(true)} className="ml-auto text-xs text-primary underline-offset-2 hover:underline">Edit ref</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label htmlFor="form-title">Title *</Label>
          <Input id="form-title" {...register("title")} />
          {titleError && <p className="text-xs text-destructive">{titleError}</p>}
        </div>
        <div className="space-y-1">
          <Label>Type *</Label>
          <Controller name="property_type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
        {showStatus && (
          <div className="space-y-1">
            <Label>Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
        )}
        {(!currentRef || editRef) && (
          <div className="space-y-1">
            <Label>Internal Ref <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input {...register("internal_reference")} placeholder="e.g. MAR-AP-000001" />
            <p className="text-[10px] text-muted-foreground">Auto-generated when blank. Format: PREFIX-TT-XXXXXX.</p>
            {refError && <p className="text-xs text-destructive">{refError}</p>}
          </div>
        )}
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label>Tags <span className="text-xs text-muted-foreground">(max 5)</span></Label>
          <Controller name="tags" control={control} render={({ field }) => (
            <TagsInput value={field.value ?? []} onChange={field.onChange} />
          )} />
        </div>
      </div>
    </div>
  );
}

// ── Location ──────────────────────────────────────────────────────────────────
interface LocationProps {
  register: UseFormRegister<PropertyFormValues>;
  control: Control<PropertyFormValues>;
  setValue: UseFormSetValue<PropertyFormValues>;
}
export function LocationSection({ register, control, setValue }: LocationProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <SectionHeader label="Location" />
      <Controller
        name="country"
        control={control}
        render={({ field: countryField }) => (
          <Controller
            name="city"
            control={control}
            render={({ field: cityField }) => (
              <Controller
                name="area"
                control={control}
                render={({ field: areaField }) => (
                  <LocationPicker
                    country={countryField.value ?? null}
                    city={cityField.value ?? null}
                    area={areaField.value ?? null}
                    onChange={({ country: c, city: ci, area: a }) => {
                      countryField.onChange(c ?? "");
                      cityField.onChange(ci ?? "");
                      areaField.onChange(a ?? "");
                      if (c !== countryField.value) {
                        setValue("city", "");
                        setValue("area", "");
                      } else if (ci !== cityField.value) {
                        setValue("area", "");
                      }
                    }}
                    layout="grid"
                  />
                )}
              />
            )}
          />
        )}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label>Address <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input {...register("address_line")} />
        </div>
        <div className="space-y-1">
          <Label>Latitude <span className="text-xs text-muted-foreground">(-90..90)</span></Label>
          <Input type="number" step="0.000001" {...register("latitude")} placeholder="e.g. 25.204849" />
        </div>
        <div className="space-y-1">
          <Label>Longitude <span className="text-xs text-muted-foreground">(-180..180)</span></Label>
          <Input type="number" step="0.000001" {...register("longitude")} placeholder="e.g. 55.270782" />
        </div>
        <p className="col-span-2 md:col-span-3 text-[10px] text-muted-foreground">Drop a pin manually for now — map picker coming later.</p>
      </div>
    </div>
  );
}

// ── Property details ──────────────────────────────────────────────────────────
interface PropertyDetailsSectionProps {
  register: UseFormRegister<PropertyFormValues>;
  showBedrooms: boolean;
  showBathrooms: boolean;
  isPlot: boolean;
  sizeError?: string;
  buildYearError?: string;
}
export function PropertyDetailsSection({ register, showBedrooms, showBathrooms, isPlot, sizeError, buildYearError }: PropertyDetailsSectionProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <SectionHeader label="Property details" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {showBedrooms && <div className="space-y-1"><Label>Bedrooms <span className="text-xs text-muted-foreground">(optional)</span></Label><Input type="number" min={0} max={50} {...register("bedrooms")} /></div>}
        {showBathrooms && <div className="space-y-1"><Label>Bathrooms <span className="text-xs text-muted-foreground">(optional)</span></Label><Input type="number" min={0} max={50} {...register("bathrooms")} /></div>}
        <div className="space-y-1">
          <Label>{isPlot ? "Plot area (sqft)" : "Size (sqft)"} <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input {...register("size_sqft")} />
          {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}
        </div>
        <div className="space-y-1">
          <Label>Build Year <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input type="number" min="1900" step="1" {...register("build_year")} placeholder="e.g. 2018" />
          {buildYearError && <p className="text-xs text-destructive">{buildYearError}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
interface PricingSectionProps {
  register: UseFormRegister<PropertyFormValues>;
  control: Control<PropertyFormValues>;
  priceError?: string;
}
export function PricingSection({ register, control, priceError }: PricingSectionProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <SectionHeader label="Pricing" />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Price <span className="text-xs text-muted-foreground">(whole number)</span></Label>
          <Input type="number" min="0" step="1" inputMode="numeric" {...register("price")} />
          {priceError && <p className="text-xs text-destructive">{priceError}</p>}
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Controller name="currency" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
      </div>
    </div>
  );
}
