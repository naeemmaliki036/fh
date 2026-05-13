"use client";

import { useRef, useState } from "react";
import { Upload, X, RefreshCw, Link } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadPublicSiteAsset } from "@/lib/api/repositories/public-site-upload.repository";
import type { PublicSitePurpose } from "@/lib/api/repositories/public-site-upload.repository";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export interface ImageUploadFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
  purpose: PublicSitePurpose;
  label: string;
  placeholder?: string;
  className?: string;
  size?: "default" | "compact";
}

function getFilename(url: string): string {
  try {
    return new URL(url).pathname.split("/").pop() ?? url;
  } catch {
    return url;
  }
}

export function ImageUploadField({
  value,
  onChange,
  purpose,
  label,
  placeholder = "https://",
  className,
  size = "default",
}: ImageUploadFieldProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteValue, setPasteValue] = useState(value ?? "");

  const thumbClass = size === "compact" ? "h-12 w-12" : "h-16 w-16";

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after clearing
    e.target.value = "";

    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadPublicSiteAsset(file, purpose);
      onChange(url);
      setPasteValue(url);
      setShowPasteInput(false);
    } catch {
      toast.error(`Failed to upload ${label}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = (): void => {
    onChange(null);
    setPasteValue("");
    setShowPasteInput(false);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = e.target.value;
    setPasteValue(v);
    onChange(v || null);
  };

  if (value && !showPasteInput) {
    return (
      <div className={`flex items-center gap-3 ${className ?? ""}`}>
        <img
          src={value}
          alt={label}
          className={`${thumbClass} rounded-md object-cover border border-border shrink-0`}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-muted-foreground truncate">{getFilename(value)}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Replace
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleClear}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showPasteInput) {
    return (
      <div className={`space-y-1.5 ${className ?? ""}`}>
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={pasteValue}
            onChange={handlePasteChange}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => {
              if (!pasteValue) setShowPasteInput(false);
              else { onChange(pasteValue); setShowPasteInput(false); }
            }}
          >
            Done
          </Button>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => setShowPasteInput(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  // Empty state — upload button + paste URL link
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload {label}
            </>
          )}
        </Button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline"
          onClick={() => setShowPasteInput(true)}
        >
          <Link className="h-3 w-3" />
          or paste URL
        </button>
      </div>
    </div>
  );
}
