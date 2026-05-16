"use client";

import { useState, type ReactElement } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAmenityCatalog } from "@/hooks/queries/useAmenityCatalog";
import { cn } from "@/lib/utils/cn";
import type { PropertyType } from "@/lib/types/property";
import type { AmenityCategory } from "@/lib/types/amenity";

interface AmenityPickerProps {
  propertyType: PropertyType;
  value: string[];
  onChange: (next: string[]) => void;
}

interface CategorySectionProps {
  category: AmenityCategory;
  selected: string[];
  onToggle: (key: string) => void;
}

function CategorySection({ category, selected, onToggle }: CategorySectionProps): ReactElement {
  const [open, setOpen] = useState(false);
  const selectedCount = category.items.filter((i) => selected.includes(i.key)).length;

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          {category.label}
        </span>
        {selectedCount > 0 && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {selectedCount}
          </Badge>
        )}
      </button>

      {open && (
        <div className="border-t px-3 py-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 bg-muted/20">
          {category.items.map((item) => {
            const checked = selected.includes(item.key);
            return (
              <label
                key={item.key}
                className={cn(
                  "flex items-center gap-2 text-xs cursor-pointer py-0.5 rounded",
                  "hover:text-foreground",
                  checked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.key)}
                  className="h-3.5 w-3.5 accent-primary cursor-pointer"
                />
                {item.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AmenityPicker({ propertyType, value, onChange }: AmenityPickerProps): ReactElement {
  const { data: catalog, isLoading } = useAmenityCatalog();

  const toggle = (key: string): void => {
    onChange(
      value.includes(key) ? value.filter((k) => k !== key) : [...value, key],
    );
  };

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Loading amenities...</div>;
  }

  const applicableCategories = (catalog?.categories ?? [])
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.applies_to.includes(propertyType)),
    }))
    .filter((cat) => cat.items.length > 0);

  if (applicableCategories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No amenity categories available for this property type.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {applicableCategories.map((cat) => (
        <CategorySection
          key={cat.key}
          category={cat}
          selected={value}
          onToggle={toggle}
        />
      ))}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground pt-1">
          {value.length} amenit{value.length === 1 ? "y" : "ies"} selected
        </p>
      )}
    </div>
  );
}
