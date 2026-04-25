"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerPicker } from "@/components/molecules/CustomerPicker";
import type { CustomerSummary } from "@/lib/types/lead";
import type { DocumentRequestCreate, DocumentRequestItemCreate } from "@/lib/types/document-request";
import type { PrivateDocumentKind } from "@/lib/types/private-document";

const KINDS: PrivateDocumentKind[] = ["rera_id","passport","emirates_id","trade_license","noc","contract","kyc","other"];
const KIND_LABELS: Record<PrivateDocumentKind, string> = {
  rera_id:"RERA ID", passport:"Passport", emirates_id:"Emirates ID",
  trade_license:"Trade License", noc:"NOC", contract:"Contract", kyc:"KYC", other:"Other",
};

interface DocRequestFormProps {
  isPending: boolean;
  onSubmit: (data: DocumentRequestCreate) => void;
  onCancel?: () => void;
}

export function DocRequestForm({ isPending, onSubmit, onCancel }: DocRequestFormProps): React.ReactElement {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [items, setItems] = useState<DocumentRequestItemCreate[]>([
    { kind: "kyc", label: "", is_required: true, ordering: 0 },
  ]);

  const addItem = (): void => {
    setItems(prev => [...prev, { kind: "kyc", label: "", is_required: true, ordering: prev.length }]);
  };

  const removeItem = (idx: number): void => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, ordering: i })));
  };

  const updateItem = (idx: number, patch: Partial<DocumentRequestItemCreate>): void => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!customer || !title.trim() || items.some(it => !it.label.trim())) return;
    onSubmit({
      customer_id: customer.id,
      title: title.trim(),
      instructions: instructions.trim() || null,
      items,
      expires_in_days: parseInt(expiresInDays, 10) || 7,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label>Customer *</Label>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Title *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. KYC Documents for Apartment 3B" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Instructions</Label>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            placeholder="Optional instructions for the customer" />
        </div>
        <div className="space-y-1.5">
          <Label>Expires in (days)</Label>
          <Input type="number" min={1} max={90} value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Requested Documents *</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add item
          </Button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center rounded-md border p-3">
            <Select value={item.kind} onValueChange={v => updateItem(idx, { kind: v as PrivateDocumentKind })}>
              <SelectTrigger className="w-36 flex-shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map(k => <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="flex-1" placeholder="Label, e.g. Passport copy" value={item.label}
              onChange={e => updateItem(idx, { label: e.target.value })} />
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input type="checkbox" checked={item.is_required} onChange={e => updateItem(idx, { is_required: e.target.checked })} />
              Required
            </label>
            {items.length > 1 && (
              <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isPending || !customer || !title.trim()}>
          {isPending ? "Creating…" : "Create & get code"}
        </Button>
      </div>
    </form>
  );
}
