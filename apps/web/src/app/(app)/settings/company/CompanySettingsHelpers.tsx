"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdatePropertyRefPrefix } from "@/hooks/mutations/useTenantMutations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATING_COUNTRIES } from "@/lib/constants/operating-countries";
import { cn } from "@/lib/utils/cn";

// ── Property Ref Prefix card ──────────────────────────────────────────────────
interface PropertyRefPrefixCardProps {
  tenantId: string;
  currentPrefix: string;
  canEdit: boolean;
}

export function PropertyRefPrefixCard({ tenantId, currentPrefix, canEdit }: PropertyRefPrefixCardProps): React.ReactElement {
  const { mutate, isPending } = useUpdatePropertyRefPrefix(tenantId);
  const { register, handleSubmit, formState: { errors } } = useForm<{ prefix: string }>({
    resolver: zodResolver(
      z.object({
        prefix: z
          .string()
          .length(3, "Must be exactly 3 characters")
          .regex(/^[A-Z0-9]{3}$/i, "A-Z or 0-9 only")
          .transform((v) => v.toUpperCase()),
      }),
    ),
    defaultValues: { prefix: currentPrefix ?? "" },
  });

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Property Reference Prefix</CardTitle>
        <CardDescription>
          Used as the prefix for all property reference numbers in this company (e.g. MAR for Marina Realty).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutate(d.prefix))} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              {...register("prefix")}
              disabled={!canEdit}
              maxLength={3}
              className="uppercase font-mono"
              placeholder="e.g. MAR"
            />
            {errors.prefix && <p className="text-xs text-destructive">{errors.prefix.message}</p>}
          </div>
          {canEdit && (
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ── Operating countries field ──────────────────────────────────────────────────
interface OperatingCountriesFieldProps {
  value: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
  error?: string;
}

export function OperatingCountriesField({ value, onChange, disabled, error }: OperatingCountriesFieldProps): React.ReactElement {
  function toggle(code: string): void {
    if (disabled) return;
    if (value.includes(code)) {
      onChange(value.filter((c) => c !== code));
    } else if (value.length < 20) {
      onChange([...value, code]);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Countries we operate in</Label>
      <p className="text-xs text-muted-foreground">Select 1–20 countries</p>
      <div className="flex flex-wrap gap-2">
        {OPERATING_COUNTRIES.map((c) => {
          const selected = value.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              disabled={disabled}
              onClick={() => toggle(c.code)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                selected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-input hover:bg-muted",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {c.label} ({c.code})
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
