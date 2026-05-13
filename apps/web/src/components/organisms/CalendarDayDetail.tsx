"use client";

import Link from "next/link";
import { ExternalLink, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeadStageBadge } from "@/components/atoms/LeadStageBadge";
import { useUpdateLead } from "@/hooks/mutations/useLeadMutations";
import type { Lead } from "@/lib/types/lead";

interface RescheduleRowProps {
  lead: Lead;
}

function RescheduleRow({ lead }: RescheduleRowProps): React.ReactElement {
  const { mutate: update, isPending } = useUpdateLead(lead.id);

  function handleReschedule(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    update({ next_action_at: tomorrow.toISOString() });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {lead.customer?.full_name ?? "Unknown customer"}
          </p>
          <LeadStageBadge stage={lead.stage} />
        </div>
        {lead.customer?.email && (
          <p className="truncate text-xs text-muted-foreground">{lead.customer.email}</p>
        )}
        {lead.notes && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{lead.notes}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleReschedule}
          className="h-7 text-xs"
          title="Reschedule to tomorrow 9am"
        >
          <Calendar className="mr-1 h-3 w-3" />
          Tomorrow
        </Button>
        <Link
          href={`/leads/${lead.id}`}
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </Link>
      </div>
    </div>
  );
}

interface CalendarDayDetailProps {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  leads: Lead[];
}

function formatHeading(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CalendarDayDetail({
  open,
  onClose,
  date,
  leads,
}: CalendarDayDetailProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {date ? formatHeading(date) : "Follow-ups"}
          </DialogTitle>
        </DialogHeader>
        {leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No follow-ups scheduled for this day.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {leads.map((lead) => (
              <RescheduleRow key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
