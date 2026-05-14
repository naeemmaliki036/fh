"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useOffMarketReasons } from "@/hooks/queries/useOffMarketReasons";
import {
  useCreateOffMarketReason,
  useUpdateOffMarketReason,
  useDeleteOffMarketReason,
} from "@/hooks/mutations/useOffMarketReasonMutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import type { OffMarketReason } from "@/lib/types/off-market-reason";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

interface FormState {
  label: string;
  code: string;
  requires_note: boolean;
  ordering: string;
}

interface ReasonDialogProps {
  initial?: OffMarketReason;
  open: boolean;
  onClose: () => void;
}

function ReasonDialog({ initial, open, onClose }: ReasonDialogProps): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    label: initial?.label ?? "",
    code: initial?.code ?? "",
    requires_note: initial?.requires_note ?? false,
    ordering: String(initial?.ordering ?? 0),
  });
  const { mutate: create, isPending: creating } = useCreateOffMarketReason();
  const { mutate: update, isPending: updating } = useUpdateOffMarketReason(initial?.id ?? "");
  const isPending = creating || updating;

  const handleLabelChange = (v: string): void => {
    setForm((f) => ({ ...f, label: v, code: initial ? f.code : slugify(v) }));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.label.trim()) return;
    const payload = {
      label: form.label.trim(),
      code: form.code.trim(),
      requires_note: form.requires_note,
      ordering: parseInt(form.ordering, 10) || 0,
    };
    if (initial) {
      update({ label: payload.label, requires_note: payload.requires_note, ordering: payload.ordering }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit reason" : "Add off-market reason"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label *</Label>
            <Input value={form.label} onChange={(e) => handleLabelChange(e.target.value)} placeholder="e.g. Under renovation" />
          </div>
          <div className="space-y-1.5">
            <Label>Code (auto-generated)</Label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} disabled={!!initial} />
          </div>
          <div className="space-y-1.5">
            <Label>Ordering</Label>
            <Input type="number" value={form.ordering} onChange={(e) => setForm((f) => ({ ...f, ordering: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.requires_note} onChange={(e) => setForm((f) => ({ ...f, requires_note: e.target.checked }))} />
            Requires a note
          </label>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending || !form.label.trim()}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function OffMarketReasonsPage(): React.ReactElement {
  const { data: reasons, isLoading } = useOffMarketReasons();
  const { mutate: deleteReason } = useDeleteOffMarketReason();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<OffMarketReason | null>(null);

  const platform = (reasons ?? []).filter((r) => r.is_platform_default);
  const tenant = (reasons ?? []).filter((r) => !r.is_platform_default);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Off-Market Reasons</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage reasons shown when taking a property off market</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-1.5 h-4 w-4" />Add reason</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {platform.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Platform defaults (read-only)</p>
          <div className="rounded-md border divide-y">
            {platform.sort((a, b) => a.ordering - b.ordering).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
                </div>
                {r.requires_note && <span className="text-xs text-muted-foreground">Note required</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Your custom reasons</p>
        {tenant.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">No custom reasons yet</p>}
        {tenant.length > 0 && (
          <div className="rounded-md border divide-y">
            {tenant.sort((a, b) => a.ordering - b.ordering).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.requires_note && <span className="text-xs text-muted-foreground">Note required</span>}
                  <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                    title="Delete reason?"
                    description="This will remove the reason. Existing property records that reference it will retain the code."
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={() => deleteReason(r.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAdd && <ReasonDialog open onClose={() => setShowAdd(false)} />}
      {editing && <ReasonDialog initial={editing} open onClose={() => setEditing(null)} />}
    </div>
  );
}
