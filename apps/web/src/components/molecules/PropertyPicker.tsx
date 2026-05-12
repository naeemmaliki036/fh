"use client";

import { useState, useEffect } from "react";
import { useProperties } from "@/hooks/queries/useProperties";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Property } from "@/lib/types";

interface PropertyPickerProps {
  value: string | null;
  onChange: (propertyId: string | null) => void;
}

export function PropertyPicker({ value, onChange }: PropertyPickerProps): React.ReactElement {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const { data } = useProperties({ q: debouncedQ || undefined });
  const properties = data?.items ?? [];
  const selected = properties.find((p) => p.id === value) ?? null;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  if (selected) {
    return (
      <div className="rounded-md border p-3 bg-muted/30">
        <p className="text-sm font-medium">{selected.title}</p>
        {selected.city && (
          <p className="text-xs text-muted-foreground">{selected.city}</p>
        )}
        <button
          type="button"
          className="text-xs text-primary mt-1 hover:underline"
          onClick={() => { onChange(null); setQ(""); }}
        >
          Change property
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>Search property</Label>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Title, city, or reference…"
      />
      {q.length > 0 && (
        <div className="rounded-md border bg-background shadow-sm max-h-48 overflow-y-auto">
          {properties.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No properties found</p>
          )}
          {properties.map((p: Property) => (
            <button
              key={p.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-0"
              onClick={() => { onChange(p.id); setQ(""); }}
            >
              <span className="font-medium">{p.title}</span>
              {p.city && (
                <span className="ml-2 text-xs text-muted-foreground">{p.city}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
