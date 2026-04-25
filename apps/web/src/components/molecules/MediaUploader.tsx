"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

interface MediaUploaderProps { propertyId: string; }

export function MediaUploader({ propertyId }: MediaUploaderProps): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const { mutate: upload, isPending } = useUploadMedia(propertyId);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kind: "image" },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    setFileErr(null); setFile(null);
    if (!f) return;
    if (f.size > MAX_BYTES) { setFileErr("Max 50 MB"); return; }
    setFile(f);
  };

  const onSubmit = (v: FormValues): void => {
    if (!file) { setFileErr("Select a file"); return; }
    upload({ file, kind: v.kind, altText: v.alt_text || undefined }, {
      onSuccess: () => { setFile(null); reset({ kind: "image" }); if (fileRef.current) fileRef.current.value = ""; },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-md border p-4 bg-muted/30 space-y-3">
      <p className="text-sm font-medium">Upload Media</p>
      <div className="flex gap-3 items-end flex-wrap">
        <div className="space-y-1.5">
          <Label>Kind</Label>
          <Controller name="kind" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.kind && <p className="text-xs text-destructive">{errors.kind.message}</p>}
        </div>
        <div className="space-y-1.5 flex-1">
          <Label>Alt Text</Label>
          <Input placeholder="Optional description" {...register("alt_text")} />
        </div>
        <div className="space-y-1.5 flex-1">
          <Label>File</Label>
          <input ref={fileRef} type="file" onChange={handleFile}
            className="block w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-input file:text-sm file:bg-background cursor-pointer" />
          {fileErr && <p className="text-xs text-destructive">{fileErr}</p>}
          {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
        </div>
        <Button type="submit" disabled={isPending || !file} size="sm">
          {isPending ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}
