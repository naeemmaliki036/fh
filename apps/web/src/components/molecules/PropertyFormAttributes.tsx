"use client";

import { type Control, Controller, type UseFormRegister, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FURNISHING_STATUSES, COMPLETION_STATUSES, OWNERSHIP_TYPES,
  VIEW_ORIENTATIONS, FLOOR_LEVELS, FIT_OUT_STATUSES, COMMERCIAL_TYPES, PLOT_TYPES,
} from "@/components/molecules/PropertyForm.config";
import type { PropertyFormValues } from "@/components/molecules/PropertyForm.config";

interface Props {
  control: Control<PropertyFormValues>;
  register: UseFormRegister<PropertyFormValues>;
}

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PropertyFormAttributes({ control, register }: Props): React.ReactElement {
  const propertyType = useWatch({ control, name: "property_type" });
  const completionStatus = useWatch({ control, name: "completion_status" });

  const isPlot = PLOT_TYPES.includes(propertyType);
  const isCommercial = COMMERCIAL_TYPES.includes(propertyType);
  const showOffPlan = completionStatus === "off_plan";

  return (
    <div className="space-y-3">
      {/* Status row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {!isPlot && (
          <div className="space-y-1">
            <Label>Furnishing</Label>
            <Controller name="furnishing_status" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {FURNISHING_STATUSES.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        )}

        <div className="space-y-1">
          <Label>Completion</Label>
          <Controller name="completion_status" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {COMPLETION_STATUSES.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>

        <div className="space-y-1">
          <Label>Ownership</Label>
          <Controller name="ownership_type" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {OWNERSHIP_TYPES.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      {/* Numeric row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Service charge (AED/sqft)</Label>
          <Input {...register("service_charge_aed_sqft")} placeholder="0.00" className="h-8 text-xs" />
        </div>

        <div className="space-y-1">
          <Label>Parking spaces</Label>
          <Input type="number" min="0" {...register("parking_spaces")} className="h-8 text-xs" />
        </div>

        {!isPlot && !isCommercial && (
          <div className="space-y-1">
            <Label>Floor level</Label>
            <Controller name="floor_level" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {FLOOR_LEVELS.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        )}

        <div className="space-y-1">
          <Label>View</Label>
          <Controller name="view_orientation" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {VIEW_ORIENTATIONS.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      {/* Plot-only row */}
      {isPlot && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Plot area (sqft)</Label>
            <Input type="number" min="0" {...register("plot_area_sqft")} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Commercial row */}
      {isCommercial && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Fit-out status</Label>
            <Controller name="fit_out_status" control={control} render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {FIT_OUT_STATUSES.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>Ceiling height (m)</Label>
            <Input {...register("ceiling_height_m")} placeholder="0.00" className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Off-plan row */}
      {showOffPlan && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label>Handover year</Label>
            <Input type="number" min="2000" max="2060" {...register("handover_year")} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label>Handover quarter (1-4)</Label>
            <Input type="number" min="1" max="4" {...register("handover_quarter")} className="h-8 text-xs" />
          </div>
          <div className="space-y-1 flex items-center gap-2 pt-5">
            <Controller name="payment_plan" control={control} render={({ field }) => (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Payment plan
              </label>
            )} />
          </div>
        </div>
      )}

      {/* RERA row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>RERA permit number</Label>
          <Input {...register("rera_permit_number")} className="h-8 text-xs" />
        </div>
      </div>
    </div>
  );
}
