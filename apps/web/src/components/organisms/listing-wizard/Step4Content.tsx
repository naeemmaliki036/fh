"use client";

import { Controller } from "react-hook-form";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TagsInput } from "@/components/molecules/TagsInput";
import type { WizardFormValues } from "./wizard-schema";

interface Step4ContentProps {
  control: Control<WizardFormValues>;
  register: UseFormRegister<WizardFormValues>;
  errors: FieldErrors<WizardFormValues>;
  disabled?: boolean;
}

export function Step4Content({ control, register, errors, disabled }: Step4ContentProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Content</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Write the listing title, description, and tags.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-title">Title</Label>
          <Input
            id="wizard-title"
            {...register("title")}
            disabled={disabled}
            placeholder="e.g. Spacious 2BR in Downtown Dubai"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wizard-description">Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                id="wizard-description"
                rows={10}
                disabled={disabled}
                placeholder="Write a compelling description of the property..."
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 resize-y"
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Tags</Label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <fieldset disabled={disabled}>
                <TagsInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </fieldset>
            )}
          />
        </div>
      </div>
    </div>
  );
}
