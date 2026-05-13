"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useUpdateProperty } from "@/hooks/mutations/usePropertyMutations";
import type { Property } from "@/lib/types/property";

const RichTextEditor = dynamic(
  () => import("@/components/molecules/RichTextEditor"),
  { ssr: false, loading: () => <div className="min-h-[70vh] animate-pulse bg-zinc-50 rounded-lg" /> },
);

interface PropertyDescriptionPanelProps {
  property: Property;
}

type EditorMode = "rich" | "plain";

export function PropertyDescriptionPanel({
  property,
}: PropertyDescriptionPanelProps): React.ReactElement {
  const [html, setHtml] = useState<string>(property.description ?? "");
  const [mode, setMode] = useState<EditorMode>("rich");
  const { mutateAsync: updateProperty, isPending } = useUpdateProperty(property.id);

  const handleSave = async (): Promise<void> => {
    await updateProperty({ description: html || null });
  };

  const toggleMode = (): void => {
    setMode((prev) => (prev === "rich" ? "plain" : "rich"));
  };

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleMode}
          className="text-xs text-zinc-500 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          Mode: {mode === "rich" ? "Rich text" : "Plain text"} — switch
        </button>
        <Button
          size="sm"
          onClick={() => void handleSave()}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save description"}
        </Button>
      </div>

      {/* Editor */}
      {mode === "rich" ? (
        <RichTextEditor
          content={html}
          onChange={setHtml}
          placeholder="Write a detailed property description..."
          minHeight="min-h-[70vh]"
        />
      ) : (
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={20}
          placeholder="Write a detailed property description..."
          className="w-full rounded-lg border border-zinc-200 p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[70vh]"
        />
      )}
    </div>
  );
}
