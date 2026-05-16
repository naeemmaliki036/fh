"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent } from "@/lib/types/agent";
import type { DealType } from "@/lib/types/deal";

export interface ClosedDealsFilterValues {
  from_date: string;
  to_date: string;
  agent_id: string;
  deal_type: DealType | "";
}

interface ClosedDealsFiltersProps {
  filters: ClosedDealsFilterValues;
  agents: Agent[];
  onFiltersChange: (filters: ClosedDealsFilterValues) => void;
  onExportCsv: () => void;
}

export function ClosedDealsFilters({
  filters,
  agents,
  onFiltersChange,
  onExportCsv,
}: ClosedDealsFiltersProps): React.ReactElement {
  const update = (patch: Partial<ClosedDealsFilterValues>): void => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
      <div className="space-y-1">
        <Label className="text-xs">From date</Label>
        <Input
          type="date"
          value={filters.from_date}
          onChange={(e) => update({ from_date: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To date</Label>
        <Input
          type="date"
          value={filters.to_date}
          onChange={(e) => update({ to_date: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Agent</Label>
        <Select
          value={filters.agent_id || "all"}
          onValueChange={(v) => update({ agent_id: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-44"><SelectValue placeholder="All agents" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Deal type</Label>
        <Select
          value={filters.deal_type || "all"}
          onValueChange={(v) => update({ deal_type: v === "all" ? "" : (v as DealType) })}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="sale">Sale</SelectItem>
            <SelectItem value="rent_short">Rent (short)</SelectItem>
            <SelectItem value="rent_long">Rent (long)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="ml-auto" onClick={onExportCsv}>
        <Download className="h-4 w-4 mr-1.5" />Export CSV
      </Button>
    </div>
  );
}
