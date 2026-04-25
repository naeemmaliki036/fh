"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomerSummary } from "@/lib/types/lead";
import type { CustomerSource } from "@/lib/types/customer";
import type { Agent } from "@/lib/types";

const SOURCES: CustomerSource[] = ["manual","portal","website","referral","walk_in","import","other"];
const SOURCE_VALUES = SOURCES as [CustomerSource, ...CustomerSource[]];

const schema = z.object({
  source: z.enum(SOURCE_VALUES),
  assigned_agent_id: z.string().optional(),
  notes: z.string().optional(),
  next_action_at: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface LeadFormProps {
  agents?: Agent[];
  isPending: boolean;
  submitLabel: string;
  customer: CustomerSummary | null;
  onSubmit: (values: FormValues) => void;
  onCancel?: () => void;
}

export function LeadForm({ agents, isPending, submitLabel, customer, onSubmit, onCancel }: LeadFormProps): React.ReactElement {
  const { register, handleSubmit, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { source: "manual" },
  });

  const canSubmit = !!customer;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Controller name="source" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Assign Agent</Label>
          <Controller name="assigned_agent_id" control={control} render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="No agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No agent</SelectItem>
                {(agents ?? []).map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Next Action</Label>
          <Input type="datetime-local" {...register("next_action_at")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <textarea {...register("notes")} rows={2} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isPending || !canSubmit}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
