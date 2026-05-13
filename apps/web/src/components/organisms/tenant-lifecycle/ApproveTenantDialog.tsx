"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ApproveTenantDialogProps {
  trigger: ReactNode;
  tenantName: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function ApproveTenantDialog({
  trigger,
  tenantName,
  onConfirm,
  isPending,
}: ApproveTenantDialogProps): ReactElement {
  const [open, setOpen] = useState(false);

  function handleConfirm(): void {
    onConfirm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve {tenantName}?</DialogTitle>
          <DialogDescription>
            This will activate the tenant account and allow all users to log in immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Approving..." : "Approve tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
