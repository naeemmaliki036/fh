"use client";

import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";

interface AvailableVariablesPanelProps {
  variables: string[];
  onInsert: (varName: string) => void;
}

export function AvailableVariablesPanel({
  variables,
  onInsert,
}: AvailableVariablesPanelProps): ReactElement {
  if (variables.length === 0) {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        No variables defined yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Available variables
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((v) => (
          <Badge
            key={v}
            variant="outline"
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onInsert(v)}
            title={`Click to insert {${v}}`}
          >
            {`{${v}}`}
          </Badge>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Click a variable to insert it at cursor</p>
    </div>
  );
}
