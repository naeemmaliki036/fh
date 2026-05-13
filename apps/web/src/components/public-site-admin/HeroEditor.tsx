import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";
import type { ConfigFormValues } from "./types";

interface HeroEditorProps {
  control: Control<ConfigFormValues>;
}

export function HeroEditor({ control }: HeroEditorProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Headline</Label>
        <Controller
          control={control}
          name="hero.headline"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="Find a home worth coming back to." maxLength={200} />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
        <p className="text-xs text-muted-foreground">Falls back to tagline if empty.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Subheadline</Label>
        <Controller
          control={control}
          name="hero.subheadline"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="Curated listings and a smooth process, end to end." maxLength={500} />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Eyebrow pill</Label>
        <Controller
          control={control}
          name="hero.eyebrow"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="Verified properties in Dubai" maxLength={100} />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
        <p className="text-xs text-muted-foreground">Falls back to &quot;Verified properties in &lt;area&gt;&quot; if empty.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Hero image</Label>
        <Controller
          control={control}
          name="hero.image_url"
          render={({ field, fieldState }) => (
            <>
              <ImageUploadField
                purpose="hero"
                label="hero image"
                value={field.value ?? null}
                onChange={(url) => field.onChange(url ?? null)}
              />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
        <p className="text-xs text-muted-foreground">Falls back to first listing photo then Unsplash default.</p>
      </div>
    </div>
  );
}
