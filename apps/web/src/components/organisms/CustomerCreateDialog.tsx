"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/molecules/CustomerForm";
import { useCreateCustomer } from "@/hooks/mutations/useCustomerMutations";
import type { CustomerCreateRequest, CustomerUpdateRequest } from "@/lib/types";
import type { Agent } from "@/lib/types";

interface ConflictState {
  message: string;
  existingId: string;
}

interface CustomerCreateDialogProps {
  open: boolean;
  onClose: () => void;
  agents?: Agent[];
}

export function CustomerCreateDialog({ open, onClose, agents }: CustomerCreateDialogProps): React.ReactElement {
  const router = useRouter();
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const { mutate: create, isPending } = useCreateCustomer({
    onConflict: (existingId, message) => {
      setConflict({ existingId, message });
    },
  });

  const handleSubmit = (data: CustomerCreateRequest | CustomerUpdateRequest): void => {
    setConflict(null);
    create(data as CustomerCreateRequest, { onSuccess: onClose });
  };

  const handleOpenExisting = (): void => {
    if (!conflict) return;
    router.push(`/customers/${conflict.existingId}`);
    onClose();
  };

  const handleClose = (): void => {
    setConflict(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
        </DialogHeader>

        {conflict ? (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-warning bg-yellow-50 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-yellow-900">Customer already exists</p>
              <p className="text-yellow-800">{conflict.message}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="default" onClick={handleOpenExisting}>
                Open existing customer
              </Button>
              <Button variant="outline" onClick={() => setConflict(null)}>
                Edit details and retry
              </Button>
            </div>
          </div>
        ) : (
          <CustomerForm
            agents={agents}
            isPending={isPending}
            submitLabel="Create customer"
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
