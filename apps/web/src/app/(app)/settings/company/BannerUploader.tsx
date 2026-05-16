"use client";

import { useRef, useState } from "react";
import { Upload, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadPublicSiteAsset } from "@/lib/api/repositories/public-site-upload.repository";
import { useUpdateMyTenant } from "@/hooks/mutations/useTenantMutations";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

interface BannerUploaderProps {
  currentUrl: string | null;
  canEdit: boolean;
}

export function BannerUploader({ currentUrl, canEdit }: BannerUploaderProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { mutate: update, isPending: saving } = useUpdateMyTenant();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Only JPEG, PNG, or WebP images allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File must be under 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadPublicSiteAsset(file, "hero");
      update({ banner_url: url });
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(): void {
    update({ banner_url: null });
  }

  const isBusy = uploading || saving;

  return (
    <div className="space-y-3">
      {/* 16:9 preview */}
      <div className="aspect-video max-w-lg rounded-xl border border-dashed border-border bg-muted/30 overflow-hidden flex items-center justify-center relative">
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition" />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No banner set</p>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {isBusy ? (
              <><RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="mr-1.5 h-4 w-4" /> {currentUrl ? "Replace banner" : "Upload banner"}</>
            )}
          </Button>
          {currentUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={isBusy}
              onClick={handleRemove}
            >
              <X className="mr-1 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Recommended: 1280 × 720px, max 10 MB. JPEG, PNG, WebP.</p>
    </div>
  );
}
