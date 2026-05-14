"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATALOG } from "./catalogItems";
import type { WizardItem } from "./wizardTypes";

interface WizardStep3Props {
  items: WizardItem[];
  onChange: (items: WizardItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function makeKey(kind: string, label: string): string {
  return `${kind}__${label}`;
}

export function WizardStep3Items({ items, onChange, onNext, onBack }: WizardStep3Props): React.ReactElement {
  const [customLabel, setCustomLabel] = useState("");

  const selectedKeys = new Set(items.map((it) => makeKey(it.kind, it.label)));

  const toggle = (kind: string, label: string): void => {
    const key = makeKey(kind, label);
    if (selectedKeys.has(key)) {
      onChange(items.filter((it) => makeKey(it.kind, it.label) !== key).map((it, i) => ({ ...it, ordering: i })));
    } else {
      onChange([...items, { kind, label, is_required: true, ordering: items.length }]);
    }
  };

  const addCustom = (): void => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;
    onChange([...items, { kind: "other", label: trimmed, is_required: false, ordering: items.length }]);
    setCustomLabel("");
  };

  const removeCustom = (idx: number): void => {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, ordering: i })));
  };

  const customItems = items.filter(
    (it) => !CATALOG.some((g) => g.items.some((ci) => makeKey(ci.kind, ci.label) === makeKey(it.kind, it.label))),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 3 — Documents to Request</h2>
        <p className="text-sm text-muted-foreground mt-1">Select the documents you need from the customer</p>
      </div>

      <div className="space-y-4">
        {CATALOG.map((group) => (
          <div key={group.group} className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{group.group}</p>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((ci) => {
                const key = makeKey(ci.kind, ci.label);
                const checked = selectedKeys.has(key);
                return (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/30">
                    <input type="checkbox" checked={checked} onChange={() => toggle(ci.kind, ci.label)} className="accent-primary" />
                    {ci.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Custom</p>
          {customItems.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="flex-1 text-sm">{it.label}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeCustom(items.indexOf(it))}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Custom document name…"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addCustom} disabled={!customLabel.trim()}>
              <Plus className="h-4 w-4 mr-1" />Add
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{items.length} document(s) selected</p>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={items.length === 0}>Continue</Button>
      </div>
    </div>
  );
}
