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
  reason_note: z.string().min(5, "Reason is required (min 5 chars)"),
});

type FormValues = z.infer<typeof schema>;

interface SuspendTenantDialogProps {
  trigger: ReactNode;
  tenantName: string;
  onConfirm: (reason_note: string) => void;
  isPending?: boolean;
}

export function SuspendTenantDialog({
  trigger,
  tenantName,
  onConfirm,
  isPending,
}: SuspendTenantDialogProps): ReactElement {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormValues): void {
    onConfirm(data.reason_note);
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {tenantName}?</DialogTitle>
          <DialogDescription>
            This will block all users from logging in. Existing sessions remain valid until they
            expire. Provide a reason.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">Reason</Label>
            <textarea
              id="suspend-reason"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Explain why this tenant is being suspended..."
              {...register("reason_note")}
            />
            {errors.reason_note && (
              <p className="text-xs text-destructive">{errors.reason_note.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Suspending..." : "Suspend tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
