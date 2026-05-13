"use client";

import type { ComponentType, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";

export interface IconTabItem {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface IconTabsProps {
  items: IconTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

export function IconTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: IconTabsProps): React.ReactElement {
  const tabsProps = value !== undefined
    ? { value, onValueChange }
    : { defaultValue: defaultValue ?? items[0]?.value };

  return (
    <Tabs {...tabsProps} className={cn("w-full", className)}>
      <TabsList className="h-auto rounded-xl bg-slate-100 p-1 gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-card"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
