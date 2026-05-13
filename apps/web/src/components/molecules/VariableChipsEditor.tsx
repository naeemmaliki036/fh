"use client";

import { useState, type KeyboardEvent, type ReactElement } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VariableChipsEditorProps {
  value: string[];
  onChange: (vars: string[]) => void;
  disabled?: boolean;
}

export function VariableChipsEditor({
  value,
  onChange,
  disabled = false,
}: VariableChipsEditorProps): ReactElement {
  const [input, setInput] = useState("");

  function addVar(raw: string): void {
    const trimmed = raw.trim().replace(/\s+/g, "_");
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  }

  function removeVar(name: string): void {
    onChange(value.filter((v) => v !== name));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addVar(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-2 min-h-[42px]">
      {value.map((v) => (
        <Badge key={v} variant="secondary" className="gap-1">
          {v}
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-3 w-3 p-0 hover:bg-transparent"
              onClick={() => removeVar(v)}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addVar(input)}
          placeholder="Add variable, press Enter"
          className="h-6 min-w-[140px] flex-1 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          disabled={disabled}
        />
      )}
    </div>
  );
}
