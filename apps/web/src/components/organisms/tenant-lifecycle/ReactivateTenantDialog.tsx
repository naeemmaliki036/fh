"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  reason_note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ReactivateTenantDialogProps {
  trigger: ReactNode;
  tenantName: string;
  onConfirm: (reason_note?: string) => void;
  isPending?: boolean;
}

export function ReactivateTenantDialog({
  trigger,
  tenantName,
  onConfirm,
  isPending,
}: ReactivateTenantDialogProps): ReactElement {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormValues): void {
    onConfirm(data.reason_note || undefined);
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate {tenantName}?</DialogTitle>
          <DialogDescription>
            This will restore access for all users on this tenant. You may optionally provide a
            note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reactivate-note">Note (optional)</Label>
            <textarea
              id="reactivate-note"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional note about reactivation..."
              {...register("reason_note")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Reactivating..." : "Reactivate tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
