"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useOpenHouses } from "@/hooks/queries/useOpenHouses";
import {
  useCreateOpenHouse,
  useCancelOpenHouse,
} from "@/hooks/mutations/useOpenHouseMutations";
import type { OpenHouseCreate } from "@/lib/types/open-house";

interface OpenHousesPanelProps {
  listingId: string;
}

function formatDateRange(starts: string, ends: string): string {
  const s = new Date(starts);
  const e = new Date(ends);
  const date = s.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const start = s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const end = e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${start} – ${end}`;
}

const EMPTY_FORM: OpenHouseCreate = {
  starts_at: "",
  ends_at: "",
  capacity: null,
  notes: null,
};

export function OpenHousesPanel({ listingId }: OpenHousesPanelProps): React.ReactElement {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<OpenHouseCreate>(EMPTY_FORM);
  const [showPast, setShowPast] = useState(false);

  const { data, isLoading } = useOpenHouses(listingId, showPast);
  const { mutate: create, isPending: creating } = useCreateOpenHouse(listingId);
  const { mutate: cancel, isPending: cancelling } = useCancelOpenHouse(listingId);

  const items = data?.items ?? [];

  const handleCreate = (): void => {
    if (!form.starts_at || !form.ends_at) return;
    create(form, {
      onSuccess: () => {
        setShowDialog(false);
        setForm(EMPTY_FORM);
      },
    });
  };

  const set = (patch: Partial<OpenHouseCreate>): void =>
    setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Open Houses</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPast((p) => !p)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {showPast ? "Hide past" : "Show past"}
          </button>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            Add open house
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          No open houses scheduled.
        </div>
      )}

      <div className="space-y-2">
        {items.map((oh) => (
          <div
            key={oh.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {formatDateRange(oh.starts_at, oh.ends_at)}
                </p>
                {oh.capacity != null && (
                  <p className="text-xs text-muted-foreground">
                    Capacity: {oh.capacity}
                  </p>
                )}
                {oh.notes && (
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {oh.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge
                variant={oh.status === "scheduled" ? "default" : "secondary"}
                className="text-xs capitalize"
              >
                {oh.status}
              </Badge>
              {oh.status === "scheduled" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={cancelling}
                  title="Cancel open house"
                  onClick={() => cancel({ id: oh.id })}
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Open House</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Start date &amp; time</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set({ starts_at: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End date &amp; time</Label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set({ ends_at: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity (optional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 20"
                value={form.capacity ?? ""}
                onChange={(e) =>
                  set({ capacity: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any instructions..."
                value={form.notes ?? ""}
                onChange={(e) => set({ notes: e.target.value || null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={creating || !form.starts_at || !form.ends_at}
              onClick={handleCreate}
            >
              {creating ? "Saving..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
