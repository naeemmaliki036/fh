"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadMedia } from "@/hooks/mutations/useMediaMutations";
import type { MediaKind } from "@/lib/types/media";

const MAX_BYTES = 50 * 1024 * 1024;
const KINDS: { value: MediaKind; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "floorplan", label: "Floorplan" },
  { value: "brochure", label: "Brochure" },
];
const KIND_VALUES = KINDS.map(k => k.value) as [MediaKind, ...MediaKind[]];
const schema = z.object({ kind: z.enum(KIND_VALUES), alt_text: z.string().optional() });
type FormValues = z.infer<typeof schema>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface MediaUploaderProps { propertyId: string; }

export function MediaUploader({ propertyId }: MediaUploaderProps): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const { mutate: upload, isPending } = useUploadMedia(propertyId);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: "image" },
  });

  function validateAndSet(f: File | null): void {
    setFileErr(null); setFile(null);
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
    if (!allowed.includes(f.type)) {
      setFileErr("Unsupported file type — images (jpg/png/webp) and videos (mp4/webm) only");
      return;
    }
    if (f.size > MAX_BYTES) { setFileErr("Max 50 MB"); return; }
    setFile(f);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>): void {
    validateAndSet(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(false);
    validateAndSet(e.dataTransfer.files?.[0] ?? null);
  }

  function clearFile(): void {
    setFile(null);
    setFileErr(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const onSubmit = (v: FormValues): void => {
    if (!file) { setFileErr("Select a file"); return; }
    upload({ file, kind: v.kind, altText: v.alt_text || undefined }, {
      onSuccess: () => { setFile(null); reset({ kind: "image" }); if (fileRef.current) fileRef.current.value = ""; },
    });
  };

  const dropZoneCls = [
    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-6",
    "text-center transition cursor-pointer",
    dragging
      ? "border-primary bg-primary/5"
      : file
      ? "border-emerald-300 bg-emerald-50/40"
      : "border-slate-200 hover:border-primary/50 hover:bg-muted/40",
  ].join(" ");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Upload media</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
        <div className="space-y-1.5">
          <Label>Media Type</Label>
          <Controller name="kind" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.kind && <p className="text-xs text-destructive">{errors.kind.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Alt text <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Input placeholder="Short description for accessibility" {...register("alt_text")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>File</Label>
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3">
            <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-full p-1 hover:bg-emerald-100 text-emerald-700"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={dropZoneCls}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 text-slate-400" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP, MP4, WEBM · max 50 MB
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onChange={handleFile}
          className="hidden"
        />
        {fileErr && <p className="text-xs text-destructive">{fileErr}</p>}
      </div>

      <Button type="submit" disabled={isPending || !file} className="w-full sm:w-auto">
        {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</> : "Upload media"}
      </Button>
    </form>
  );
}
