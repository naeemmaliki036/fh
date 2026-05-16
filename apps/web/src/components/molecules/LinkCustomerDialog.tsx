"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CustomerPicker } from "@/components/molecules/CustomerPicker";
import type { CustomerSummary } from "@/lib/types/lead";

interface LinkCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (customerId: string, notes: string | null) => void;
}

export function LinkCustomerDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: LinkCustomerDialogProps): React.ReactElement {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [notes, setNotes] = useState("");

  const handleClose = (v: boolean): void => {
    if (!v) {
      setCustomer(null);
      setNotes("");
    }
    onOpenChange(v);
  };

  const handleSubmit = (): void => {
    if (!customer) return;
    onConfirm(customer.id, notes.trim() || null);
    setCustomer(null);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Link customer to listing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <CustomerPicker value={customer} onChange={setCustomer} />
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Any notes about this interest…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button disabled={!customer || isPending} onClick={handleSubmit}>
            {isPending ? "Linking…" : "Link customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
