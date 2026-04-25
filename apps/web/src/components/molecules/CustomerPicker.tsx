"use client";

import { useState } from "react";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerSummary } from "@/lib/types/lead";

interface CustomerPickerProps {
  value: CustomerSummary | null;
  onChange: (customer: CustomerSummary | null) => void;
}

export function CustomerPicker({ value, onChange }: CustomerPickerProps): React.ReactElement {
  const [q, setQ] = useState("");
  const { data } = useCustomers({ q: q || undefined, limit: 10 });
  const customers = data?.items ?? [];

  if (value) {
    return (
      <div className="rounded-md border p-3 bg-muted/30">
        <p className="text-sm font-medium">{value.full_name}</p>
        {value.phone && <p className="text-xs text-muted-foreground">{value.phone}</p>}
        <button
          type="button"
          className="text-xs text-primary mt-1 hover:underline"
          onClick={() => onChange(null)}
        >
          Change customer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>Search customer</Label>
      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Name, phone, or email…"
      />
      {q.length > 0 && (
        <div className="rounded-md border bg-background shadow-sm max-h-48 overflow-y-auto">
          {customers.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No customers found</p>
          )}
          {customers.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-0"
              onClick={() => {
                onChange({ id: c.id, full_name: c.full_name, email: c.email, phone: c.phone, phone_normalized: c.phone_normalized });
                setQ("");
              }}
            >
              <span className="font-medium">{c.full_name}</span>
              {c.phone && <span className="ml-2 text-xs text-muted-foreground">{c.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
