"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterPillDropdownProps {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}

export function FilterPillDropdown({
  label,
  active = false,
  children,
}: FilterPillDropdownProps): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
            active
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-border bg-card text-foreground hover:border-slate-400"
          }`}
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px] p-3">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
