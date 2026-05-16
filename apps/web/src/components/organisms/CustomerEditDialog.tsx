"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/molecules/CustomerForm";
import { useUpdateCustomer } from "@/hooks/mutations/useCustomerMutations";
import { useAgents } from "@/hooks/queries/useAgents";
import type { CustomerDetail } from "@/lib/types/customer";
import type { CustomerUpdateRequest, CustomerCreateRequest } from "@/lib/types";

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerDetail;
}

export function CustomerEditDialog({
  open,
  onOpenChange,
  customer,
}: CustomerEditDialogProps): React.ReactElement {
  const { data: agentsData } = useAgents();
  const { mutate: update, isPending } = useUpdateCustomer(customer.id);
  const agents = agentsData?.items ?? [];

  const handleSubmit = (data: CustomerCreateRequest | CustomerUpdateRequest): void => {
    update(data as CustomerUpdateRequest, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          defaultValues={customer}
          agents={agents}
          isPending={isPending}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
