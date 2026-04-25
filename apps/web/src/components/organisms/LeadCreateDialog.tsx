"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerPicker } from "@/components/molecules/CustomerPicker";
import { LeadForm } from "@/components/molecules/LeadForm";
import { useCreateLead } from "@/hooks/mutations/useLeadMutations";
import type { CustomerSummary, LeadCreateRequest } from "@/lib/types/lead";
import type { CustomerSource } from "@/lib/types/customer";
import type { Agent } from "@/lib/types";

type Tab = "existing" | "new";

interface LeadCreateDialogProps {
  open: boolean;
  onClose: () => void;
  agents?: Agent[];
}

interface NewCustomerFields {
  full_name: string;
  phone: string;
  email: string;
  source: CustomerSource;
}

export function LeadCreateDialog({ open, onClose, agents }: LeadCreateDialogProps): React.ReactElement {
  const [tab, setTab] = useState<Tab>("existing");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [newCustomer, setNewCustomer] = useState<NewCustomerFields>({ full_name: "", phone: "", email: "", source: "manual" });
  const [conflictId, setConflictId] = useState<string | null>(null);

  const { mutate: create, isPending } = useCreateLead({
    onConflict: (existingCustomerId) => {
      setConflictId(existingCustomerId);
    },
    onSuccess: () => { handleClose(); },
  });

  const handleClose = (): void => {
    setSelectedCustomer(null);
    setConflictId(null);
    setTab("existing");
    onClose();
  };

  const handleExistingSubmit = (values: { source: string; assigned_agent_id?: string; notes?: string; next_action_at?: string }): void => {
    if (!selectedCustomer) return;
    create({
      customer_id: selectedCustomer.id,
      source: values.source as CustomerSource,
      assigned_agent_id: values.assigned_agent_id || null,
      notes: values.notes || null,
      next_action_at: values.next_action_at || null,
    } as LeadCreateRequest);
  };

  const handleNewSubmit = (values: { source: string; assigned_agent_id?: string; notes?: string; next_action_at?: string }): void => {
    if (!newCustomer.full_name) return;
    create({
      customer: {
        full_name: newCustomer.full_name,
        phone: newCustomer.phone || null,
        email: newCustomer.email || null,
        source: values.source as CustomerSource,
      },
      source: values.source as CustomerSource,
      assigned_agent_id: values.assigned_agent_id || null,
      notes: values.notes || null,
      next_action_at: values.next_action_at || null,
    } as LeadCreateRequest);
  };

  const switchToExistingWithConflict = (): void => {
    if (!conflictId) return;
    setSelectedCustomer({ id: conflictId, full_name: "Existing customer", email: null, phone: null, phone_normalized: null });
    setConflictId(null);
    setTab("existing");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>

        <div className="flex gap-2 border-b pb-2 mb-2">
          <Button variant={tab === "existing" ? "default" : "ghost"} size="sm" onClick={() => setTab("existing")}>Existing Customer</Button>
          <Button variant={tab === "new" ? "default" : "ghost"} size="sm" onClick={() => setTab("new")}>New Customer</Button>
        </div>

        {conflictId && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm space-y-2">
            <p className="font-medium text-yellow-900">A customer with this phone already exists</p>
            <Button size="sm" onClick={switchToExistingWithConflict}>Use existing customer</Button>
          </div>
        )}

        {tab === "existing" ? (
          <div className="space-y-4">
            <CustomerPicker value={selectedCustomer} onChange={setSelectedCustomer} />
            <LeadForm
              agents={agents}
              isPending={isPending}
              submitLabel="Create lead"
              customer={selectedCustomer}
              onSubmit={handleExistingSubmit}
              onCancel={handleClose}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name *</Label>
                <Input value={newCustomer.full_name} onChange={e => setNewCustomer(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <LeadForm
              agents={agents}
              isPending={isPending}
              submitLabel="Create lead"
              customer={newCustomer.full_name ? { id: "", full_name: newCustomer.full_name, email: null, phone: null, phone_normalized: null } : null}
              onSubmit={handleNewSubmit}
              onCancel={handleClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
