"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MAX_TAGS = 5;

const PRESET_TAGS = [
  "Hot Offer",
  "Limited Time",
  "Hot",
  "New",
  "Reduced Price",
  "Exclusive",
  "Off-Plan",
  "Furnished",
  "Pet Friendly",
];

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagsInput({ value, onChange }: TagsInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string): void => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= MAX_TAGS) return;
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (tag: string): void => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const atMax = value.length >= MAX_TAGS;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full hover:bg-muted p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {!atMax && (
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
          placeholder="Type and press Enter or comma..."
          className="h-8 text-sm"
        />
      )}

      <div className="flex flex-wrap gap-1.5">
        {PRESET_TAGS.filter((p) => !value.includes(p)).map((p) => (
          <button
            key={p}
            type="button"
            disabled={atMax}
            onClick={() => addTag(p)}
            className="text-xs px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + {p}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{value.length}/{MAX_TAGS} tags</p>
    </div>
  );
}
