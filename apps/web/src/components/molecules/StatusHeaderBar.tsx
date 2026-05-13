"use client";

import { useState, type ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusChangeDialog } from "@/components/molecules/StatusChangeDialog";
import type { ReasonOption } from "@/lib/constants/status-reasons";

interface StatusTransition<TStatus extends string> {
  status: TStatus;
  label: string;
  reasonOptions: ReasonOption[];
  destructive?: boolean;
}

interface StatusHeaderBarProps<TStatus extends string> {
  statusBadge: ReactElement;
  transitions: StatusTransition<TStatus>[];
  onChangeStatus: (
    status: TStatus,
    reasonCode: string,
    reasonNote: string | null,
  ) => Promise<void>;
}

export function StatusHeaderBar<TStatus extends string>({
  statusBadge,
  transitions,
  onChangeStatus,
}: StatusHeaderBarProps<TStatus>): ReactElement {
  const [pending, setPending] = useState<StatusTransition<TStatus> | null>(null);

  if (transitions.length === 0) {
    return <>{statusBadge}</>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {statusBadge}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              Change status <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {transitions.map((t) => (
              <DropdownMenuItem
                key={t.status}
                onClick={() => setPending(t)}
                className={t.destructive ? "text-destructive" : ""}
              >
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {pending && (
        <StatusChangeDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null); }}
          title={`${pending.label}?`}
          description={`Change status to "${pending.label}".`}
          reasonOptions={pending.reasonOptions}
          destructive={pending.destructive}
          onConfirm={async (reasonCode, reasonNote) => {
            await onChangeStatus(pending.status, reasonCode, reasonNote);
            setPending(null);
          }}
        />
      )}
    </>
  );
}
