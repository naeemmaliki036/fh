"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, ArrowRight } from "lucide-react";
import { uploadPublicSiteAsset } from "@/lib/api/repositories/public-site-upload.repository";

interface UploadPopoverProps {
  type: "image" | "video";
  onInsert: (url: string) => void;
  onClose: () => void;
}

export function UploadPopover({ type, onInsert, onClose }: UploadPopoverProps): React.ReactElement {
  const [pasteUrl, setPasteUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isImage = type === "image";
  const accept = isImage
    ? "image/jpeg,image/png,image/webp,image/gif"
    : "video/mp4,video/webm";
  const maxMB = isImage ? 10 : 50;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large. Max ${maxMB} MB.`);
      return;
    }
    try {
      setProgress(10);
      const result = await uploadPublicSiteAsset(file, "hero");
      setProgress(100);
      onInsert(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
    }
  }, [maxMB, onInsert]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const handlePasteUrl = () => {
    const url = pasteUrl.trim();
    if (url) onInsert(url);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1 z-50 w-72 bg-white border border-zinc-200 rounded-lg shadow-lg p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-700">
          {isImage ? "Insert Image" : "Insert Video"}
        </p>
        <button type="button" onClick={onClose} className="p-0.5 text-zinc-400 hover:text-zinc-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-zinc-200 hover:border-primary/40"
        }`}
      >
        {progress !== null ? (
          <div className="w-full space-y-1.5">
            <p className="text-[11px] text-zinc-500 text-center">Uploading... {progress}%</p>
            <div className="h-1.5 bg-zinc-100 rounded overflow-hidden">
              <div
                className="h-full bg-primary rounded transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 text-zinc-300" />
            <p className="text-[11px] text-zinc-500">
              Drop {isImage ? "image" : "video"} or{" "}
              <span className="text-primary font-medium">browse</span>
            </p>
            <p className="text-[10px] text-zinc-400">Max {maxMB} MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" />
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
          <div className="flex-1 h-px bg-zinc-200" />
          <span>or paste URL</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>
        <div className="flex gap-1">
          <input
            type="url"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handlePasteUrl(); }}
            placeholder={isImage ? "https://example.com/image.jpg" : "https://youtube.com/watch?v=..."}
            className="flex-1 text-xs border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handlePasteUrl}
            disabled={!pasteUrl.trim()}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-80 disabled:opacity-40 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && <p className="text-[11px] text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
